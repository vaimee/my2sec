var PacFactory=require('../gregnet_modules/PacFactory/PacFactory.js'); //Pac Factory
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class AwMapper extends PacFactory{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################");
    console.log("║║ # App: ActivityWatch mapper v0.1");
    console.log("║║ ###########################");
    super(jsap_file);
    this.cachedGraphs=[];
  }

  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){
    await this.testSepaSource();//Test DataSource
    this.newSubRouter("ALL_USERS_MESSAGES",{
      message_graph: "http://www.vaimee.it/my2sec/messages/activitywatch"
    },"add_event_to_cache")
    this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
      flag_uri:"http://www.vaimee.it/my2sec/aw_producer_finished_flag"
    },"on_flag_change")
    this.log.info("##### APP INITIALIZED ######")
    console.log("===============================================================================")
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
      var value=not.flag_value
      this.log.info("Producer finished flag value: "+value)
      if(value=="true"){
        await this.SET_SYNCHRONIZATION_FLAG({
          flag_uri:"http://www.vaimee.it/my2sec/aw_producer_finished_flag",
          flag_vale:"false"
        })
        await this.on_production_finished();
      }
    }catch(e){
      console.log(e)
    }
  }

  
  async on_production_finished(){
    var cachedGraphs=this.cachedGraphs;
    this.cachedGraphs=[];
    for(var graph in cachedGraphs){
      var messages=cachedGraphs[graph];
      for(var k in messages){
        await this.on_new_message(message[k])
      }
    }
    await this.SET_SYNCHRONIZATION_FLAG({
      flag_uri:"http://www.vaimee.it/my2sec/aw_mapper_finished_flag",
      flag_vale:"true"
    })
  }


  async on_new_message(binding){
    this.log.info("_________________________");
    this.log.info("# New Message Received! #");
    //console.log(binding)
    //Log Message Info
    this.log.info("> Usergraph: "+binding.usergraph)
    this.log.info("> Source: "+binding.source)
    this.log.info("> Timestamp: "+binding.message_timestamp)
    var msg=JSON.parse(binding.json_message);//extract json from binding
    this.log.info("> Events to Map: "+msg.length)
    //Map Message
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

      
      //Delete Message
      var res=await this.DELETE_MESSAGE({
        message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
        usergraph: binding.usergraph,
        msgtimestamp: binding.message_timestamp,
        source: binding.source
      })
      this.log.info("Delete response: "+JSON.stringify(res))
      //Update Events
      if(Object.keys(msg).length===0){ 
        throw new Error("EMPTY MESSAGE RECEIVED: "+JSON.stringify(msg)+", SKIPPING UPDATE EVENTS") 
      }
      if(data==null){ 
        throw new Error("UNKNOWN MESSAGE RECEIVED, SKIPPING UPDATE EVENTS") 
      }
      res=await this.ADD_EVENT(data)
      this.log.info("Update response: "+JSON.stringify(res))
      

    }catch(e){
      this.log.error(" A new error has been catched =( But the Show must go on!")
      console.log(e)
    }
    
  }
  

  mapAwWorkingMessage(usergraph,awMsg){
    var forcedBindings={
      usergraph:usergraph,
      event_type:"sw:windowEvent",
      datetimestamp:[],
      app:[],
      title:[],
      activity_type:"sw:none",
      task:"none",
      duration:[]
    };
    Object.keys(awMsg).forEach(index=>{
      forcedBindings.datetimestamp[index]=awMsg[index].timestamp;
      forcedBindings.app[index]=awMsg[index].data.app;
      var title=awMsg[index].data.title.replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
      title=title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
      forcedBindings.title[index]=title;
      //forcedBindings.activity_type[index]="sw:"+awMsg[index].data.activity_type;
      forcedBindings.duration[index]=awMsg[index].duration;
    })
    return forcedBindings;
  }

  mapAwAfkMessage(usergraph,awMsg){
    var forcedBindings={
      usergraph:usergraph,
      event_type:"sw:afkEvent",
      datetimestamp:[],
      app:"none",
      title:"none",
      activity_type:"sw:none",
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
      activity_type:"sw:none",
      task:"none",
      duration:"0"
    };
    Object.keys(awMsg).forEach(index=>{
      forcedBindings.datetimestamp[index]=awMsg[index].timestamp;
      forcedBindings.event_type[index]="sw:"+awMsg[index].data["start-stop"]+"Event"
    })
    return forcedBindings;
  }


  mapAwNotShutdownMessage(usergraph,awMsg){
    var forcedBindings={
      usergraph:usergraph,
      event_type:"sw:notShutdown",
      datetimestamp:[],
      app:"none",
      title:"none",
      activity_type:"sw:none",
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