var PacFactory=require('../../gregnet_modules/PacFactory/PacFactory.js'); //Pac Factory
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class AtAggregator extends PacFactory{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ####################################");
    console.log("║║ # App: ActivityType Aggregator v0.1");
    console.log("║║ ####################################");
    super(jsap_file);
    this.cachedGraphs=[];
  }

  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){
    //test datasource
    await this.testSepaSource();//Test DataSource
    //init routers
    this.newSubRouter("ALL_USERS_EVENTS",{},"add_event_to_cache")
    this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
      flag_uri:"http://www.vaimee.it/my2sec/aw_mapper_finished_flag"
    },"on_flag_change")
    //finish
    this.log.info("##### APP INITIALIZED ######")
    console.log("===============================================================================")
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
      var value=not.flag_value
      this.log.info("Mapping finished flag value: "+value)
      if(value=="true"){
        await this.SET_SYNCHRONIZATION_FLAG({
          flag_uri:"http://www.vaimee.it/my2sec/aw_mapper_finished_flag",
          flag_vale:"false"
        })
        await this.on_mapping_finished();
      }
    }catch(e){
      console.log(e)
    }
  }

  
  //If mapping flag=="start"
  async on_mapping_finished(){
    var cachedGraphs=this.cachedGraphs //COPIA ARRAY PER EVITARE CHE SE IN CONTEMPORANEA ARRIVA UN ALTRO UPDATE SI FOTTA TUTTO
    this.cachedGraphs=[]//clean graphs cache
    //show cache contents
    this.log.info("Mapping complete, parsing cached graphs")
    cachedGraphs=await this.apply_activities_ia(cachedGraphs) //returns graphs processed by IA
    this.log.info("IA finished, updating sepa")
    var bindings=this.construct_activities_bindings(cachedGraphs)
    console.log(bindings)
    var res=await this.ADD_ACTIVITY(bindings)
    this.log.info("SEPA RESPONSE: "+res)
    await this.SET_SYNCHRONIZATION_FLAG({
      flag_uri:"http://www.vaimee.it/my2sec/activities_ai_finished_flag",
      flag_vale:"true"
    })
  }

  construct_activities_bindings(cachedGraphs){
    //var jsonobj=JSON.parse(string)
    var bindings={
      usergraph:[],
      event_type:[],
      app: [],
      title: [],
      activity_type: [],
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
        bindings["activity_type"].push(userActivities[k]["activity_type"])
        bindings["datetimestamp"].push(userActivities[k]["datetimestamp"])
        //bindings["duration"].push(userActivities[k]["duration"])
        bindings["duration"].push(userActivities[k]["real_duration"])
      })

    })
    return bindings
  }



  async apply_activities_ia(cachedGraphs){
    var outputGraphs=[]
    for(var k in cachedGraphs){ //APPLY IA FILTER TO EVERY GRAPH
      try{
        this.log.debug(k+" length: "+cachedGraphs[k].length)
        this.log.info("----START: addDuration.py-------------------------")
        var rootDir="./Apps/ActivityTypeAggregator/"
        var pyAddDuration=new PacPyRunner(rootDir);
        outputGraphs[k]=await pyAddDuration.runPacPythonApp(
          "addDuration.py",
          JSON.stringify(cachedGraphs[k])            
        )
        outputGraphs[k]=JSON.parse(outputGraphs[k])
        this.log.info("----END PYTHON-------------------------")
        console.log(" ")
      }catch(e){
          console.log(e)
      }
    }
    return outputGraphs
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
    var filename=this.rootDir+"pysync.txt"//"pysync_"+uniqueid+".txt"
    filename=filename.replace(/:/g,"_")
    return filename
  }

  async runPacPythonApp(script,arg){
    var filename=this.syncFilename
    //1] SAVE INPUT FILE
    //console.log("1] Saving input to file: "+filename)
    await this.saveToFile(filename,arg)
    var stringa=await this.readFile(filename)
    //console.log(stringa.slice(0,250)) 

    //2] RUN PROGRAM
    var res=await this.spawn_python_process(script,filename)
    //console.log("# APP LOGS: #")
    //console.log(res)

    //3] GET OUTPUT FILE
    //console.log("3] Getting output file")
    var output= await this.readFile(filename)
    //console.log(output.slice(0,500)) 
    
    //4] REMOVE OUTPUT FILE
    //console.log("4] Removing output file")
    this.removeFile(filename)
    //console.log("File "+filename+" removed")
    //RETURN ALGOHORITM RESULTS
    return output
  }
  


  async spawn_python_process(script,filename){
    var scriptAbsolutePath=this.rootDir+script
    //console.log("Running python app: "+scriptAbsolutePath)
    const { spawn } = require('child_process');
    return new Promise(resolve=>{
        var string=""
        const python = spawn("python",[scriptAbsolutePath,filename])
        //on new data chunk
        python.stdout.on("data",(chunk)=>{
            string=string+chunk;
        })
        //on new error
        python.stderr.on('data', (data) => {
          //console.error(`stderr: ${data}`);
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