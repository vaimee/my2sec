//'use-strict';
const { CO, Duration, EntityManager, Project, Status, StatusEnum, Type, WP, TypeEnum, User } = require('op-client');
var http=require("http")
var GregLogs = require("../../utils/GregLogs.js")
//import { fetch } from 'node-fetch';
//const http=require("http")
//const https=require("https")

class OpenProjectClient {
    constructor(config){
        this.host=config.host;
        this.port=config.port;
        this.clientId=config.clientId;
        this.clientSecret=config.clientSecret;
        this.apiKey=config.apiKey;
        this.em = new EntityManager({
            baseUrl: "http://"+this.host+":"+this.port,//"http://openproject:80",//http://host.docker.internal:889
            oauthOptions: {
                clientId: this.clientId,//"pIuaMa7WY4xwkkVNobDjQpp_OSjzsUrMXEKnjCVkWQA", //n3d2NUpnrMU5HenPac3lRh5nE38AZAViekVOIDbnzGk",
                clientSecret: this.clientSecret//"nNFyLa7MRSJ2Pnq9ju8_f3Lg4FxRW4Gs1EdFgfIAHr4"//"xS2Ao-MPUmkLP3cT1Jyzhj4fgjLugSOiTxrGzLayAQc",
            },
            createLogger: ()=> console
        });
        console.log(1,"EntityManager instance successfully created")

    }

    async get_projects(){
        var projects=await this.get_auth_resource('/api/v3/projects')
        return JSON.parse(projects)
    }

    async add_task(subject,user_href,project_link){
        var newWorkPackageData={
            "subject":subject,//"nuovataskpertestuser!!!!!",
            "_links":{
                "assignee":{
                    "href": user_href//"/api/v3/users/12"
                },
                "project":project_link
                /*"project": { 
                    "href": project_href//"/api/v3/projects/2",
                    //"title": "My2sec" 
                }*/
            }
        }
        var res=await this.patch_auth_resource('/api/v3/work_packages',newWorkPackageData)
        return res
    }

    async add_membership(user_href,project_link){
        var newMembershipData={
            "_links":{
                "principal": {
                    "href": user_href//"/api/v3/users/12"
                },
                "project":project_link,
                /*
                "project": { 
                    "href": project_href//"/api/v3/projects/2",
                    //"title": "My2sec" 
                },*/
                "roles": [
                    { 
                        "href": "/api/v3/roles/4", 
                        "title": "Member" 
                    }
                ]
            }
      
        }
        var res=await this.patch_auth_resource('/api/v3/memberships',newMembershipData)
        return res
    }

    async create_user(login,email,firstName,lastName,password){
        //ERROR:  non mettere name, PASSWORD MUST BE MORE THAN 10 CHARACTERS
        var newUserData={
            login: login,
            email: email,//"testuser1@example.com",
            //name: "testuserName",
            firstName: firstName,//"none",
            lastName: lastName,//"none",
            status: "active",
            password: password//"testuser02"//MUST BE MORE THAN 10 CHARS
  
        }
        var res=await this.patch_auth_resource('/api/v3/users',newUserData)
        return res
    }

    async update_wp(_TASK,_LOG_TIME){
        console.log("TROVATA TASK!")
        console.log(_TASK)
        console.log("LOG TIME DA ASSOCIARE:")
        console.log(_LOG_TIME)
        // get Work Package by id
        var logTimeHours=_LOG_TIME.log_time/3600;
        console.log(logTimeHours)
        
        var wp = await this.em.get(WP, parseInt(_TASK.taskid));
        //console.log(wp.body._links.assignee)
        //console.log(wp.body)
        var data={
            comment:{format: "plain", raw: "", html: ""},
            hours: `PT${logTimeHours}H`,
            spentOn: "2023-01-17",
            _links: {
                activity: {
                    href: "/api/v3/time_entries/activities/1", 
                    title: "Management"
                },
                self: {href:null},
                user: wp.body._links.assignee,
                workPackage:wp.body._links.self //{href:/api/v3/work_packages/{id},title:maous}
            }
        }
        this.patch_auth_resource("/api/v3/time_entries",data);
    }


    async get_task_by_id(id){
        var wp = await this.get_auth_resource("/api/v3/work_packages/"+id)//await this.em.get(WP, id)
        wp=JSON.parse(wp)
        console.log(wp.spentTime)
        //get project info
        var embedded=wp._embedded
        var project=embedded.project //PROJECT INFO!!!
        var pname=project.name

        //console.log("Including "+pname)
        //var user = await em.get(User, wp.body._embedded.assignee.id);
        var user=await this.get_auth_resource("/api/v3/users/"+wp._embedded.assignee.id)
        //console.log(JSON.parse(user).email)
        var msg=this.construct_standard_message(wp,user)
        return msg
    }


