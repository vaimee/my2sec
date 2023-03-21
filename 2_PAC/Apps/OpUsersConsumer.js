var Consumer=require('../gregnet_modules/PacFactory/Pattern/Consumer.js'); //producer client
var OpClient=require('../gregnet_modules/PacFactory/OpenProjectClient.js');
var Producer=require('../gregnet_modules/PacFactory/Pattern/Producer');
//require("../jsap.js"); //jsap configuration file
//var events=require("events")
/*###########################################
|| NAME: KEYCLOAK MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Jeycloak messages into users
############################################*/
class OpUsersConsumer extends Consumer{

  //============= CLASS CONSTRUCTOR ==============
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################")
    console.log("║║ # App: OpUsersConsumer v0.2");
    console.log("║║ ###########################");
    super(jsap_file,"ALL_USERNAMES",{});
    this.log.loglevel=1;
    this.opClient=new OpClient(jsap_file.extended.OpenProjectClientConfiguration);
    this.tasksArr = [
        "http://www.vaimee.it/ontology/my2sec#Developing",
        "http://www.vaimee.it/ontology/my2sec#Researching",
        "http://www.vaimee.it/ontology/my2sec#Testing",
        "http://www.vaimee.it/ontology/my2sec#Reporting",
        "http://www.vaimee.it/ontology/my2sec#Meeting",
        "http://www.vaimee.it/ontology/my2sec#Email",
        "http://www.vaimee.it/ontology/my2sec#Others"
    ];
    this.taskProducer=new Producer(jsap_file,"ADD_TASK")
    this.createSepaTasks=true;

  }

  //============ CALL TO START APP ===============
  async start(){
    //Test DataSource
    await this.testSepaSource();
    this.subscribeToSepa();

    /*
    var temp=await this.opClient.get_auth_resource('/api/v3/users/schema');
    temp=JSON.parse(temp)
    //console.log(temp)

    var temp=await this.opClient.get_auth_resource('/api/v3/users');
    temp=JSON.parse(temp)
    temp=temp._embedded.elements;
    console.log(temp)

    temp=await this.opClient.get_auth_resource('/api/v3/memberships/');
    temp=JSON.parse(temp);
    temp=temp._embedded.elements;
    console.log(temp[0]._links)
    //console.log(temp)

    //ERROR:  non mettere name, PASSWORD MUST BE MORE THAN 10 CHARACTERS
    var newUserData={
      login: "testuser1",
      email: "testuser1@example.com",
      //name: "testuserName",
      firstName: "none",
      lastName: "none",
      status: "active",
      password: "testuser02"//MUST BE MORE THAN 10 CHARS

    }
    //this.opClient.patch_auth_resource('/api/v3/users',newUserData)
    var newMembershipData={
      "_links":{
          "principal": {
              "href": "/api/v3/users/12"
          },
          "project": { 
              "href": "/api/v3/projects/2",
              "title": "My2sec" 
          },
          "roles": [
              { 
                  "href": "/api/v3/roles/4", 
                  "title": "Member" 
              }
          ]
      }

    }
    //this.opClient.patch_auth_resource('/api/v3/memberships',newMembershipData)

    var newWorkPackageData={
      "subject":"nuovataskpertestuser!!!!!",
      "_links":{
          "assignee":{
              "href": "/api/v3/users/12"
          },
          "project": { 
              "href": "/api/v3/projects/2",
              "title": "My2sec" 
          }
      }
    }
    */

  }

  async onNewUser(project,username,mail){
    var tasks=this.tasksArr;
    //this.log.info("")
    this.log.info("-----------------< # User creation procedure starting... # >-------------------")
    //[1] CREATE NEW OPEN PROJECT USER
    var res=await this.opClient.create_user(username,mail,username,"none",mail);
    //[2] GET NEW USER HREF
    var user_href=res._links.self.href;
    this.log.info(`1. Created user '${username}', email: ${mail}, href: ${user_href}`)
    //[3] GET MY2SEC PROJECT HREF
    var project_link=await this.get_project_link(project)//"My2sec")
    //console.log(project_link)
    this.log.info(`2. Fetched project link: ${JSON.stringify(project_link)}`)
    //[4] ADD MEMBERSHIP TO PROJECT
    await this.opClient.add_membership(user_href,project_link)
    this.log.info(`3. Added '${username}' membership to project: ${project}`)
    //[5] ADD TASKS TO PROJECT
    for(var i in tasks){
      var wp=await this.opClient.add_task(tasks[i],user_href,project_link);
      if(this.createSepaTasks){//enable sepa tasks creation
        var taskBindings=this.construct_op_task_forced_bindings({work_package:wp})
        //console.log(bindings)
        await this.taskProducer.updateSepa(taskBindings);
      }
    }
    if(this.createSepaTasks){
      this.log.info(`4. Added ${tasks.length} tasks for '${username}' on OpenProject and SEPA`)
    }else{
      this.log.info(`4. Added ${tasks.length} tasks for '${username}' on OpenProject, avoided SEPA update`)
    }
    this.log.info("-----------------< User creation procedure complete! >-------------------")
    //console.log(user_href)
  }


  async get_project_link(name){
    var projects=await this.opClient.get_projects()
    return new Promise(resolve=>{
      projects=projects._embedded.elements;
      //console.log(projects._embedded.elements)
      Object.keys(projects).forEach(k=>{
        //console.log(projects[k])
        var pname=projects[k].name;
        //console.log(pname)
        if(pname == name){
          //console.log("FOUND")
          //console.log(projects[k])
          resolve(projects[k]._links.self);
        }
      })
    })
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


  //---------------------------------------------------------------------------------------
  //ON NOTIFICATION
  //@OVERRIDE
  onFirstResults(not){
    this.log.trace("First results for "+this.queryname+" consumer: "+JSON.stringify(not));
    //this.onAddedResults(not);
    this.log.info("Ignored first results");
  }
  async onAddedResults(not){
    this.log.trace("Added results for "+this.queryname+" consumer: "+JSON.stringify(not));
    //this.onAddedUser(not);
    //this.log.info(not.s);
    var arr = not.s.split('/')
    var mail = arr[arr.length - 1].trim()
    //console.log(mail);
    this.log.info(`New user notification received for '${not.o}', email: ${mail}`)
    try{
      await this.onNewUser("My2sec",not.o,mail)//("My2sec","testuser13","testuser13@example.com")
    }catch(e){
      console.log("Dev comment: User creation procedure failed. Maybe the user already exists? or the password is too short?")
      console.log(e)
    }
    /*
    await this.createNewOpenProjectUser(mail, not.o)
    await this.addProjectMembership(mail,not.o)
    await this.createNewOpenProjectTasks(mail, not.o)
    */
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



module.exports = OpUsersConsumer;