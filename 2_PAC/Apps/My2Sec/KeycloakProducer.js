var PacFactory=require('../../core/PacFactory.js'); //producer client
//require("../jsap.js"); //jsap configuration file
/*####################################
|| NAME: KEYCLOAK PRODUCER
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Test class structure
######################################*/

//KEYCLOAK PRODUCER CLASS
class KeycloakProducer extends PacFactory{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################")
    console.log("║║ # App: Keycloak Producer v0.1.1");
    console.log("║║ ###########################");
    super(jsap_file);
  }

  //initialize app
  start(){
    //create http routers
    this.newGetRouter("/api/keycloak/webhook/helloproducer","onHello")
    this.newPostRouter("/api/keycloak/webhook/signalnewevent","onNewSignal")
    //----LISTEN TO REQUESTS----
    this.listen(1357);
    this.log.info("##### APP INITIALIZED ######")
  }

  onHello(e){
    this.log.info("--------------------------------");
    this.log.info("# New Discovery Request received! #");
    e.res.send("HELLO!");
    this.log.info("Discovery request served correctly");
  }

  async onNewSignal(e){
    this.log.info("--------------------------------");
    this.log.info("# New webhook signal received! #");
    if(this.validateJson(e.req.body)){//validate json package
      this.log.debug("Correct json schema verified, sending success message to server");
      e.res.send('GOOD STRUCTURED REQUEST RECEIVED');//send succesful request message
      //process sepa request
      var messageBindings=this.buildMessageBindings(e.req.body);//construct forced bindings
      this.log.debug("Constructed forced bindings, sending message:\n"+messageBindings);
      var res = await this.SEND_KEYCLOAK_MESSAGE(messageBindings);//update sepa
      console.log("Update response: "+JSON.stringify(res))
    }else{
      this.log.error("Unknow Json schema, sending error message to client")
      e.res.send('ERROR: JSON SCHEMA UNKNOWN')
    }
  }

  buildMessageBindings(body){
    var messageText=JSON.stringify(body);
    messageText=messageText.replace(/\"/g,"\\\""); //POI GLI ASTERISCHI
    messageText=messageText.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
    messageText=messageText.replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
	  
    console.log(messageText)
    var timestamp=body.webhook_event_package.timestamp;
    var message_data={
      graph: "http://www.vaimee.it/my2sec/messages/keycloak",
      source: "http://www.vaimee.it/sources/keycloak",
      msgtimestamp:timestamp,
      msgvalue:JSON.stringify(body)
    };
    return message_data;
  }

  //custom function to validate json messages
  validateJson(body){
    if(body.hasOwnProperty("webhook_event_package")){
      return true;
    }else{
      return false;
    }
  }

}


module.exports = KeycloakProducer;






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


