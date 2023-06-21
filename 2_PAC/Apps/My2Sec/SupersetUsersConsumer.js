var Consumer=require('../../core/Pattern/Consumer.js'); //producer client
var SqlClient=require('../../core/clients/mysql_client.js');
//require("../jsap.js"); //jsap configuration file
//var events=require("events")
/*###########################################
|| NAME: KEYCLOAK MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Jeycloak messages into users
############################################*/
class SupersetUsersConsumer extends Consumer{

  //============= CLASS CONSTRUCTOR ==============
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################")
    console.log("║║ # App: Superset Users Consumer v0.2");
    console.log("║║ ###########################");
    super(jsap_file,"ALL_USERNAMES",{});
    this.sqlClient=new SqlClient()
    this.log.loglevel=1;
  }

  //============ CLASS METHODS ===============
  async onAddedUser(binding){
    this.log.info("------------------------------------")
    this.log.info("# NEW USER RECEIVED: "+binding.s+" #");
    var tableString=this.usergraph2tablename(binding)
    await this.sqlClient.createTable(tableString)
    /*await this.createNewSupersetUser({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: ""
    });
    await this.createNewSupersetUserDashboard(bindings.user_name)
    */
  }

  usergraph2tablename(binding){
    var stringArr=binding.s.split("/");
    //console.log(stringArr)
    var tableString=stringArr[stringArr.length-1]
    //ora abbiamo la mail, leva punti e chiocciole
    tableString=tableString.replace(/\./g,"_");
    tableString=tableString.replace(/\@/g,"_");
    this.log.debug("Cleaned user string: "+tableString) 
    return tableString  
  }

  //============ CALL TO START APP ===============
  async start(){
    //Test DataSource
    await this.testSepaSource();
    //Connect To SQL
    await this.sqlClient.connect({
        host: "dld.arces.unibo.it",
        port: "3309",
        user:   "root",
        password: "Gregnet/99",
        database: "SqlConsumerTest",
    });
    this.sqlClient.setTableSchema("datetime DATETIME(6), event_type VARCHAR(255), app_name VARCHAR(255), app_title VARCHAR(255), activity_type VARCHAR(255), task VARCHAR(255), duration DOUBLE")
    this.subscribeToSepa();
    this.log.info("##### APP INITIALIZED ######")
  }




  /*
  async createSqlUserTable(usergraph){
    var data=`
    CREATE TABLE ${usergraph} 
    (
      datetime DATETIME(6), 
      event_type VARCHAR(255), 
      app_name VARCHAR(255), 
      app_title VARCHAR(255), 
      activity_type VARCHAR(255), 
      task VARCHAR(255), 
      duration DOUBLE 
    )
    `
    console.log(data)
    throw new Error("MAO")
    return await this.rawSqlQuery()
  }
  */

  async createNewSupersetUser(){

  }

  async createNewSupersetUserDashboard(){

  }




  //ON NOTIFICATION
  //@OVERRIDE
  onFirstResults(not){
    this.log.trace("First results for "+this.queryname+" consumer: "+JSON.stringify(not));
    this.onAddedResults(not);
  }
  onAddedResults(not){
    this.log.trace("Added results for "+this.queryname+" consumer: "+not);
    this.onAddedUser(not);
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



module.exports = SupersetUsersConsumer;