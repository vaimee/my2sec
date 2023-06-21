var AwMessagesConsumer=require('../../core/Pattern/My2Sec/AwMessagesConsumer.js'); //Pac Factory
var Producer=require('../../core/Pattern/Producer.js'); //Pac Factory
var GregLogs = require("../../utils/GregLogs.js");
const UsersProfessionsConsumer = require('../../core/Pattern/My2Sec/UsersProfessionsConsumer.js');
const MongoDbClient = require('../../core/clients/MongoDbClient');
const MongoDbMessagesRemover=require("../../core/Pattern/My2Sec/MongoDbMessagesRemover")
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
/*
  TODO: MAKE SMART WORKER CONFIGURABLE, update to different graphs
*/
class AwMapper{
  constructor(jsap_file){
    //TITLE
    console.log("###########################");
    console.log("# App: ActivityWatch mapper v0.1");
    console.log("###########################");
    const config=this.getMongoDbClientConfigurationFromJsap(jsap_file)
    this.mongoClient=new MongoDbClient(config.uri,config.database,config.collection);
    this.log = new GregLogs();
    //this.log.loglevel=1;
    this._ACTIVE_PROCESSES=0;
    //!FALLBACK
    this.DEFAULT_EVENTS_GRAPH="";
    //?NEW
    this.usersProfessionsConsumer=new UsersProfessionsConsumer(jsap_file)

    //Configure awmessages consumer
    var messagesquery="ALL_USERS_MESSAGES";
    var data={
      message_graph: "http://www.vaimee.it/my2sec/messages/activitywatch/mongo"
    }
    var flagname="http://www.vaimee.it/my2sec/awmongoproducerflag"
    this.awMessagesConsumer=new AwMessagesConsumer(jsap_file)//new SynchronousConsumer(jsap_file,messagesquery,data,flagname,false);

    this.awMessagesConsumer.getFlagEmitter().on("newsyncflag",not=>{
      this.on_production_finished(not).catch((error)=>{
        //ERROR HANDLING PROCEDURE
        this.log.error("Unhandled error in on_production_finished(). I caught it for you!")
        console.log(error)
        //send(error)
      })
    }) //when the flag consumer emits a flag
    //Configure awmessages remover
    //this.awMessagesRemover=new Producer(jsap_file,"DELETE_MESSAGE");
    this.awMessagesRemover=new MongoDbMessagesRemover(jsap_file)
    //this.awMessagesRemover.log.loglevel=this.log.loglevel;
    //Configure awevents producer and remover
    this.awEventsProducer=new Producer(jsap_file,"ADD_TRAINING_EVENT");
    //this.awEventsProducer.log.loglevel=this.log.loglevel;
    this.awmapperFlagProducer= new Producer(jsap_file,"SET_SYNCHRONIZATION_FLAG");
    //this.awmapperFlagProducer.log.loglevel=this.log.loglevel;
  }


  getMongoDbClientConfigurationFromJsap(jsap){
    return jsap.extended.MongoDbClientConfiguration
  }

  async start(){
    this.awMessagesConsumer.subscribeToSepa()
    this.usersProfessionsConsumer.subscribeToSepa()
  }
  async exit(){
    this.awMessagesConsumer.exit()
  }

  async on_production_finished(flagbind){
    var pnum=this._ACTIVE_PROCESSES;
    this._ACTIVE_PROCESSES++
    var usergraph=flagbind.usergraph;
    var messages=this.awMessagesConsumer.get_cache_by_user(flagbind.usergraph);
    this.log.info("(process"+pnum+") Mapping for "+flagbind.usergraph+" started, "+messages.length+" messages left to map")
    for(var k in messages){
      await this.on_new_message(messages[k])
    }
    this.log.info("(process"+pnum+") Mapping for "+flagbind.usergraph+" finished, sending flag...")
    
    //!UPDATED FLAG
    var mapper_flag="http://www.vaimee.it/my2sec/awmapperflag"
    if(!this.usersProfessionsConsumer.get_cache().has(flagbind.usergraph)){
      this.log.error("Error, user does not have a profession. Using default flag: "+mapper_flag)
    }else{
      var currUserProfessionCache=this.usersProfessionsConsumer.get_cache().get(flagbind.usergraph);
      if(currUserProfessionCache.has("awmapperFlag")){
        mapper_flag=currUserProfessionCache.get("awmapperFlag")
      }else{
        this.log.error("Error, user does not have a flag_type. Using default flag: "+mapper_flag)
      }
    }
    this.log.debug("Sending flag with type: "+mapper_flag)
    await this.awmapperFlagProducer.updateSepa({
      flag_type:mapper_flag,//"http://www.vaimee.it/my2sec/awmapperflag",
      usergraph:usergraph
    })
    this._ACTIVE_PROCESSES--
  }

 

