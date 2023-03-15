var Consumer=require('../gregnet_modules/PacFactory/Pattern/Consumer.js'); //producer client
var OpClient=require('../gregnet_modules/PacFactory/OpenProjectClient.js');
//require("../jsap.js"); //jsap configuration file
//var events=require("events")
/*###########################################
|| NAME: KEYCLOAK MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Jeycloak messages into users
############################################*/
class OpUsersConsumer extends Consumer{

  //============= CLASS CONSTRUCTOR ==============
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################")
    console.log("║║ # App: OpUsersConsumer v0.2");
    console.log("║║ ###########################");
    super(jsap_file,"ALL_USERNAMES",{});
    this.log.loglevel=0;
    this.opClient=new OpClient({
        host:"openproject",//"localhost",//
        port:80,//889,//
        clientId:"pIuaMa7WY4xwkkVNobDjQpp_OSjzsUrMXEKnjCVkWQA",
        clientSecret:"nNFyLa7MRSJ2Pnq9ju8_f3Lg4FxRW4Gs1EdFgfIAHr4",
        apiKey:"bcc95e391fc9f7eee77aa7cb3bbc8cd126108d6a6623c944a72d56f09e3bd633"
      });
  }

  //============ CALL TO START APP ===============
  async start(){
    //Test DataSource
    await this.testSepaSource();
    this.subscribeToSepa();
  }


  async createNewOpenProjectUser(mail, username) {
    //var data = {
    //    
    //};
    //this.opClient.patch_auth_resource('/api/v3/users', data);
  }

  async createNewOpenProjectTasks(mail, username) {
  }
  
  //ON NOTIFICATION
  //@OVERRIDE
  onFirstResults(not){
    this.log.trace("First results for "+this.queryname+" consumer: "+JSON.stringify(not));
    this.onAddedResults(not);
    this.log.info("Ignored first results");
  }
  async onAddedResults(not){
    this.log.trace("Added results for "+this.queryname+" consumer: "+JSON.stringify(not));
    //this.onAddedUser(not);
    this.log.info(not.s);
    var arr = not.s.split('/')
    var mail = arr[arr.length - 1].trim()
    console.log(mail);
    await this.createNewOpenProjectUser(mail, not.o)
    await this.createNewOpenProjectTasks(mail, not.o)
  }


  onRemovedResults(not){
    this.log.trace("Removed results for "+this.queryname+" consumer: "+not);
  }
  onError(err){
    throw new Error(`Error from ${this.queryname} consumer: ${err}`)
  }


  //MANAGE STOP MODULE
  async stop(){
    process.exit();
  }


}//end of class 



module.exports = OpUsersConsumer;