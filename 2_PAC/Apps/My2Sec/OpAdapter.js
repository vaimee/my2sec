var PacFactory=require('../../core/PacFactory.js'); //Pac Factory
var OpClient=require('../../core/clients/OpenProjectClient.js');
var Producer=require('../../core/Pattern/Producer');
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
    /*
      //LOCALHOSTthis.opClient=new OpClient({
      host:"localhost",
      port:889,
      clientId:"n3d2NUpnrMU5HenPac3lRh5nE38AZAViekVOIDbnzGk",
      clientSecret:"xS2Ao-MPUmkLP3cT1Jyzhj4fgjLugSOiTxrGzLayAQc",
      apiKey:"37fdc215964b5f21fc99fde4e59a83d1c1c363eb2b818db2ff9a2af65e7f2d12"
    });
    //DLD
    {
      host:"dld.arces.unibo.it",
      port:8078,
      clientId:"pIuaMa7WY4xwkkVNobDjQpp_OSjzsUrMXEKnjCVkWQA",
      clientSecret:"nNFyLa7MRSJ2Pnq9ju8_f3Lg4FxRW4Gs1EdFgfIAHr4",
      apiKey:"bcc95e391fc9f7eee77aa7cb3bbc8cd126108d6a6623c944a72d56f09e3bd633"
    }
    */

    this.opClient=new OpClient(jsap_file.extended.OpenProjectClientConfiguration);
    this.taskProducer=new Producer(jsap_file,"PATCH_TASK")
    this.projectProducer=new Producer(jsap_file,"UPDATE_PROJECT")
  }

  /*
  getEx(){
    return {
      "action":"time_entry:created",
      "time_entry":{
          "_type":"TimeEntry",
          "id":83,
          "comment":{
              "format":"plain",
              "raw":"","html":""
          },
          "spentOn":"2023-05-29",
          "hours":"PT1H",
          "createdAt":"2023-05-29T14:22:51Z",
          "updatedAt":"2023-05-29T14:22:51Z",
          "_embedded":{
              "project":{
                  "_type":"Project",
                  "id":3,
                  "identifier":"my2sec",
                  "name":"My2sec",
                  "active":true,
                  "public":true,
                  "description":{
                      "format":"markdown","raw":"","html":""
                  },
                  "createdAt":"2023-03-21T16:58:59Z",
                  "updatedAt":"2023-03-21T16:58:59Z",
                  "statusExplanation":{
                      "format":"markdown","raw":"","html":""
                  },
                  "_links":{"self":{"href":"/api/v3/projects/3","title":"My2sec"},
                  "createWorkPackage":{"href":"/api/v3/projects/3/work_packages/form","method":"post"},
                  "createWorkPackageImmediately":{
                      "href":"/api/v3/projects/3/work_packages","method":"post"
                  },
                  "workPackages":{"href":"/api/v3/projects/3/work_packages"},
                  "storages":[],
                  "categories":{"href":"/api/v3/projects/3/categories"},
                  "versions":{"href":"/api/v3/projects/3/versions"},
                  "memberships":{
                      "href":"/api/v3/memberships?filters=%5B%7B%22project%22%3A%7B%22operator%22%3A%22%3D%22%2C%22values%22%3A%5B%223%22%5D%7D%7D%5D"
                  },
                  "types":{"href":"/api/v3/projects/3/types"},
                  "update":{"href":"/api/v3/projects/3/form","method":"post"},
                  "updateImmediately":{"href":"/api/v3/projects/3","method":"patch"},
                  "delete":{"href":"/api/v3/projects/3","method":"delete"},
                  "schema":{"href":"/api/v3/projects/schema"},"ancestors":[],
                  "parent":{"href":null},"status":{"href":null}}
              },
              "workPackage":{
                  "_type":"WorkPackage",
                  "id":50,
                  "lockVersion":0,
                  "subject":"http://www.vaimee.it/ontology/my2sec#Developing",
                  "description":{"format":"markdown","raw":"","html":""},
                  "scheduleManually":false,"startDate":null,
                  "dueDate":null,"derivedStartDate":null,"derivedDueDate":null,"estimatedTime":null,
                  "derivedEstimatedTime":null,"duration":null,"ignoreNonWorkingDays":false,
                  "spentTime":"PT0S",
                  "percentageDone":0,
                  "createdAt":"2023-03-21T17:09:58Z",
                  "updatedAt":"2023-03-21T17:09:58Z",
                  "laborCosts":"0.00 EUR",
                  "materialCosts":"0.00 EUR","overallCosts":"0.00 EUR","remainingTime":null,
                  "_links":{"attachments":{"href":"/api/v3/work_packages/50/attachments"},
                  "addAttachment":{"href":"/api/v3/work_packages/50/attachments","method":"post"},
                  "fileLinks":{"href":"/api/v3/work_packages/50/file_links"},
                  "addFileLink":{"href":"/api/v3/work_packages/50/file_links","method":"post"},
                  "self":{"href":"/api/v3/work_packages/50","title":"http://www.vaimee.it/ontology/my2sec#Developing"},
                  "update":{"href":"/api/v3/work_packages/50/form","method":"post"},
                  "schema":{"href":"/api/v3/work_packages/schemas/3-1"},
                  "updateImmediately":{"href":"/api/v3/work_packages/50","method":"patch"},
                  "delete":{"href":"/api/v3/work_packages/50","method":"delete"},
                  "logTime":{
                      "href":"/api/v3/time_entries",
                      "title":"Log time on http://www.vaimee.it/ontology/my2sec#Developing"
                  },
                  "move":{"href":"/work_packages/50/move/new","type":"text/html","title":"Move http://www.vaimee.it/ontology/my2sec#Developing"},
                  "copy":{"href":"/work_packages/50/copy","title":"Copy http://www.vaimee.it/ontology/my2sec#Developing"},
                  "pdf":{"href":"/work_packages/50.pdf","type":"application/pdf","title":"Export as PDF"},
                  "atom":{"href":"/work_packages/50.atom","type":"application/rss+xml","title":"Atom feed"},
                  "availableRelationCandidates":{"href":"/api/v3/work_packages/50/available_relation_candidates","title":"Potential work packages to relate to"},
                  "customFields":{"href":"/projects/my2sec/settings/custom_fields","type":"text/html","title":"Custom fields"},
                  "configureForm":{"href":"/types/1/edit?tab=form_configuration","type":"text/html","title":"Configure form"},"activities":{"href":"/api/v3/work_packages/50/activities"},
                  "availableWatchers":{"href":"/api/v3/work_packages/50/available_watchers"},
                  "relations":{"href":"/api/v3/work_packages/50/relations"},
                  "revisions":{"href":"/api/v3/work_packages/50/revisions"},
                  "watchers":{"href":"/api/v3/work_packages/50/watchers"},
                  "addWatcher":{"href":"/api/v3/work_packages/50/watchers","method":"post","payload":{"user":{"href":"/api/v3/users/{user_id}"}},"templated":true},
                  "removeWatcher":{"href":"/api/v3/work_packages/50/watchers/{user_id}","method":"delete","templated":true},
                  "addRelation":{"href":"/api/v3/work_packages/50/relations","method":"post","title":"Add relation"},"addChild":{"href":"/api/v3/projects/my2sec/work_packages","method":"post","title":"Add child of http://www.vaimee.it/ontology/my2sec#Developing"},"changeParent":{"href":"/api/v3/work_packages/50","method":"patch","title":"Change parent of http://www.vaimee.it/ontology/my2sec#Developing"},"addComment":{"href":"/api/v3/work_packages/50/activities","method":"post","title":"Add comment"},"previewMarkup":{"href":"/api/v3/render/markdown?context=/api/v3/work_packages/50","method":"post"},"timeEntries":{"href":"/api/v3/time_entries?filters=%5B%7B%22work_package_id%22%3A%7B%22operator%22%3A%22%3D%22%2C%22values%22%3A%5B%2250%22%5D%7D%7D%5D","title":"Time entries"},"ancestors":[],"category":{"href":null},"type":{"href":"/api/v3/types/1","title":"Task"},"priority":{"href":"/api/v3/priorities/8","title":"Normal"},"project":{"href":"/api/v3/projects/3","title":"My2sec"},"status":{"href":"/api/v3/statuses/1","title":"New"},"author":{"href":"/api/v3/users/3","title":"OpenProject Admin"},"responsible":{"href":null},"assignee":{"href":"/api/v3/users/12","title":"greg none"},"version":{"href":null},"parent":{"href":null,"title":null},"customActions":[],"logCosts":{"href":"/work_packages/50/cost_entries/new","type":"text/html","title":"Log costs on http://www.vaimee.it/ontology/my2sec#Developing"},"showCosts":{"href":"/projects/3/cost_reports?fields%5B%5D=WorkPackageId&operators%5BWorkPackageId%5D=%3D&set_filter=1&values%5BWorkPackageId%5D=50","type":"text/html","title":"Show cost entries"},"costsByType":{"href":"/api/v3/work_packages/50/summarized_costs_by_type"},"github":{"href":"/work_packages/50/tabs/github","title":"github"},"github_pull_requests":{"href":"/api/v3/work_packages/50/github_pull_requests","title":"GitHub pull requests"},"convertBCF":{"href":"/api/bcf/2.1/projects/my2sec/topics","title":"Convert to BCF","payload":{"reference_links":["/api/v3/work_packages/50"]},"method":"post"}}},"user":{"_type":"User","id":12,"name":"greg none","createdAt":"2023-03-21T17:09:56Z","updatedAt":"2023-03-21T17:09:56Z","login":"greg","admin":false,"firstName":"greg","lastName":"none","email":"gregorio.monari@vaimee.it","avatar":"http://gravatar.com/avatar/4c68b0c77c6b685226455a7f1608cad5?default=404&secure=false","status":"active","identityUrl":null,"language":"en","_links":{"self":{"href":"/api/v3/users/12","title":"greg none"},"memberships":{"href":"/api/v3/memberships?filters=%5B%7B%22principal%22%3A%7B%22operator%22%3A%22%3D%22%2C%22values%22%3A%5B%2212%22%5D%7D%7D%5D","title":"Members"},"showUser":{"href":"/users/12","type":"text/html"},"updateImmediately":{"href":"/api/v3/users/12","title":"Update greg","method":"patch"},"lock":{"href":"/api/v3/users/12/lock","title":"Set lock on greg","method":"post"},"delete":{"href":"/api/v3/users/12","title":"Delete greg","method":"delete"}}},"activity":{"_type":"TimeEntriesActivity","id":1,"name":"Management","position":1,"default":true,"_links":{"self":{"href":"/api/v3/time_entries/activities/1","title":"Management"},"projects":[]}}},"_links":{"self":{"href":"/api/v3/time_entries/83"},"updateImmediately":{"href":"/api/v3/time_entries/83","method":"patch"},"update":{"href":"/api/v3/time_entries/83/form","method":"post"},"delete":{"href":"/api/v3/time_entries/83","method":"delete"},"schema":{"href":"/api/v3/time_entries/schema"},"project":{"href":"/api/v3/projects/3","title":"My2sec"},"workPackage":{"href":"/api/v3/work_packages/50","title":"http://www.vaimee.it/ontology/my2sec#Developing"},"user":{"href":"/api/v3/users/12","title":"greg none"},"activity":{"href":"/api/v3/time_entries/activities/1","title":"Management"}}}}
  
  }*/


  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){
    await this.update_tasks();
    //var res=this.getEx().time_entry._embedded.workPackage
    //console.log(res)
    this.newPostRouter("/opadapter/webhook","onNewMessage")
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

  // TODO: WEBHOOK
  async onNewMessage(e){
    const body=e.req.body;
    if(body.hasOwnProperty("action")){
      if(body.action!="time_entry:created"){
        console.log("Invalid message, skipping")
        return
      }
    }else{
      console.log("Invalid message, skipping")
      return;
    }

    console.log(JSON.stringify(e.req.body))
    console.log(" ")
    
    var wp=body.time_entry._embedded.workPackage
    var taskId=wp.id;
    console.log("TaskId: "+taskId)
    var string_message=await this.opClient.get_task_by_id(parseInt(taskId));

    //console.log(string_message)
    var taskBindings=this.construct_op_task_forced_bindings(string_message);
    console.log(taskBindings)
    console.log("UPDATING TASKS: ",taskBindings)
    //await this.ADD_TASK("UPDATING TASKS ",taskBindings);
    await this.taskProducer.updateSepa(taskBindings)
    console.log("UPDATED SEPA!")
  }

  //Gets all the tasks from openproject
  async update_tasks(){
    var string_messages=await this.opClient.get_tasks("My2sec");
    console.log("MAO")
    //throw new Error("MAO")
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
    //console.log(json_obj.work_package)
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
    op_task_forced_bindings["spent_time"]=json_obj.work_package.spentTime //spent time
    if(json_obj.work_package.spentTime==null){
        op_task_forced_bindings["spent_time"]=0;
    }
    return op_task_forced_bindings;
}
 
}//end of class 

module.exports = OpAdapter;