  async get_msg_value(value){
    //TODO: decide if its a mongo or normal message
    //original: return JSON.parse(binding.msgvalue);
    this.log.debug("Fetching mongodb file for message value: "+value)
    var file=await this.mongoClient.getFileByObjectId(value)
    //console.log(file)
    return file.value
  }
  async on_new_message(binding){
    this.log.info("--------------------------------------------------")
    var msg=await this.get_msg_value(binding.msgvalue)//extract json from binding
    this.log.info(`# Mapping message, user: ${binding.usergraph}, Source: ${binding.source}, Timestamp: ${binding.msgtimestamp}, Events to Map: ${msg.length}`);
    //-----------------------------Map Message--------------------------------------------
    //console.log(binding)
    try{
      var data=null;
      switch (binding.source) {
        case "http://www.vaimee.it/sources/aw-watcher-working":
          data=this.mapAwWorkingMessage(binding.usergraph,msg);
          this.log.info("Aw-working Message mapped")        
          break;
  
        case "http://www.vaimee.it/sources/aw-watcher-afk":
          data=this.mapAwAfkMessage(binding.usergraph,msg);
          this.log.info("Aw-afk Message mapped")   
        break;
      
        case "http://www.vaimee.it/sources/aw-watcher-start-stop":
          data=this.mapAwStartStopMessage(binding.usergraph,msg);
          this.log.info("Aw-StartStop Message mapped")   
        break;

        case "http://www.vaimee.it/sources/aw-watcher-notshutdown":
          data=this.mapAwNotShutdownMessage(binding.usergraph,msg);
          this.log.info("Aw-NotShutdown Message mapped")   
        break;


        default:
          this.log.warning("Unknown source, skipping message")
          break;
      }

  
      //-------------------------Update Events-------------------------------------------
      if(Object.keys(msg).length===0){ 
        throw new Error("EMPTY MESSAGE RECEIVED: "+JSON.stringify(msg)+", SKIPPING UPDATE EVENTS") 
      }
      if(data==null){ 
        throw new Error("UNKNOWN MESSAGE RECEIVED, SKIPPING UPDATE EVENTS") 
      }
      //console.log(data)
      //console.log("MOA")

      //!DEFAULT EVENTS GRAPH!
      var events_graph="http://vaimee.it/my2sec/events"
      if(!this.usersProfessionsConsumer.get_cache().has(binding.usergraph)){
        this.log.error("Error, user does not have a profession. Using default graph: "+events_graph)
      }else{
        var currUserProfessionCache=this.usersProfessionsConsumer.get_cache().get(binding.usergraph);
        events_graph=currUserProfessionCache.get("events_graph")
      }
      this.log.debug("Sending message to graph: "+events_graph)

      data["events_graph"]=events_graph //AGGIUNGI EVENTS GRAPH
      //console.log(data)

      var res=await this.awEventsProducer.updateSepa(data)
      //this.log.debug("Update response: "+JSON.stringify(res))
      
      //console.log("MAO")
      //-------------------------Delete Message-----------------------------------------
      var object_id=binding.msgvalue
      res=await this.awMessagesRemover.updateSepaAndMongo({
        message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch/mongo",
        message: binding.b
      },object_id)
      //console.log("MIUS")
      this.log.trace("Delete response: "+JSON.stringify(res))


    }catch(e){
      this.log.error(" A new error has been catched =( But the Show must go on!")
      //console.log(e.response.data.error_description)
      console.log(e)
    }
    
  }
  

  mapAwWorkingMessage(usergraph,awMsg){
    var forcedBindings={
      usergraph:usergraph,
      event_type:"my2sec:windowEvent",
      datetimestamp:[],
      app:[],
      title:[],
      activity_type:"my2sec:none",
      task:"none",
      duration:[],
    };
    Object.keys(awMsg).forEach(index=>{
      forcedBindings.datetimestamp[index]=awMsg[index].timestamp;
      forcedBindings.app[index]=awMsg[index].data.app;
      var title=awMsg[index].data.title.replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
      title=title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
      forcedBindings.title[index]=title;
      //forcedBindings.activity_type[index]="sw:none";//"sw:"+awMsg[index].data.activity_type;
      forcedBindings.duration[index]=awMsg[index].duration;
    })
    //console.log(forcedBindings.app.length)
    return forcedBindings;
  }

  mapAwAfkMessage(usergraph,awMsg){
    var forcedBindings={
      usergraph:usergraph,
      event_type:"my2sec:afkEvent",
      datetimestamp:[],
      app:"none",
      title:"none",
      activity_type:"my2sec:none",
      task:"none",
      duration:[]
    };
    Object.keys(awMsg).forEach(index=>{
      forcedBindings.datetimestamp[index]=awMsg[index].timestamp;
      forcedBindings.duration[index]=awMsg[index].duration;
    })
    return forcedBindings;
  }


  mapAwStartStopMessage(usergraph,awMsg){
    var forcedBindings={
      usergraph:usergraph,
      event_type:[],
      datetimestamp:[],
      app:"none",
      title:"none",
      activity_type:"my2sec:none",
      task:"none",
      duration:"0"
    };
    Object.keys(awMsg).forEach(index=>{
      forcedBindings.datetimestamp[index]=awMsg[index].timestamp;
      forcedBindings.event_type[index]="my2sec:"+awMsg[index].data["start-stop"]+"Event"
    })
    return forcedBindings;
  }


  mapAwNotShutdownMessage(usergraph,awMsg){
    var forcedBindings={
      usergraph:usergraph,
      event_type:"my2sec:notShutdown",
      datetimestamp:[],
      app:"none",
      title:"none",
      activity_type:"my2sec:none",
      task:"none",
      duration:"0"
    };
    Object.keys(awMsg).forEach(index=>{
      forcedBindings.datetimestamp[index]=awMsg[index].timestamp;
    })
    return forcedBindings;
  }


}//end of class 



module.exports = AwMapper;