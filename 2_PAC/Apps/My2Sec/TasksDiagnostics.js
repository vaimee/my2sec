const OpenProjectClient = require("../../core/clients/OpenProjectClient")
const TasksConsumer = require("../../core/Pattern/My2Sec/TasksConsumer")
const UserActivityTypesConsumer = require("../../core/Pattern/My2Sec/UserActivityTypesConsumer")
const UsersConsumer = require("../../core/Pattern/My2Sec/UsersConsumer")
const Producer = require("../../core/Pattern/Producer")
const GregLogs = require("../../utils/GregLogs")

class TasksDiagnostics{
    constructor(jsap){
        this.usersConsumer= new UsersConsumer(jsap)
        this.userActivityTypesConsumer= new UserActivityTypesConsumer(jsap,"noemail")
        this.opClient=new OpenProjectClient(jsap.extended.OpenProjectClientConfiguration);
        this.taskProducer=new Producer(jsap,"ADD_TASK")
        this.log=new GregLogs()
    }

    async start(){
        var project_link=await this.get_project_link("My2sec")
        //console.log(project_link)
        this.log.info(`2. Fetched project link: ${JSON.stringify(project_link)}`)

        const opUsersMap= await this.getOpUsers()
        //console.log(opUsers)
        //throw new Error("MAo")

        const sepaUsersArr=await this.getAllUsersArr()
        //console.log("All users:",users)
        for(const user of sepaUsersArr){
            console.log(" ")
            console.log("---------------------<User: "+user+">---------------------")

            const userActivityTypes=await this.getUserActivityTypes(user)
            console.log("Activity types: ",userActivityTypes.length)
            if(userActivityTypes.length==0){
                console.log("No activity types detected, skipping user")
                continue
            }

            const userTasks=await this.getUserTasks(user)
            console.log("Tasks:",userTasks.length)
            if(userTasks.length==0){
                console.log("No tasks detected, skipping user")
                continue 
            }

            const missing=this.getMissingTasks(userActivityTypes,userTasks)
            console.log("Missing:",missing)
            if(missing.length!=0){
                console.log("Found missing tasks, updating tasks for user...")
                var arr = user.split('/')
                var mail = arr[arr.length - 1].trim()
                const res=await this.addMissingTasksForUser(user,missing,opUsersMap.get(mail),project_link)
                if(!res){
                    throw new Error("Error adding task for user: "+user)
                }
            }
        }
    }


    async addMissingTasksForUser(usergraph,missingTasks,userMap,project_link){
        console.log("Adding "+missingTasks.length+" missing tasks")
        console.log(project_link)
        const user_href=userMap.get("href")
        console.log(user_href)
        //Get user href
        //Get Project href
        //For each missing task, add task to OP and update Sepa with task

        //[5] ADD TASKS TO PROJECT
        for(const task of missingTasks){
          //console.log("** Adding task "+task+" to user "+usergraph)
          //var wp=await this.opClient.add_task(task,user_href,project_link);
          //var taskBindings=this.construct_op_task_forced_bindings({work_package:wp})
          //console.log("Added optask, Updating sepa with bindings:",taskBindings)
          //await this.taskProducer.updateSepa(taskBindings);
          //console.log("Updated sepa")
        }


        return true
    }


    async getOpUsers(){
        var out=new Map()
        var OpUsersPackage=await this.opClient.get_auth_resource("/api/v3/users?pageSize=1000") //"+wp._embedded.assignee.id)
        OpUsersPackage=JSON.parse(OpUsersPackage)
        var usersArr=OpUsersPackage._embedded.elements
        for(var user of usersArr){
            //console.log(usersArr[i].id,usersArr[i].email,usersArr[i]._links)
            var user_href=user._links.self.href;
            var user_id=user.id
            var user_email=user.email
            var cell=new Map()
            cell.set("id",user_id)
            cell.set("href",user_href)
            out.set(user_email,cell)
        }
        return out
    }


    getMissingTasks(activityTypes,tasks){
        var missing=[]
        for(var type of activityTypes){
            var found=false;
            for(var taskTitle of tasks){
                if(taskTitle==type){
                    found=true
                }
            }
            if(!found){
                missing.push(type)
            }
        }
        return missing;
    }

    async getUserTasks(usergraph){
        var arr = usergraph.split('/')
        var mail = arr[arr.length - 1].trim()
        var consumer=new TasksConsumer(jsap,mail)
        const userTasks=await consumer.querySepa()
        //console.log(userTasks)
        var out=[];
        for(var binding of userTasks){
            out.push(binding.tasktitle)
        }
        return out
    }

    async getUserActivityTypes(usergraph){
        const userActivityTypes= await this.userActivityTypesConsumer.querySepaWithBindings({
            usergraph:usergraph
        })
        var out=[];
        for(var binding of userActivityTypes){
            out.push(binding.activity_type)
        }
        return out
    }

    async getAllUsersArr(){
        const usersbindings=await this.usersConsumer.querySepa();
        var out=[];
        for(var binding of usersbindings){
            out.push(binding.s)
        }
        return out
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


}

module.exports= TasksDiagnostics