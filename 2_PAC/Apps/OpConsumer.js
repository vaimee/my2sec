var PacFactory=require('../gregnet_modules/PacFactory/PacFactory.js'); //Pac Factory
var OpClient=require('../gregnet_modules/PacFactory/OpenProjectClient.js');
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class OpConsumer extends PacFactory{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################");
    console.log("║║ # App: OpenProject consumer v0.1");
    console.log("║║ ###########################");
    super(jsap_file);
    this.tasksCache=[];
    this.opClient=new OpClient(jsap_file.extended.OpenProjectClientConfiguration);
  }
  

  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){
    await this.testSepaSource();//Test DataSource
    this.newSubRouter("ALL_OP_TASKS",{},"on_new_task")
    this.newSubRouter("ALL_LOG_TIMES",{},"add_log_time")
    this.log.info("##### APP INITIALIZED ######")
    //console.log("===============================================================================")
  }

  //Questa funzione deve contattare OpenProject e aggiungere lo spent time alla task corretta.
  /*
  binding={
    
  }
  */
  wait(t){
    return new Promise(resolve=>{
      setTimeout(() => {
        console.log("Delayed for "+t+" seconds.");
        resolve("OK")
      },t)
    })
  }
  async on_new_task(binding){
    this.tasksCache.push(binding);
  }
  
  async add_log_time(_LOG_TIME){
    var _TASK;
    //console.log(binding)
    var task_uri=_LOG_TIME.task_uri;
    console.log("Log time for task: "+task_uri)
    var found=false;
    for(var task of this.tasksCache){
      if(task.bnode==task_uri){
        found=true;
        _TASK=task;
        break;
      }
    }
    if(found){
      await this.opClient.update_wp(_TASK,_LOG_TIME)
      /*var response=await this.SET_SYNCHRONIZATION_FLAG({
            flag_type:"http://www.vaimee.it/my2sec/testfinished",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it"
      })*/
    }else{
      throw new Error("task not found")
    }

  }

}//end of class 



module.exports = OpConsumer;