    async get_tasks(whitelisted_projects){
        // TODO: FIND A SCALABLE WAY TO QUERY WORK PACKAGES
        console.log("Getting Work Packages ids...");
        //const work_packages_json = await this.em.getMany(WP);
        var res=await this.get_auth_resource("/api/v3/work_packages?pageSize=1000");
        res=JSON.parse(res);
        //console.log(work_packages_json.length)
        const work_packages_ids= this.get_work_packages_ids(res._embedded.elements);
        //throw new Error("MAUS")

        var string_messages=[];
        var counter=0;
        for(var i in work_packages_ids){
            var id=work_packages_ids[i];
            console.log("------------------------------------------------------------------")
            var wp = await this.get_auth_resource("/api/v3/work_packages/"+id)//await this.em.get(WP, id)
            wp=JSON.parse(wp)
            console.log(wp.spentTime)
            //get project info
            var embedded=wp._embedded
            var project=embedded.project //PROJECT INFO!!!
            var pname=project.name

            if(!whitelisted_projects || whitelisted_projects.includes(pname)){
                console.log("Including "+pname)
                //var user = await em.get(User, wp.body._embedded.assignee.id);
                var user=await this.get_auth_resource("/api/v3/users/"+wp._embedded.assignee.id)
                //console.log(JSON.parse(user).email)
                string_messages[counter]=this.construct_standard_message(wp,user)
                counter++
                console.log("\n")
            }else{
                console.log("Ignored "+pname)
            }
            //throw new Error("MAOUS")
        }
        //throw new Error("MAO")
        return string_messages;
    }

    async get_tasks_old(whitelisted_projects){
        console.log(1,"Getting Work Packages ids...");
        
        
        
        
        const work_packages_json = await this.em.getMany(WP);
        const work_packages_ids= this.get_work_packages_ids(work_packages_json);
        
        var string_messages=[];
        var counter=0;
        for(var i in work_packages_ids){
            var id=work_packages_ids[i];
            console.log("------------------------------------------------------------------")
            var wp = await this.em.get(WP, id)
            //get project info
            var embedded=wp.body._embedded
            var project=embedded.project //PROJECT INFO!!!
            var pname=project.name

            if(!whitelisted_projects || whitelisted_projects.includes(pname)){
                console.log("Including "+pname)
                //var user = await em.get(User, wp.body._embedded.assignee.id);
                var user=await this.get_auth_resource("/api/v3/users/"+wp._embedded.assignee.id)
                //console.log(JSON.parse(user).email)
                string_messages[counter]=this.construct_standard_message(wp.body,user)
                counter++
                console.log("\n")
            }else{
                console.log("Ignored "+pname)
            }
        }
        return string_messages;
    }

    construct_standard_message(json_msg,json_user){
        //console.log(json_msg)
        json_msg._embedded.assignee.email=JSON.parse(json_user).email;
        console.log(json_msg._embedded.assignee.email)
        var standard_json_msg={
            "work_package":json_msg
        }
        return standard_json_msg//this.json_stringySEPA(standard_json_msg)
    }

    get_work_packages_ids(work_packages_json){
        //console.log(work_packages_json)
        var work_packages_ids=[];
        var counter=0;
        for(var key in work_packages_json){
            work_packages_ids[counter]=work_packages_json[key].id;
            counter++
        }
        return work_packages_ids
    }

    patch_auth_resource(path,update){
        return new Promise(resolve=>{
            var username="apikey"
            var password=this.apiKey//"bcc95e391fc9f7eee77aa7cb3bbc8cd126108d6a6623c944a72d56f09e3bd633"//"37fdc215964b5f21fc99fde4e59a83d1c1c363eb2b818db2ff9a2af65e7f2d12"
            var auth="Basic " + new Buffer(username + ":" + password).toString("base64");
            const http = require('http');        
            const options = {
                hostname: this.host,//"openproject",//'host.docker.internal',
                port: this.port,//80,//889,
                path: path,
                method: 'POST',
                headers: {
                    "Content-Type": 'application/json',
                    'Authorization': auth
                }
            }
            
            const req = http.request(options, res => {
            
                let data = '';
            
                console.log('Status: ', res.statusCode);
                //console.log('Headers: ', JSON.stringify(res.headers));
            
                res.setEncoding('utf8');
            
                res.on('data', chunk => {
                    data += chunk;
                });
            
                res.on('end', () => {
                    //console.log('Body: ', JSON.parse(data));
                    resolve(JSON.parse(data))
                });
            
            }).on('error', e => {
                console.error(e);
            });
            
            req.write(JSON.stringify(update));
            req.end();
        })
    }
    
    get_auth_resource(path){
        var username="apikey"
        var password=this.apiKey//"bcc95e391fc9f7eee77aa7cb3bbc8cd126108d6a6623c944a72d56f09e3bd633"//"37fdc215964b5f21fc99fde4e59a83d1c1c363eb2b818db2ff9a2af65e7f2d12"
        var auth="Basic " + new Buffer(username + ":" + password).toString("base64");
        return new Promise(resolve=>{
        var options={
            hostname: this.host,//"openproject",//"host.docker.internal",
            port: this.port,//80,//889,
            path: path, //`${request.path}`, //forward the path to the api
            method: 'GET',
            headers: {
                  'Content-Type': 'application/json',
                  'Connection': 'close',
                  'Authorization': auth
            },
        }
        var callback = function(response) {
            var str = '';
            //another chunk of data has been received, so append it to `str`
            response.on('data', function (chunk) {
              str += chunk;
            });
            //the whole response has been received, so we just print it out here
            response.on('end', function () {
              //console.log(str);
              resolve(str)
            });
          }
          http.request(options, callback).end();
        })
    }

    //---------------------------
    //NAME: JSON STRINGIFY 4 SEPA
    json_stringySEPA(json_object){
        var corrupted= JSON.stringify(json_object);
        corrupted= corrupted.replace(/\'/g,"\\\'");//replace virgoletta
        var cleaned_json= corrupted.replace(/\\/g,"\\\\");//duplicate backslash
        return cleaned_json;
    }

}

module.exports=OpenProjectClient