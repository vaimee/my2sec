var PacFactory=require('../../../core/PacFactory'); //Pac Factory
var SynchronousConsumer=require('../../../core/Pattern/SynchronousConsumer'); //Pac Factory
var SynchronousProducer=require('../../../core/Pattern/SynchronousProducer'); //Pac Factory
var Producer=require('../../../core/Pattern/Producer'); //Pac Factory
var GregLogs = require("../../../utils/GregLogs.js")
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class AtAggregator{
  constructor(jsap_file){
    //TITLE
    console.log("####################################");
    console.log("# App: ActivityType Aggregator v0.1");
    console.log("####################################");
    this.removeClient=new PacFactory(jsap_file)
    //super(jsap_file);
    //this.cachedGraphs=[];
    //this.cachedActivities=[];
    this.log = new GregLogs();
    this.log.loglevel=0;
    this._ACTIVE_PROCESSES=0;

    //Configure awTrainingEventsConsumer and flag remover
    var eventsquery="ALL_USERS_TRAINING_EVENTS";
    var data={};
    var mapper_flag="http://www.vaimee.it/my2sec/awmapperflag";
    this.awTrainingEventsConsumer=new SynchronousConsumer(jsap_file,eventsquery,data,mapper_flag,false);
    this.awTrainingEventsConsumer.log.loglevel=this.log.loglevel;
    this.awTrainingEventsConsumer.em.on("newsyncflag",not=>{this.on_mapping_finished(not)}) //when the flag consumer emits a flag
    //Configure awTrainingEventsRemover
    this.awTrainingEventsRemover=new Producer(jsap_file,"REMOVE_TRAINING_EVENT");
    this.awTrainingEventsRemover.log.loglevel=this.log.loglevel;
    //Configure awTrainingActivitiesProducer and flag
    var trainingactivityupdate="ADD_TRAINING_ACTIVITY";
    var trainingactivityflag="http://www.vaimee.it/my2sec/trainingactivitiesflag";
    this.awTrainingActivitiesProducer=new SynchronousProducer(jsap_file,trainingactivityupdate,trainingactivityflag);
    this.awTrainingActivitiesProducer.log.loglevel=this.log.loglevel;



    //Configure awValidatedActivitiesConsumer
    var activitiesquery="ALL_USERS_VALIDATED_ACTIVITIES";
    var data_2={};
    var validation_flag="http://www.vaimee.it/my2sec/validatedactivitiesflag";
    this.awValidatedActivitiesConsumer=new SynchronousConsumer(jsap_file,activitiesquery,data_2,validation_flag,false);
    this.awValidatedActivitiesConsumer.log.loglevel=this.log.loglevel;
    this.awValidatedActivitiesConsumer.em.on("newsyncflag",not=>{this.on_validation_finished(not)}) //when the flag consumer emits a flag
    //Configure awValidatedActivitiesRemover
    this.awValidatedActivitiesRemover=new Producer(jsap_file,"REMOVE_VALIDATED_ACTIVITY");
    this.awValidatedActivitiesRemover.log.loglevel=this.log.loglevel;
    //Configure awActivitiesProducer and flag
    var activityupdate="ADD_ACTIVITY";
    var activityflag="http://www.vaimee.it/my2sec/awactivitiesaggregatorflag";
    this.awActivitiesProducer= new SynchronousProducer(jsap_file,activityupdate,activityflag);
    this.awActivitiesProducer.log.loglevel=this.log.loglevel;

  }


  async start(){
    this.awTrainingEventsConsumer.subscribeToSepa()
    this.awValidatedActivitiesConsumer.subscribeToSepa()
  }
  async exit(){
    this.awTrainingEventsConsumer.exit()
    this.awValidatedActivitiesConsumer.exit()
  }

  /*
  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){
    //test datasource
    await this.testSepaSource();//Test DataSource
    
    //init routers
    //OLDthis.newSubRouter("ALL_USERS_EVENTS",{},"add_event_to_cache")
    
    this.newSubRouter("ALL_USERS_TRAINING_EVENTS",{},"add_event_to_cache")
    this.newSubRouter("ALL_USERS_VALIDATED_ACTIVITIES",{},"add_activities_to_cache")
    this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
      flag_type:"http://www.vaimee.it/my2sec/awmapperflag"
    },"on_flag_change")
    this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
      flag_type:"http://www.vaimee.it/my2sec/validatedactivitiesflag"
    },"on_validation_flag_change")
    //finish
    this.log.info("##### APP INITIALIZED ######")
    console.log("===============================================================================")
  }
  
  
  //create and organize graphs cache
  async add_activities_to_cache(binding){
    if(Object.keys(this.cachedActivities).join(",").includes(binding.user_graph)){
      this.cachedActivities[binding.user_graph].push(binding)
    }else{
      //create new graph cache
      this.cachedActivities[binding.user_graph]=[]
      this.cachedActivities[binding.user_graph].push(binding)
    }
    //console.log(binding)
  }

  //create and organize graphs cache
  async add_event_to_cache(binding){
    if(Object.keys(this.cachedGraphs).join(",").includes(binding.user_graph)){
      this.cachedGraphs[binding.user_graph].push(binding)
    }else{
      //create new graph cache
      this.cachedGraphs[binding.user_graph]=[]
      this.cachedGraphs[binding.user_graph].push(binding)
    }
  }

  //When mapping flag changes, check flag
  async on_flag_change(not){
    
    try{
      console.log("Resetting sync flag")
      await this.RESET_SYNCHRONIZATION_FLAG({flag:not.flag})
      console.log("AGGREGATION STARTING");
      await this.on_mapping_finished(not.usergraph);
    }catch(e){
      console.log(e)
    }
  }
  */

  //If mapping flag=="start"
  async on_mapping_finished(flagbind){
    throw new Error("MAO")
    var pnum=this._ACTIVE_PROCESSES;
    this._ACTIVE_PROCESSES++
    //var usergraph=flagbind.usergraph;
    this.log.info("Mapping complete, parsing cached graphs")
    var trainingEvents=this.awTrainingEventsConsumer.get_cache_by_user(flagbind.usergraph);
    this.log.info("(process"+pnum+") Ai Processing for "+flagbind.usergraph+" started, "+trainingEvents.length+" events left to process")
    
    // var cachedGraphs=this.cachedGraphs //COPIA ARRAY PER EVITARE CHE SE IN CONTEMPORANEA ARRIVA UN ALTRO UPDATE SI FOTTA TUTTO
    //this.cachedGraphs=[]//clean graphs cache
    //show cache contents
    
    this.log.trace(trainingEvents)
    var modifiedTrainingEvents=[]
    for(var i in trainingEvents){
      var obj=trainingEvents[i];
      modifiedTrainingEvents[i]={};
      Object.keys(obj).forEach(k=>{
        if(k!="usergraph"){
          modifiedTrainingEvents[i][k]=obj[k];
        }else{
          modifiedTrainingEvents[i]["user_graph"]=obj[k];
        }
      })
    }
    //console.log(modifiedTrainingEvents[0])
    //console.log(this.awTrainingEventsConsumer.get_cache_by_user(flagbind.usergraph)[0])
    
    //throw new Error("MAO");
    var trainActivities=await this.GetTrainActivityEvents(modifiedTrainingEvents) //returns graphs processed by IA
    this.log.info("IA finished, updating sepa")

    var activitiesBindings=this.construct_train_activities_bindings(trainActivities,flagbind.usergraph)
    this.log.debug(activitiesBindings)

    //throw new Error("MAO")

    Object.keys(activitiesBindings.title).forEach(index=>{
      //forcedBindings.app[index]=awMsg[index].data.app;
      var title=activitiesBindings.title[index].replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
      title=title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
      activitiesBindings.title[index]=title;
      //forcedBindings.activity_type[index]="sw:none";//"sw:"+awMsg[index].data.activity_type;
      //forcedBindings.duration[index]=awMsg[index].duration;
    })
    await this.awTrainingActivitiesProducer.updateSepa(activitiesBindings,flagbind.usergraph);
    
    //DO NOT REMOVE EVENTS YET
    /*
    var res=await this.ADD_TRAINING_ACTIVITY(bindings)
    this.log.info("SEPA RESPONSE: "+res)
    await this.SET_SYNCHRONIZATION_FLAG({
      flag_type:,
      usergraph:usergraph
    })
    */
    this.log.info("(process"+pnum+") Ai Processing for "+flagbind.usergraph+" finished, flag updated")
    this.log.info("(process"+pnum+") note: keeping "+flagbind.usergraph+" events in cache to await validation")
    this._ACTIVE_PROCESSES-- 
 
  }

/*
  async on_validation_flag_change(not){
    try{
      console.log("Resetting sync flag")
      await this.RESET_SYNCHRONIZATION_FLAG({flag:not.flag})
      console.log("FINAL AGGREGATION STARTING");
      await this.on_validation_finished(not.usergraph);
    }catch(e){
      console.log(e)
    }
  }
*/
  async on_validation_finished(flagbind){
    throw new Error("MAO")
    var pnum=this._ACTIVE_PROCESSES;
    this._ACTIVE_PROCESSES++
    //var usergraph=flagbind.usergraph;
    this.log.info("Validation complete, parsing cached graphs")
    var validatedActivities=this.awValidatedActivitiesConsumer.get_cache_by_user(flagbind.usergraph);
    var newtrainingEvents=this.awTrainingEventsConsumer.get_cache_by_user(flagbind.usergraph);
    this.log.info("(process"+pnum+") Updating Ia Knowledge for "+flagbind.usergraph+" started, "+validatedActivities.length+" validated activities left to map")
    
    /*
    var cachedActivities=this.cachedActivities
    this.cachedActivities=[];
    var cachedGraphs=this.cachedGraphs //COPIA ARRAY PER EVITARE CHE SE IN CONTEMPORANEA ARRIVA UN ALTRO UPDATE SI FOTTA TUTTO
    this.cachedGraphs=[]//clean graphs cache
    */
    this.log.debug(newtrainingEvents[0])
    var modifiedTrainingEvents=[]
    for(var i in newtrainingEvents){
      var obj=newtrainingEvents[i];
      modifiedTrainingEvents[i]={};
      Object.keys(obj).forEach(k=>{
        if(k!="usergraph"){
          modifiedTrainingEvents[i][k]=obj[k];
        }else{
          modifiedTrainingEvents[i]["user_graph"]=obj[k];
        }
      })
    }
    console.log(validatedActivities[0])
    var modifiedValidatedActivities=[]
    for(var i in validatedActivities){
      var obj=validatedActivities[i];
      modifiedValidatedActivities[i]={};
      Object.keys(obj).forEach(k=>{
        if(k!="usergraph"){
          modifiedValidatedActivities[i][k]=obj[k];
        }else{
          modifiedValidatedActivities[i]["user_graph"]=obj[k];
        }
      })
    }
    this.log.trace("ModifiedValidatedActivities: ",modifiedValidatedActivities)
    this.log.trace("ModifiedTrainingEvents: ",modifiedTrainingEvents)
    var activities=await this.GetTestActivityEvents(modifiedTrainingEvents,modifiedValidatedActivities) //returns graphs processed by IA
    var activitiesBindings=this.construct_test_activities_bindings(activities,flagbind.usergraph)
    this.log.trace("ActivitiesBindings: ",activitiesBindings)
    //IF SUCCESSFUL; REMOVE TRAINING EVENTS AND VALIDATED ACTIVITIES. The producer frontend will consume and delete test activities
    //throw new Error("MAO")
    

    //REMOVING validatedActivities
    this.log.trace(validatedActivities)
    /*for(var i in validatedActivities){
      var res=await this.awTrainingEventsRemover.updateSepa({
          event: validatedActivities[i].nodeid
      })
      console.log(res)
    }*/
    var validatedActivitiesGraph="http://vaimee.it/my2sec/activities"
    var validatedActivitiesBinding="activity"
    this.log.info("REMOVING VALIDATED ACTIVITIES")
    var validatedActivitiesToRemove=[]
    for(var i=0; i<validatedActivities.length; i++){
        validatedActivitiesToRemove.push(validatedActivities[i].nodeid)
    }
    var removeValidatedActivitiesString=this.build_remove_query(validatedActivitiesGraph,validatedActivitiesBinding,validatedActivitiesToRemove)
    this.log.trace(removeValidatedActivitiesString)
    await this.removeClient.rawUpdate(removeValidatedActivitiesString);

    this.log.info("ACTIVITIES REMOVED")
    
    //console.log(newtrainingEvents)
    /*for(var i in newtrainingEvents){
      var res=await this.awTrainingEventsRemover.updateSepa({
          event: newtrainingEvents[i].nodeid
      })
      console.log(res)
    }*/
    var trainingEventsGraph="http://vaimee.it/my2sec/events"
    var trainingEventsBinding="event"
    this.log.info("REMOVING EVENTS")
    var trainingEventsToRemove=[]
    for(var i=0; i<newtrainingEvents.length; i++){
        trainingEventsToRemove.push(newtrainingEvents[i].nodeid)
    }
    var removeTrainingEventsString=this.build_remove_query(trainingEventsGraph,trainingEventsBinding,trainingEventsToRemove)
    this.log.trace(removeTrainingEventsString)
    await this.removeClient.rawUpdate(removeTrainingEventsString);    
    
    this.log.info("EVENTS REMOVED")

    try{
      //console.log(activitiesBindings)
      Object.keys(activitiesBindings.title).forEach(index=>{
        //forcedBindings.app[index]=awMsg[index].data.app;
        var title=activitiesBindings.title[index].replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
        title=title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
        activitiesBindings.title[index]=title;
        //forcedBindings.activity_type[index]="sw:none";//"sw:"+awMsg[index].data.activity_type;
        //forcedBindings.duration[index]=awMsg[index].duration;
      })
      await this.awActivitiesProducer.updateSepa(activitiesBindings,flagbind.usergraph)
    }catch(e){console.log(e.response.data.error_description)}

    /*
    var res=await this.ADD_ACTIVITY(bindings);
    await this.SET_SYNCHRONIZATION_FLAG({
      flag_type:"http://www.vaimee.it/my2sec/awactivitiesaggregatorflag",
      usergraph:usergraph
    })
    */
    this.log.info("(process"+pnum+") Ia Knowledge updated for "+flagbind.usergraph+", activities and flag updated")
    this._ACTIVE_PROCESSES-- 
  }

  
  build_remove_query(graph,binding_name,itemsToRemove){
    var values=itemsToRemove.join("> <");
    var updateString=`
    PREFIX my2sec: <http://www.vaimee.it/ontology/my2sec#>
    DELETE {
        GRAPH <${graph}> {
            ?${binding_name} ?p ?o ;
            my2sec:hasTimeInterval ?d . 
            ?d ?p1 ?o1
        } 
    } WHERE { 
        GRAPH <${graph}> {
            ?${binding_name} ?p ?o ;
            my2sec:hasTimeInterval ?d .
            ?d ?p1 ?o1
        }
        VALUES ?${binding_name} { <${values}> }
    }
    `
    
    return updateString;
}


  construct_test_activities_bindings(testActivities,usergraph){
    //var jsonobj=JSON.parse(string)
    var bindings={
      usergraph:usergraph,
      event_type:[],
      app: [],
      title: [],
      activity_type: [],
      task: "none",
      datetimestamp: [],
      duration: []//,
      //real_duration:[]
    }
    //Object.keys(cachedGraphs).forEach(usergraph=>{
      //var userActivities=cachedGraphs[usergraph]
      //console.log("Activities of "+usergraph)
      //console.log(userActivities)
      Object.keys(testActivities).forEach(k=>{
        //bindings["usergraph"].push(usergraph)
        bindings["event_type"].push(testActivities[k]["event_type"])
        bindings["app"].push(testActivities[k]["app"])
        bindings["title"].push(testActivities[k]["title"])
        bindings["activity_type"].push(testActivities[k]["predicted"])
        bindings["datetimestamp"].push(testActivities[k]["datetimestamp"])
        //bindings["duration"].push(testActivities[k]["duration"])
        bindings["duration"].push(testActivities[k]["real_duration"])
      })

    //})
    return bindings
  }



  construct_train_activities_bindings(activities,usergraph){
    //var jsonobj=JSON.parse(string)
    var bindings={
      usergraph:usergraph,
      event_type:[],
      app: [],
      title: [],
      activity_type: "my2sec:none",
      task: "none",
      datetimestamp: [],
      duration: []//,
      //real_duration:[]
    }
    //Object.keys(cachedGraphs).forEach(usergraph=>{
      //var userActivities=cachedGraphs[usergraph]
      //console.log("Activities of "+usergraph)
      //console.log(userActivities)
      Object.keys(activities).forEach(k=>{
        //bindings["usergraph"].push(usergraph)
        bindings["event_type"].push(activities[k]["event_type"])
        bindings["app"].push(activities[k]["app"])
        bindings["title"].push(activities[k]["title"])
        //bindings["activity_type"].push(activities[k]["activity_type"])
        bindings["datetimestamp"].push(activities[k]["datetimestamp"])
        //bindings["duration"].push(activities[k]["duration"])
        bindings["duration"].push(activities[k]["real_duration"])
      })

    //})
    return bindings
  }


  /*
  construct_activities_bindings(cachedGraphs){
    //var jsonobj=JSON.parse(string)
    var bindings={
      usergraph:[],
      event_type:[],
      app: [],
      title: [],
      activity_type: "my2sec:none",
      task: "none",
      datetimestamp: [],
      duration: []//,
      //real_duration:[]
    }
    Object.keys(cachedGraphs).forEach(usergraph=>{
      var userActivities=cachedGraphs[usergraph]
      console.log("Activities of "+usergraph)
      //console.log(userActivities)
      Object.keys(userActivities).forEach(k=>{
        bindings["usergraph"].push(usergraph)
        bindings["event_type"].push(userActivities[k]["event_type"])
        bindings["app"].push(userActivities[k]["app"])
        bindings["title"].push(userActivities[k]["title"])
        //bindings["activity_type"].push(userActivities[k]["activity_type"])
        bindings["datetimestamp"].push(userActivities[k]["datetimestamp"])
        //bindings["duration"].push(userActivities[k]["duration"])
        bindings["duration"].push(userActivities[k]["real_duration"])
      })

    })
    return bindings
  }
  */




  async GetTrainActivityEvents(trainingEvents){
    var trainActivities={};
    //for(var k in cachedGraphs){ //APPLY IA FILTER TO EVERY GRAPH
      //console.log(cachedGraphs[k])
      var fs = require('fs');
      fs.writeFile("./bindings.txt", JSON.stringify(trainingEvents), function (err) {if (err) return console.log(err);})
      console.log("SAVED BINDINGS");
      try{
        this.log.debug(" length: "+trainingEvents.length)
        this.log.info("----START: addDuration.py-------------------------")
        var rootDir="./Apps/ActivityTypeAggregator/"
        var pyAddDuration=new PacPyRunner(rootDir);
        trainActivities=await pyAddDuration.runPacPythonApp(
          "addDuration.py",
          JSON.stringify(trainingEvents),
          "get_training_events"         
        )
        trainActivities=JSON.parse(trainActivities)
        this.log.info("----END PYTHON-------------------------")
      }catch(e){
          console.log(e)
      }  
    //}
    return trainActivities
  }



  async GetTestActivityEvents(trainingEvents,validatedActivities){
    var activities={}
    //for(var k in cachedGraphs){ //APPLY IA FILTER TO EVERY GRAPH
      //if(cachedActivities.hasOwnProperty(k)){//se non è vuoto, allora gira l'IA
        try{

          var argument={
            "events":trainingEvents,
            "train_events":validatedActivities||{}
          }

          this.log.debug(" length: "+validatedActivities.length)
          this.log.info("----START: addDuration.py-------------------------")
          var rootDir="./Apps/ActivityTypeAggregator/"
          var pyAddDuration=new PacPyRunner(rootDir);
          activities=await pyAddDuration.runPacPythonApp(
            "addDuration.py",
            JSON.stringify(argument),
            "get_test_activity_events"         
          )
          activities=JSON.parse(activities)
          this.log.info("----END PYTHON-------------------------")
        }catch(e){
            console.log(e)
        }
      //}
      
    //}
    return activities
  }


 


}//end of class 







