var PacFactory=require('../gregnet_modules/PacFactory/PacFactory.js'); //producer client
var KeycloakMapper = require("./KeycloakMapper.js")
var KeycloakProducer = require("./KeycloakProducer.js")
//require("../jsap.js"); //jsap configuration file
/*####################################
|| NAME: KEYCLOAK ADAPTER
|| AUTHOR: Gregorio Monari
|| DATE: 29/11/2022
|| NOTES: Brings togheder Keycloak Producer and mapper
######################################*/

//KEYCLOAK PRODUCER CLASS
class KeycloakAdapter extends KeycloakProducer{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################")
    console.log("║║ # App: Keycloak Adapter v0.1.1");
    console.log("║║ ###########################");
    super(jsap_file);
    this.mapper= new KeycloakMapper(jsap_file);
    
  }


  async start(){
    super.start() //AVVIA PRODUCER
    var admin_config={ //CONNETTITI AL MASTER REALM, DEVI ESSERE ADMIN
        hostname:"keycloak.vaimee.org",
        protocol:"https",
        realm:"master",
        client_id:"admin-cli",
        client_secret:"rFGrvQe5mQgQ95HjeU8f6Sw6LDI7MKib"
    }
    this.httpClient.config(admin_config) //configura keycloak client
    this.synchronizeKeycloakUsers() //LEGGI TUTTI GLI UTENTI
  }

  async onNewSignal(e){
    this.log.info("--------------------------------");
    this.log.info("# New webhook signal received! #");
    if(this.validateJson(e.req.body)){//validate json package
      this.log.debug("Correct json schema verified, sending success message to server");
      e.res.send('GOOD STRUCTURED REQUEST RECEIVED');//send succesful request message
      //process sepa request
      var userBindings=this.mapper.mapMessage(e.req.body) //MAPPER MAPPING FUNCTION
      this.log.info("Updating user:")
      console.log(userBindings)
      await this.ADD_USER(userBindings)
    }else{
      this.log.error("Unknow Json schema, sending error message to client")
      e.res.send('ERROR: JSON SCHEMA UNKNOWN')
    }
  }


  async synchronizeKeycloakUsers(){
    console.log("SYNCHRONIZING USERS")
    await this.httpClient.set_AdminAccessToken({
        grant_type: "password",
        username: "admin",
        password: "Gregnet/99"
    })

    var path="/auth/admin/realms/my2sec-realm/users"
    var data="{}"
    var res=await this.httpClient.auth_get(path,data,"application/json")
    res=JSON.parse(res)
    for(var k in res){
        console.log(res[k])
        var bindings=this.mapper.mapMessage({
            webhook_event_package:{
                data: res[k]
            }
        })
        console.log(bindings)
        var r=await this.ADD_USER(bindings)
        console.log(JSON.stringify(r))
    }
    
  }


}


module.exports = KeycloakAdapter;






//--INITIALIZATION FINISHED, DO OTHER STUFF
//initTest("test_1");

/*
initTest()

async function initTest(){
  var multiple_forced_bindings={
    source:[],
    msgtimestamp:[],
    msgvalue:[]
  }

  await delete_db()
  await query_db()
  await update_multiple_bindings(multiple_forced_bindings)
  await query_db()

}

function update_multiple_bindings(multiple_forced_bindings){
  return new Promise(resolve=>{
    _producer.SEND_KEYCLOAK_MESSAGE(multiple_forced_bindings)//send message to sepa
    .then(res=>{
      _producer.info("Sepa engine updated correctly! Response: "+JSON.stringify(res))
      resolve(res)
    });
  });
}


function query_db(){
  return new Promise(resolve=>{
    let sub = _producer.QUERY_ALL_DB({})
    //sub.on("subscribed",console.log)
    sub.on("notification", not => {
      console.log("QUERY RESULTS:");
      console.log(JSON.stringify(not.addedResults.results.bindings, null, 2));
      sub.unsubscribe()
      resolve("QUERY FINISHED")
    })
    sub.on("error",console.error)
  });
}



function delete_db(){
  return new Promise(resolve=>{
      _producer.DELETE_ALL_DB({})
          .then(()=>{
            console.log("DB DELETED")
            resolve("DELETED")
          })
  })
}
*/


