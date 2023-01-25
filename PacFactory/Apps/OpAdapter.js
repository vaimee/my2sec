var PacFactory=require('../gregnet_modules/PacFactory/PacFactory.js'); //Pac Factory
var OpClient=require('../gregnet_modules/PacFactory/OpenProjectClient.js');
var Producer=require('../gregnet_modules/PacFactory/Pattern/Producer');
//const { CO, Duration, EntityManager, Project, Status, StatusEnum, Type, WP, TypeEnum, User } = require('op-client');
const http=require("http")
/*###########################################
|| NAME: OpenProjectAdapter APP
|| AUTHOR: Gregorio Monari
|| DATE: 13/01/2022
|| NOTES: Maps Op tasks into semantic data
############################################*/
class OpAdapter extends PacFactory{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################");
    console.log("║║ # App: OpenProject Adapter v0.1");
    console.log("║║ ###########################");
    super(jsap_file);
    
    //LOCALHOST
    /*this.opClient=new OpClient({
      host:"localhost",
      port:889,
      clientId:"n3d2NUpnrMU5HenPac3lRh5nE38AZAViekVOIDbnzGk",
      clientSecret:"xS2Ao-MPUmkLP3cT1Jyzhj4fgjLugSOiTxrGzLayAQc",
      apiKey:"37fdc215964b5f21fc99fde4e59a83d1c1c363eb2b818db2ff9a2af65e7f2d12"
    });*/
    //PORTAINER
    this.opClient=new OpClient({
      host:"openproject",//"localhost",//
      port:80,//889,//
      clientId:"pIuaMa7WY4xwkkVNobDjQpp_OSjzsUrMXEKnjCVkWQA",
      clientSecret:"nNFyLa7MRSJ2Pnq9ju8_f3Lg4FxRW4Gs1EdFgfIAHr4",
      apiKey:"bcc95e391fc9f7eee77aa7cb3bbc8cd126108d6a6623c944a72d56f09e3bd633"
    });
    this.taskProducer=new Producer(jsap_file,"ADD_TASK")
    this.projectProducer=new Producer(jsap_file,"UPDATE_PROJECT")
  }

  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){
    await this.update_tasks();
    this.newPostRouter("/opadapter/webhook",this.onNewMessage)
    //console.log("Task update response: "+res)
    //console.log("===============================================================================")
    var webhookPort=1366
    if(process.env.WEBHOOK_PORT!=undefined){
      webhookPort=process.env.WEBHOOK_PORT;
      console.log("LOADING ENV WEBHOOK_PORT: "+webhookPort)
    }else{
      //console.log("default hostname")	
    }
    this.listen(webhookPort);
  }

  onNewMessage(){
    console.log("MAO")
  }

  //Gets all the tasks from openproject
  async update_tasks(){
    var string_messages=await this.opClient.get_tasks("My2sec");
    //console.log(string_messages)
    for(var i in string_messages){
      var msg=string_messages[i];
      var projectBindings=this.construct_op_project_forced_bindings(msg);
      var taskBindings=this.construct_op_task_forced_bindings(msg);
      console.log("UPDATING PROJECTS: ",projectBindings)
      //await this.UPDATE_PROJECT(projectBindings);
      await this.projectProducer.updateSepa(projectBindings)
      console.log("UPDATING TASKS: ",taskBindings)
      //await this.ADD_TASK("UPDATING TASKS ",taskBindings);
      await this.taskProducer.updateSepa(taskBindings)
      console.log("UPDATED SEPA!")
      //console.log(projectBindings)
      //console.log(taskBindings)
    }
  }


  construct_op_project_forced_bindings(json_obj){
    var op_project_forced_bindings=JSON.parse("{}");
    var embedded=json_obj.work_package._embedded
    var project=embedded.project //PROJECT INFO!!!
    //INJECTION
    var pname=project.name.replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
	  pname=pname.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
    op_project_forced_bindings["project_identifier"]=pname;
    op_project_forced_bindings["projectid"]=project.id;
    var pid=project.identifier.replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
	  pid=pid.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
    op_project_forced_bindings["projecturi"]="http://www.vaimee.it/projects#"+pid;

    return op_project_forced_bindings;
  }

  construct_op_task_forced_bindings(json_obj){
    var op_task_forced_bindings=JSON.parse("{}");
    var embedded=json_obj.work_package._embedded
    var project=embedded.project //PROJECT INFO!!!
    //INJECTION
    //op_task_forced_bindings["graph"]="http://www.vaimee.it/projects#";
    op_task_forced_bindings["projecturi"]="http://www.vaimee.it/projects#"+project.identifier;
    op_task_forced_bindings["task_id"]=json_obj.work_package.id;
    var task_title=json_obj.work_package.subject.replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
	  task_title=task_title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
    op_task_forced_bindings["task_title"]=task_title;
    op_task_forced_bindings["assignee"]="http://www.vaimee.it/my2sec/"+embedded.assignee.email;
    op_task_forced_bindings["spent_time"]=json_obj.work_package.estimatedTime //spent time
    if(json_obj.work_package.estimatedTime==null){
        op_task_forced_bindings["spent_time"]=0;
    }
    return op_task_forced_bindings;
}
 
}//end of class 

module.exports = OpAdapter;