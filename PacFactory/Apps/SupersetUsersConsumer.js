var PacFactory=require('../gregnet_modules/PacFactory/PacFactory.js'); //producer client
//require("../jsap.js"); //jsap configuration file
//var events=require("events")
/*###########################################
|| NAME: KEYCLOAK MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Jeycloak messages into users
############################################*/
class SupersetUsersConsumer extends PacFactory{

  //============= CLASS CONSTRUCTOR ==============
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################")
    console.log("║║ # App: Superset Users Consumer v0.1");
    console.log("║║ ###########################");
    super(jsap_file);
  }

  //============ CALL TO START APP ===============
  async start(){
    //Test DataSource
    await this.testSepaSource();
    //Connect To SQL
    await this.sqlConnect({
      host: "localhost",
      port: "3306",
      user: "root",
      password: "Gregnet/99",
      database: "TESTDB"
    });
    //var queryres=await this.rawSqlQuery("SELECT * FROM people")
    //console.table(queryres)
    //Subscribe to Sepa
    this.newSubRouter("ALL_USERNAMES",{},"onAddedUser")
    //finish
    this.log.info("##### APP INITIALIZED ######")
  }


  //============ CLASS METHODS ===============
  async onAddedUser(bindings){
    this.log.info("-------------------------")
    this.log.info("# NEW NOTIFICATION RECEIVED! #");
    this.log.info("Unpacking "+bindings.length+" results")
    console.log(bindings)
    await this.createSqlUserTable(bindings.usergraph)
    await this.createNewSupersetUser({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: ""
    });
    await this.createNewSupersetUserDashboard(bindings.user_name)
  }

  async createSqlUserTable(usergraph){
    return await this.rawSqlQuery(`
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
    `)
  }

  async createNewSupersetUser(){

  }

  async createNewSupersetUserDashboard(){

  }


}//end of class 



module.exports = SupersetUsersConsumer;