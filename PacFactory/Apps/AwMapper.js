var SynchronousConsumer=require('../gregnet_modules/PacFactory/Pattern/SynchronousConsumer.js'); //Pac Factory
var Producer=require('../gregnet_modules/PacFactory/Pattern/Producer.js'); //Pac Factory
var GregLogs = require("../gregnet_modules/GregLogs.js")
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class AwMapper{
  constructor(jsap_file){
    //TITLE
    console.log("###########################");
    console.log("# App: ActivityWatch mapper v0.1");
    console.log("###########################");
    this.log = new GregLogs();
    this.log.loglevel=1;
    this._ACTIVE_PROCESSES=0;
    //Configure awmessages consumer
    var messagesquery="ALL_USERS_MESSAGES";
    var data={
      message_graph: "http://www.vaimee.it/my2sec/messages/activitywatch"
    }
    var flagname="http://www.vaimee.it/my2sec/awproducerflag"
    this.awMessagesConsumer=new SynchronousConsumer(jsap_file,messagesquery,data,flagname,false);
    this.awMessagesConsumer.log.loglevel=this.log.loglevel;
    this.awMessagesConsumer.em.on("newsyncflag",not=>{
      this.on_production_finished(not)
    }) //when the flag consumer emits a flag
    //Configure awmessages remover
    this.awMessagesRemover=new Producer(jsap_file,"DELETE_MESSAGE");
    this.awMessagesRemover.log.loglevel=this.log.loglevel;
    //Configure awevents producer and remover
    this.awEventsProducer=new Producer(jsap_file,"ADD_TRAINING_EVENT");
    this.awEventsProducer.log.loglevel=this.log.loglevel;
    this.awmapperFlagProducer= new Producer(jsap_file,"SET_SYNCHRONIZATION_FLAG");
    this.awmapperFlagProducer.log.loglevel=this.log.loglevel;
  }

  async start(){
    this.awMessagesConsumer.subscribeToSepa()
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
    this.log.info("(process"+pnum+") Mapping for "+flagbind.usergraph+" finished, sending flag")
    await this.awmapperFlagProducer.updateSepa({
      flag_type:"http://www.vaimee.it/my2sec/awmapperflag",
      usergraph:usergraph
    })
    this._ACTIVE_PROCESSES--
  }

 


  async on_new_message(binding){
    var msg=JSON.parse(binding.msgvalue);//extract json from binding
    this.log.info("--------------------------------------------------")
    this.log.info(`# Mapping message, user: ${binding.usergraph}, Source: ${binding.source}, Timestamp: ${binding.msgtimestamp}, Events to Map: ${msg.length}`);
    //Map Message
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

      //console.log("MAO")
      //Delete Message
      var res=await this.awMessagesRemover.updateSepa({
        message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
        message: binding.b
      })
      //console.log("MIUS")
      this.log.trace("Delete response: "+JSON.stringify(res))
      //Update Events
      if(Object.keys(msg).length===0){ 
        throw new Error("EMPTY MESSAGE RECEIVED: "+JSON.stringify(msg)+", SKIPPING UPDATE EVENTS") 
      }
      if(data==null){ 
        throw new Error("UNKNOWN MESSAGE RECEIVED, SKIPPING UPDATE EVENTS") 
      }
      //console.log(data)
      //console.log("MOA")
      res=await this.awEventsProducer.updateSepa(data)
      //this.log.debug("Update response: "+JSON.stringify(res))
      

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




 /*
  async on_production_finished(usergraph){
    //var cachedGraphs=this.cachedGraphs;
    //this.cachedGraphs=[];
    //for(var graph in cachedGraphs){
      var messages=cachedGraphs[graph];
      for(var k in messages){
        await this.on_new_message(messages[k])
      }
    //}
    console.log("Setting mapping finished flag flag")
    await this.SET_SYNCHRONIZATION_FLAG({
      flag_type:"http://www.vaimee.it/my2sec/awmapperflag",
      usergraph:usergraph
    })
  }
  */

  /*
  OLD STUFF
  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){
    await this.testSepaSource();//Test DataSource
    this.newSubRouter("ALL_USERS_MESSAGES",{
      message_graph: "http://www.vaimee.it/my2sec/messages/activitywatch"
    },"add_event_to_cache")
    this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
      flag_type:"http://www.vaimee.it/my2sec/awproducerflag"
    },"on_flag_change")
    this.log.info("##### APP INITIALIZED ######")
    //console.log("===============================================================================")
  }

  

  //create and organize graphs cache
  async add_event_to_cache(binding){
    if(Object.keys(this.cachedGraphs).join(",").includes(binding.usergraph)){
      this.cachedGraphs[binding.usergraph].push(binding)
    }else{
      //create new graph cache
      this.cachedGraphs[binding.usergraph]=[]
      this.cachedGraphs[binding.usergraph].push(binding)
    }
  }


  //When mapping flag changes, check flag
  async on_flag_change(not){
    try{
        try{
          await this.RESET_SYNCHRONIZATION_FLAG({flag:not.flag})
        }catch(e){
          console.log(e)
        }
        //console.log("MAO")
        await this.on_production_finished(not.usergraph);
      
    }catch(e){
      console.log(e)
    }
  }
*/