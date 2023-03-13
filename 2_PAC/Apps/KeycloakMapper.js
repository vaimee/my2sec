var PacFactory=require('../gregnet_modules/PacFactory/PacFactory.js'); //producer client
//require("../jsap.js"); //jsap configuration file
//var events=require("events")
/*###########################################
|| NAME: KEYCLOAK MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Jeycloak messages into users
############################################*/
class KeycloakMapper extends PacFactory{

  //============= CLASS CONSTRUCTOR ==============
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################");
    console.log("║║ # App: Keycloak mapper v0.1");
    console.log("║║ ###########################");
    super(jsap_file);
  }

  //============ CALL TO START APP ===============
  async start(){
    //Test DataSource
    await this.testSepaSource();
    //Subscribe to Sepa
    this.newSubRouter("allGraphMessages",{
      graph:"http://www.vaimee.it/my2sec/members",
      source: "http://www.vaimee.it/sources/keycloak"
    },"onNotification")
    //finish
    this.log.info("##### APP INITIALIZED ######")
  }


  async onNotification(jsonArr){
    this.log.info("-------------------------")
    this.log.info("# NEW NOTIFICATION RECEIVED! #");
    this.log.info("Unpacking "+jsonArr.length+" results")
    //Map Messages
    var userBindings;
    Object.keys(jsonArr).forEach(k=>{
      userBindings={}
      userBindings=this.mapMessage(JSON.parse(jsonArr[k].json_message))
      this.log.info("Updating user:")
      console.log(userBindings)
      this.sparqlUpdate("ADD_USER",userBindings)
    })
  }

  mapMessage(jsonMessage){
    var payload=jsonMessage.webhook_event_package.data;
    return {
      usergraph:"http://www.vaimee.it/my2sec/"+payload.email,
      username_literal: payload.userName ? payload.userName : payload.username
    }
  }

}//end of class 



module.exports = KeycloakMapper;