class PacPyRunner{
  constructor(rootdir){
    this.rootDir=rootdir
    this.syncFilename=this.generateSyncFilename()
  }

  generateSyncFilename(){
    var uniqueid=new Date().toISOString()
    //filename="./Apps/ActivityTypeAggregator/in_"+filename+".txt"
    var filename=this.rootDir+"pysync_"+uniqueid+".txt"
    filename=filename.replace(/:/g,"_")
    return filename
  }

  async runPacPythonApp(script,arg,mode){
    var filename=this.syncFilename
    //1] SAVE INPUT FILE
    console.log("1] Saving input to file: "+filename)
    await this.saveToFile(filename,arg)
    var stringa=await this.readFile(filename)
    console.log(stringa.slice(0,500)) 

    //2] RUN PROGRAM
    console.log("2] Running python app: "+this.rootDir+script)
    var res=await this.spawn_python_process(script,filename,mode)
    console.log("\n# APP LOGS: #")
    console.log(res)
    console.log("# process exitex #")

    //3] GET OUTPUT FILE
    console.log("3] Getting output file")
    var output= await this.readFile(filename)
    console.log(output.slice(0,500)) 
    
    //4] REMOVE OUTPUT FILE
    console.log("4] Removing output file")
    
    this.removeFile(filename)
    
    //console.log("File "+filename+" removed")
    //RETURN ALGOHORITM RESULTS
    return output
  }
  


