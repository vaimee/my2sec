var PacFactory=require('../../gregnet_modules/PacFactory/PacFactory'); //Pac Factory
var SynchronousConsumer=require('../../gregnet_modules/PacFactory/Pattern/SynchronousConsumer'); //Pac Factory
var SynchronousProducer=require('../../gregnet_modules/PacFactory/Pattern/SynchronousProducer'); //Pac Factory
var Producer=require('../../gregnet_modules/PacFactory/Pattern/Producer'); //Pac Factory
var GregLogs = require("../../gregnet_modules/GregLogs.js")
/*###########################################
|| NAME: AtAggregator module
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
/*
  TODO: check if ai is updating knowledge correctly at the correct path
  TODO: after update is stable, make smart worker type configurable 
*/
class AtAggregator{
  constructor(jsap_file){
    //TITLE
    console.log("##############################");
    console.log("# App: ActivityType Aggregator");
    console.log("##############################");
    this.removeClient=new PacFactory(jsap_file)
    this.log = new GregLogs();
    this.log.loglevel=1;
    this._ACTIVE_PROCESSES=0; //tiene conto dei processi concorrenti attualmente attivi
    //Configure awTrainingEventsConsumer and flag remover
    var eventsquery="ALL_USERS_TRAINING_EVENTS";
    var data={};
    var mapper_flag="http://www.vaimee.it/my2sec/awmapperflag";
    this.awTrainingEventsConsumer=new SynchronousConsumer(jsap_file,eventsquery,data,mapper_flag,false);
    this.awTrainingEventsConsumer.log.loglevel=this.log.loglevel;
    this.awTrainingEventsConsumer.em.on("newsyncflag",not=>{
      this.log.info("###########################")
      this.log.info("New awmapper flag received!")
      this.log.info("###########################")
      this.on_mapping_finished(not).catch((error)=>{
        //ERROR HANDLING PROCEDURE
        this.log.error("Unhandled error in on_mapping_finished(). I caught it for you!")
        console.log(error)
        //send(error)
      })
    }) //when the flag consumer emits a flag
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
    this.awValidatedActivitiesConsumer.em.on("newsyncflag",not=>{
      this.on_validation_finished(not).catch((error)=>{
        this.log.error("Unhandled error in on_validation_finished(). I caught it for you!")
        console.log(error)
      })
    }) //when the flag consumer emits a flag
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




  /*-----------------------------------------------------------------------------------------------
    //* NAME: ON MAPPING FINISHED
    - triggered whenever the AwMapper completes an update
    - Takes a username and cached events as input, produces training activities to SEPA as output
  ------------------------------------------------------------------------------------------------*/
  async on_mapping_finished(flagbind){
    //Calculate process number
    var pnum=this._ACTIVE_PROCESSES;
    this._ACTIVE_PROCESSES++
    //Fetch training events from cache
    this.log.info("(process"+pnum+") | STEP 1 of 2 | ------------------------< Starting on_mapping_finished() procedure >------------------------")
    this.log.info("(process"+pnum+") Fetching training events of "+flagbind.usergraph+" from cache") 
    var trainingEvents=this.awTrainingEventsConsumer.get_cache_by_user(flagbind.usergraph);
    this.log.info("(process"+pnum+") Fetched training events, "+trainingEvents.length+" events left to process")
    
    //Preprocess training events for IA
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
    //Process training events with IA. The ouput are suggested training activities. They need to be validated
    this.log.info("(process"+pnum+") Starting IA processing (calling GetTrainActivityEvents)...")
    var trainActivities=await this.GetTrainActivityEvents(modifiedTrainingEvents)
    this.log.info("(process"+pnum+") IA processing complete, updating "+trainActivities.length+" training activities to SEPA")

    //Preprocess training activities for SEPA
    var activitiesBindings=this.construct_train_activities_bindings(trainActivities,flagbind.usergraph)
    this.log.trace(JSON.stringify(activitiesBindings))
    Object.keys(activitiesBindings.title).forEach(index=>{
      var title=activitiesBindings.title[index].replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
      title=title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
      activitiesBindings.title[index]=title;
    })
    //Update SEPA
    await this.awTrainingActivitiesProducer.updateSepa(activitiesBindings,flagbind.usergraph);
    this.log.info("(process"+pnum+") Training activities of "+flagbind.usergraph+" correctly updated to SEPA")
    //DO NOT REMOVE EVENTS YET
    this.log.info("(process"+pnum+") note: keeping "+flagbind.usergraph+" events in cache to await validation")
    this._ACTIVE_PROCESSES-- //segnala fine processo
  }





  /*------------------------------------------------------------------------------------------------
    //* NAME: ON VALIDATION FINISHED
    - triggered whenever validated activities are updated to SEPA
    - uses the ActivityType IA to categorize user activities
    - Takes a username, cached events and activities as input, produces activities to SEPA as output
  -------------------------------------------------------------------------------------------------*/
  async on_validation_finished(flagbind){
    //Calculate process number
    var pnum=this._ACTIVE_PROCESSES;
    this._ACTIVE_PROCESSES++
    //Fetch validated activities from cache
    this.log.info("(process"+pnum+") | STEP 2 of 2 | ------------------------< Starting on_validation_finished() procedure >------------------------")
    this.log.info("(process"+pnum+") Fetching validated activities of "+flagbind.usergraph+" from cache") 
    var validatedActivities=this.awValidatedActivitiesConsumer.get_cache_by_user(flagbind.usergraph);
    this.log.info("(process"+pnum+") Fetched validated activities, "+validatedActivities.length+" activities left to process")
    //Preprocess validated activities for IA
    this.log.debug(validatedActivities[0])
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
    this.log.trace("(process"+pnum+") ModifiedValidatedActivities: "+modifiedValidatedActivities)
    
    //Fetch training events from cache
    this.log.info("(process"+pnum+") Fetching cached training events of "+flagbind.usergraph+" from step 1") 
    var newtrainingEvents=this.awTrainingEventsConsumer.get_cache_by_user(flagbind.usergraph);
    this.log.info("(process"+pnum+") Fetched training events, "+newtrainingEvents.length+" events left to process")
    //Preprocess training events for IA
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
    this.log.trace("(process"+pnum+") ModifiedTrainingEvents: "+modifiedTrainingEvents)
    //Process training events and activities with IA. The output are categorized activities
    this.log.info("(process"+pnum+") Starting IA processing (calling GetTestActivityEvents)...")
    var activities=await this.GetTestActivityEvents(modifiedTrainingEvents,modifiedValidatedActivities) //returns graphs processed by IA
    this.log.info("(process"+pnum+") IA processing complete, updating "+activities.length+" activities to SEPA")
    
    //Preprocess activities for SEPA
    var activitiesBindings=this.construct_test_activities_bindings(activities,flagbind.usergraph)
    this.log.trace("(process"+pnum+") ActivitiesBindings: "+activitiesBindings)
    Object.keys(activitiesBindings.title).forEach(index=>{
      var title=activitiesBindings.title[index].replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
      title=title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
      activitiesBindings.title[index]=title;
    })
    //Update sepa with activities
    await this.awActivitiesProducer.updateSepa(activitiesBindings,flagbind.usergraph)
    this.log.info("(process"+pnum+") Activities of "+flagbind.usergraph+" correctly updated to SEPA, IA knowledge updated")


    //-------------------------------------------------------------------------
    //PROCEDURE COMPLETE, NOW REMOVE TRAINING EVENTS AND VALIDATED ACTIVITIES. The producer frontend will consume and delete test activities
    this.log.info("(process"+pnum+") Procedure complete, removing data...")
    this.log.trace(validatedActivities)
    var validatedActivitiesGraph="http://vaimee.it/my2sec/activities"
    var validatedActivitiesBinding="activity"
    //this.log.info("REMOVING VALIDATED ACTIVITIES")
    var validatedActivitiesToRemove=[]
    for(var i=0; i<validatedActivities.length; i++){
        validatedActivitiesToRemove.push(validatedActivities[i].nodeid)
    }
    var removeValidatedActivitiesString=this.build_remove_query(validatedActivitiesGraph,validatedActivitiesBinding,validatedActivitiesToRemove)
    this.log.trace(removeValidatedActivitiesString)
    await this.removeClient.rawUpdate(removeValidatedActivitiesString);
    this.log.info("(process"+pnum+") Removed "+validatedActivities.length+" validated activities")
    
    var trainingEventsGraph="http://vaimee.it/my2sec/events"
    var trainingEventsBinding="event"
    //this.log.info("REMOVING EVENTS")
    var trainingEventsToRemove=[]
    for(var i=0; i<newtrainingEvents.length; i++){
        trainingEventsToRemove.push(newtrainingEvents[i].nodeid)
    }
    var removeTrainingEventsString=this.build_remove_query(trainingEventsGraph,trainingEventsBinding,trainingEventsToRemove)
    this.log.trace(removeTrainingEventsString)
    await this.removeClient.rawUpdate(removeTrainingEventsString);    
    
    this.log.info("(process"+pnum+") Removed "+newtrainingEvents.length+" training events")
    this.log.info("(process"+pnum+") ------------------------< Procedure for "+flagbind.usergraph+" complete! Closing process >------------------------")
    this._ACTIVE_PROCESSES-- 
  }

  
  



  //===UTILITY=======================================================================================================================
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
        if(testActivities[k]["activity_type"]=="Other"){
          bindings["activity_type"].push("http://www.vaimee.it/ontology/my2sec#Other")
        }else{
          if(testActivities[k]["activity_type"]=="NaN"){
            bindings["activity_type"].push("http://www.vaimee.it/ontology/my2sec#NaN")
          }else{
            bindings["activity_type"].push(testActivities[k]["activity_type"])
          }
        }
        
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
          "filter.py",
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
            "filter.py",
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







//===SPAWN PYTHON=======================================================================================================================
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
        const python = spawn(
          "python",
          [scriptAbsolutePath,filename,mode],
          {
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8'
          })
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