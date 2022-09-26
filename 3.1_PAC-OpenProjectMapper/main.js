g=require('./greglogs.js')
const JsapApi = require('@arces-wot/sepa-js').Jsap//jsap api
require('./host-jsap.js')

console.clear();

console.log("#############")
console.log("# OP MAPPER #")
console.log("#############\n")

let client= new JsapApi(jsap);

data = {
    usergraph : "http://www.vaimee.it/my2sec/admin@vaimee.it",
    source: "http://www.vaimee.it/sources/open-project"
}

let sub = client.ALL_OP_MESSAGES(data)
sub.on("notification",not=>{

    g.Log(1,"# NEW OP MESSAGE RECEIVED! #")
    var bindings=extract_bindings(not)
    //console.log(bindings)
    for(var binding in bindings){
        handle_mapping(bindings[binding])
    }

})


//-----------------------------------------------------------------------------
//FUNCTIONS
async function handle_mapping(binding){

    var string_msg=binding.msgvalue.value
    var json_msg=JSON.parse(string_msg)
    //console.log(json_msg)

    //TASK INFO
    const task_id=json_msg.work_package.id //TASK ID
    const task_subj=json_msg.work_package.subject //NOME DELLA TASK AGGIORNATA
    var task_estTime=json_msg.work_package.estimatedTime //spent time

    if(task_estTime==null){
        task_estTime=0
    }

    //INFO ASSOCIATED WITH TASK
    const embedded=json_msg.work_package._embedded

    const project=embedded.project //PROJECT INFO!!!
    const project_name=project.name
    const project_id=project.id
    const project_uri="http://www.vaimee.it/projects#"+project.identifier

    const assignee=embedded.assignee //ASSIGNEE INFO!!!
    const assignee_uri="http://www.vaimee.it/my2sec/members/"+assignee.email

    //console.log(json_msg.work_package)
    //console.log("- PROJECT INFO: -")
    //console.log("  -> PROJECT URI: "+project_uri)
    //console.log("  -> PROJECT ID: "+project_id)
    //console.log("  -> PROJECT NAME: "+project_name)
    //console.log("- TASK INFO: -")
    //console.log("  -> TASK ID: "+task_id)
    //console.log("  -> TASK TITLE: "+task_subj)
    //console.log("  -> ASSIGNEE: "+assignee_uri)
    //console.log("  -> SPENT TIME: "+task_estTime)

    //CONSTRUCT PROJECT FORCED BINDINGS
    console.log("- PROJECT INFO: -")
    project_data={
        projecturi: project_uri,
        projectid: project_id,
        project_identifier: project_name
    }
    console.log(project_data)

    //CONSTRUCT TASK FORCED BINDINGS
    console.log("- TASK INFO: -")
    task_data={
        graph: "http://www.vaimee.it/projects#",
        projecturi: project_uri,
        task_id: task_id,
        task_title: task_subj,
        assignee: assignee_uri,
        spent_time: task_estTime
    }
    console.log(task_data)


    //UPDATE SEPA
    await update_sepa_project(project_data)
    await update_sepa_task(task_data)


    console.log("- PROJECT UPDATED CORRECTLY! -")

}


function update_sepa_project(project_data){

    return new Promise(resolve=>{

        client.UPDATE_PROJECT(project_data)
        .then(res=>{
            console.log("Update response: " + JSON.stringify(res))
            resolve("ok")
        }) 

    })

}


function update_sepa_task(task_data){

    return new Promise(resolve=>{

        client.UPDATE_TASK(task_data)
        .then(res=>{
            console.log("Update response: " + JSON.stringify(res))
            resolve("ok")
        }) 

    })

}





//extracts bindings from json response
function extract_bindings(msg){
	var bindings=msg.addedResults.results.bindings;
	return bindings;
}