  async spawn_python_process(script,filename,mode){
    var scriptAbsolutePath=this.rootDir+script
    //console.log("Running python app: "+scriptAbsolutePath)
    const { spawn } = require('child_process');
    return new Promise(resolve=>{
        var string=""
        const python = spawn("python",[scriptAbsolutePath,filename,mode])
        console.log("App spawned")
        //on new data chunk
        python.stdout.on("data",(chunk)=>{
            string=string+chunk;
        })
        //on new error
        python.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });
        //on app close
        python.stdout.on("close", (code)=>{
            //console.log("App exited with code: "+code)
            resolve(string)
        })
    })    
  }




  saveToFile(filename,string){
    var fs = require('fs');
    return new Promise(resolve=>{
      fs.writeFile(filename, string, function (err) {
        if (err) return console.log(err);
        //console.log('FILE SAVED');
        resolve("FILE SAVED")
      });
    })
  }

  readFile(filename){
    var fs = require('fs');
    return new Promise(resolve=>{
      fs.readFile(filename, 'utf8', function (err,data) {
        if (err) return console.log(err);
        //console.log('FILE SAVED');
        resolve(data)
      });
    })
  }

  removeFile(filename){
    var fs = require('fs');
    fs.unlinkSync(filename);  
  }



}










module.exports= AtAggregator;