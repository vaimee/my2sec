var Consumer=require('../gregnet_modules/PacFactory/Pattern/Consumer'); //Pac Factory
var SqlClient=require('../gregnet_modules/PacFactory/mysql_client.js');
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class SqlActivitiesConsumer extends Consumer{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################");
    console.log("║║ # App: Sql Activities Consumer v0.1");
    console.log("║║ ###########################");
    super(jsap_file,"ALL_USERS_ACTIVITIES",{});
    this.log.loglevel=1;
    this.sqlClient=new SqlClient()
  }
  //START
  async start(){
    this.subscribeToSepa();
    this.sqlClient.connect({
        host: "dld.arces.unibo.it",
        port: "3309",
        user:   "root",
        password: "Gregnet/99",
        database: "SqlConsumerTest",
    });
  }

  //MAIN FUNCTION: ADDS ACTIVITIES TO SQL TABLE
  async add_sql_activity(binding){
    //console.log(binding)
    var variables=this.binding2variable(binding)
    var tableName=this.usergraph2tablename(binding)
    await this.sqlClient.inject(tableName,variables)
    this.log.debug("Added activity to mysql for: "+binding.usergraph);
  }
  usergraph2tablename(binding){
    var stringArr=binding.usergraph.split("/");
    //console.log(stringArr)
    var tableString=stringArr[stringArr.length-1]
    //ora abbiamo la mail, leva punti e chiocciole
    tableString=tableString.replace(/\./g,"_");
    tableString=tableString.replace(/\@/g,"_");
    this.log.trace("Cleaned user string: "+tableString) 
    return tableString  
  }
  //datetime DATETIME(6), event_type VARCHAR(255), app_name VARCHAR(255), app_title VARCHAR(255), activity_type VARCHAR(255), task VARCHAR(255), duration DOUBLE
  binding2variable(binding){
    var variables={}
    variables["datetime"]=binding.datetimestamp;
    variables["event_type"]=binding.event_type;
    var appTemp=binding.app;
    if(appTemp.length>250){
        appTemp=appTemp.slice(0,250)
    }
    variables["app_name"]=appTemp;
    var titleTemp=binding.title;
    if(titleTemp.length>250){
        titleTemp=titleTemp.slice(0,250)
    }
    titleTemp=titleTemp.replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
    titleTemp=titleTemp.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
    variables["app_title"]=titleTemp;
    variables["activity_type"]=binding.activity_type;
    variables["task"]="None";
    variables["duration"]=binding.duration;
    //console.log(variables)
    return variables;
  }

  //ON NOTIFICATION
  //@OVERRIDE
  onFirstResults(not){
    this.log.trace("First results for "+this.queryname+" consumer: "+JSON.stringify(not));
    //this.onAddedResults(not);
    this.log.warning("Ignored first activities results")
  }
  onAddedResults(not){
    this.log.trace("Added results for "+this.queryname+" consumer: "+not);
    this.add_sql_activity(not);
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



module.exports = SqlActivitiesConsumer;