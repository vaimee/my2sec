const { CO, Duration, EntityManager, Project, Status, StatusEnum, Type, WP, TypeEnum, User } = require('op-client')
g=require('./greglogs.js')
console.clear()

//require('dotenv')


init()


async function init(){


    console.log("#################");
    console.log("# INITIAL SETUP #");
    console.log("#################")

    // create EntityManager instance
    const em = new EntityManager({
        baseUrl: "http://localhost:8099",
        oauthOptions: {
            clientId: "G31EV0cutWobZBQMRX-cZISfdGO3W0HR9IRYdh3BwAc",
            clientSecret: "NG4C0Kg6dFxWDMD54JK9ELJgYDyYnmjtF8RPFijVIZE",
        },
        createLogger: ()=> console
    });
    g.Log(1,"EntityManager instance successfully created")

    // get Work Package by id
    //const wp = await em.get(WP, id)
    g.Log(1,"Getting Work Packages ids...")
    const work_packages_json = await em.getMany(WP)
    var work_packages_ids=[];
    var counter=0;
    for(key in work_packages_json){
        work_packages_ids[counter]=work_packages_json[key].body.id;
        counter++
    }

    console.log(work_packages_ids)

    //var id=12
    for(i in work_packages_ids){
        var id=work_packages_ids[i];
        console.log("------------------------------------------------------------------")
        var wp = await em.get(WP, id)
        console.log(wp.body._embedded.assignee)

        var user = await em.get(User, wp.body._embedded.assignee.id);

        console.log(user)

        construct_initial_wp_forced_bindings(wp.body)
        console.log("\n")
    }



    



}




function construct_initial_wp_forced_bindings(json_msg){
    //var json_msg=JSON.parse(string_msg)
    //console.log(json_msg)

    //TASK INFO
    const task_id=json_msg.id //TASK ID
    const task_subj=json_msg.subject //NOME DELLA TASK AGGIORNATA
    var task_estTime=json_msg.estimatedTime //spent time

    if(task_estTime==null){
        task_estTime=0
    }

    //INFO ASSOCIATED WITH TASK
    const embedded=json_msg._embedded

    const project=embedded.project //PROJECT INFO!!!
    const project_name=project.name
    const project_id=project.id
    const project_uri="http://www.vaimee.it/projects#"+project.identifier

    const assignee=embedded.assignee //ASSIGNEE INFO!!!
    const assignee_uri="http://www.vaimee.it/my2sec/members/"+assignee.email

    //console.log(json_msg.work_package)
    console.log("- PROJECT INFO: -")
    console.log("  -> PROJECT URI: "+project_uri)
    console.log("  -> PROJECT ID: "+project_id)
    console.log("  -> PROJECT NAME: "+project_name)
    console.log("- TASK INFO: -")
    console.log("  -> TASK ID: "+task_id)
    console.log("  -> TASK TITLE: "+task_subj)
    console.log("  -> ASSIGNEE: "+assignee_uri)
    console.log("  -> SPENT TIME: "+task_estTime)
}









