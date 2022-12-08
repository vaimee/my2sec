/*---------------------------------------------------------\
|| main.js: MAIN SCRIPT OF ACTIVITY WATCH PRODUCER
|| 	DATE: 28/06/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: initializes the application and defines 
||		some major functions
\\---------------------------------------------------------*/
//CLIENTS
let awManager;
let userInfoConsumer;
//TIMESTAMP FOR SYNCHRONIZATION, MUST REMAIN UNTOUCHED
var start_time="";
var end_time="";
//SILENT UPDATE
var silent_update=0;
var OVERWRITE_START_TIME="2022-11-10T00:00:00.00Z";
var OVERWRITE_END_TIME="2022-12-1T23:00:00.00Z";

//MAIN
console.log("//------------------------\\\\")
console.log("|| ActivityWatch PRODUCER ||")
console.log("\\\\------------------------//")
//INITIAL CONFIGURATION
init();

//==================================
// init: INITIALIZES THE APPLICATION
// modules: user credentials, superset dashboard, tasks
async function init(){
	log.info("Initializing App Modules") 
	//IF THIS SECTION FAILS, THE APP EXECUTION MUST STOP
	awManager = new AwManager();
	log.info("------TEST DATASOURCES----------------------")
	var test_results=await awManager.startTests();
	console.log(test_results)
	Object.keys(test_results).forEach(k=>{
		if(test_results[k]=="not-passed"){
			throw new Error("Datasource error: ")
		}
	})
	log.info("-------TEST COMPLETE------------------------")
	console.log(" ")

	//THIS SECTION MUST ALSO NOT FAIL, SO I WILL NOT CATCH ANY ERROR
	log.info("# KEYCLOAK #")
	log.debug("getting keycloak user credentials from node...")
	const user_credentials_string = await window.versions.request_user_credentials()
	const user_credentials_json=JSON.parse(user_credentials_string)
	log.trace_table(user_credentials_json)
	log.info("Fetched user information correctly")
	userInfoConsumer= new UserInfoConsumer(user_credentials_json.email)
	await userInfoConsumer.sepa_getUserName();
	log.debug("User info consumer initialized with data: Email("+userInfoConsumer.usermail+"), username("+userInfoConsumer.userName+")") // prints out 'pong'
	userInfoConsumer.logspan_username("user_name_welcome")
	userInfoConsumer.logspan_usermail("user_name");
	userInfoConsumer.logspan_subEventsCount("sub_counter")


	log.info("# SUPERSET DASHBOARD #")
	try{
		var dash_id=await userInfoConsumer.sepa_getUserDashboard();//"755f0434-6ac6-4d4f-8415-3b2b80c571e9";
		log.info("Fetched dashboard_id of "+userInfoConsumer.userName+" :"+dash_id)
		var superset_host="http://dld.arces.unibo.it:8087";
		var container_id="my-superset-container";
		var embed = createDashboard(dash_id,superset_host,container_id)
	}catch(e){
		console.log(e)
	}

	/*
	log.info("### LOADING TASKS ###")
	try{
		let tasksConsumer = new TasksConsumer();
		tasksConsumer.generate_tasks_template("task-wrapper")		
	}catch(e){
		console.log(e)
	}
	*/

	//INIT THE CLASS OF THE UPDATE BUTTON
	init_update_button()
	test()


}








async function test(){
	var start_event=await awManager.get_producer_event("last_start")
	var status=""
	if(Object.keys(start_event).length===0){
		status="start"
	}else{
		var update_event=await awManager.get_producer_event("last_update")
		if(Object.keys(update_event).length===0){
			status="continue"
		}else{
			if(new Date(start_event.data.last_start)<new Date(update_event.data.last_update)){
				console.log("NUOVO START")
				status="start"
			}else{
				status="continue"
			}
		}
	}
	return status
}

//===== UPLOAD MANAGING ==================================================================================
//###################
//# START-STOP SCAN #
//###################
var scan_started=false;
var time_scanned=0;
var updatebutton=document.getElementById("update-procedure-button")
var explorerbutton=document.getElementById("explorer-button")
var startbutton=document.getElementById("start-stop-innertext")
async function start_button(){
	try{
		if(!scan_started){
			console.log("Starting scan...")
			var res= await awManager.startWatchers()
			console.log(res)
			await awManager.update_start_flag()
			updatebutton.className="default-button-deactivated"
			startbutton.innerHTML=`Stop Scan&nbsp <img class="white-icon" src="Assets/icons/square.svg">`
			explorerbutton.className="default-button"
			scan_started=true
			timer("ready_status")
		}else{
			console.log("stopping scan...")
			var res=await awManager.stopWatchers()
			console.log(res)
			updatebutton.className="default-button"
			startbutton.innerHTML=`Resume Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
			scan_started=false
		}
	}catch(e){
		console.log(e)
		change_update_status(2)
	}
}
async function init_update_button(){
	var start_event=await awManager.get_producer_event("last_start")
	if(Object.keys(start_event).length===0){
		console.log("Start event does not exist")
		updatebutton.className="default-button-deactivated"
		explorerbutton.className="default-button-deactivated"
		startbutton.innerHTML=`Start Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
	}else{
		console.log("Fetched Start Event: "+start_event.data.last_start)
		var update_event=await awManager.get_producer_event("last_update")
		if(Object.keys(update_event).length===0){
			console.log("start event exists but no update has ever been made")
			updatebutton.className="default-button"
			explorerbutton.className="default-button"
			startbutton.innerHTML=`Resume Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
		}else{
			console.log("Fetched Update Event: "+update_event.data.last_update)
			if(new Date(start_event.data.last_start)<new Date(update_event.data.last_update)){
				console.log("NUOVO START")
				updatebutton.className="default-button-deactivated"
				explorerbutton.className="default-button-deactivated"
				startbutton.innerHTML=`Start Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
			}else{
				console.log("RIPRENDI DA PAUSA")
				updatebutton.className="default-button"
				explorerbutton.className="default-button"
				startbutton.innerHTML=`Resume Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
			}
		}
		//await awManager.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+get_current_timestamp()+"\"} }")
	}
}






//#################
//# SHOW EXPLORER #
//#################
var content_shown=1;
var aw_content=document.getElementById("content-wrapper");
var superset_content=document.getElementById("home_screen");
//superset_content.style.display="none"
aw_content.style.display="none"
async function switch_content(){
	if(explorerbutton.className=="default-button-deactivated"){
		throw new Error("Error: button is deactivated. Start a scan to activate this function")
	}
	if(content_shown==0){
		content_shown=1;
		aw_content.style.display="none"
		superset_content.style.display="initial"
	}else{
		content_shown=0;
		aw_content.style.display="initial"
		superset_content.style.display="none"

		load_my2sec_explorer()
	}
}

async function load_my2sec_explorer(){
	//==================================================
	console.log(" ")
	console.log("### FETCHING AW EVENTS ###")
	await awManager.explorerQuery();
	console.log(" ")
	console.log("### UPDATING HTML ELEMENTS ###")
	//UPDATE PANEL
	//awManager.logspan_setTotalWatchers("wc_counter")
	//awManager.logspan_setTotalEvents("ev_counter")
	//CREATE NAVPOINTS
	pointsFather.innerHTML=""
	for(var key in awManager.watchersJson){
		const pointdiv=document.createElement("div");
		pointdiv.className="nav-point";
		pointsFather.appendChild(pointdiv);
	}

	awManager.update_watcher_view(0)
	//[3.1] PRINT EVENTS INFO
	events_title.innerHTML=`SHOWING WATCHER EVENTS:<br>
		FROM  
		<span style='color:black'>
			<b>${new Date(awManager.start_time_json.data.last_start)}</b>
		</span>
		<br>TO 
		<span style='color:black'>
			<b>${new Date(get_current_timestamp())}</b>
		</span>`;
}








//###################################
//# INITIALIZE VALIDATION PROCEDURE #
//###################################
var vpanel=document.getElementById("validation_wrapper");
var opanel=document.getElementById("validation_obscurer");
//open validation panel
async function start_update_procedure(){
	if(updatebutton.className=="default-button-deactivated"){
		throw new Error("Error: button is deactivated. Start and then stop a scan to activate this function")
	}
	vpanel.style.display="block"
	opanel.style.display="block"
	awManager.initialize_validation_procedure()
}
async function abort_update_procedure(){
	vpanel.style.display="none"
	opanel.style.display="none"
}

//update ia knowledge
async function confirm_and_upload(){
	if(!confirm("Are you sure?")){
		throw new Error("UPLOAD ABORTED!")
	}

	console.log("### STARTING AI UPLOAD ###")

	var arr=awManager.tm.logicalArray//Json styled csv
	console.log("proceeding to send: ")
	console.table(arr)
	if(!(Object.keys(arr).length===0)){
		console.log(arr)
		var newKnowledgeCell={}
		for(var k in arr){
			var field=[]
			for(var i in arr[k]){
				field.push(arr[k][i])
			}
			newKnowledgeCell[k]=field;
		}
		newKnowledgeCell=JSON.stringify(newKnowledgeCell)
		console.log(newKnowledgeCell)
		await awManager.setWorkEvents(newKnowledgeCell)

		var success=await awManager.getCsvNone()
		console.log(success)
		if(success=="True"){
			throw new Error("None events are present in Csv")
		}
	}else{
		console.log("NOTHING TO SHOW, PROCEEDING WITH SENDING EVENTS")
	}

	var success=await awManager.sendCurrentCsv()
	console.log(success)
	
	//ON SUCCESS...
	await awManager.uploadQuery()
	await send_messages_to_sepa()

}
function on_selection_change(i){
	awManager.tm.on_selection_change(i)	
}

//update verfied data to sepa
async function send_messages_to_sepa(){
	consoleLog(1,"### BUTTON PRESSED, STARTING SEPA UPLOAD ###")
	change_update_status(3)//activate loading spinner

	console.log(" ")

	//UPDATE MESSAGE	
	var update_success_flag=1;
	var response;
	var data={};
	for (var key in awManager.watchersJson) {		
		try{
			var msgtimestamp=get_current_timestamp();
			//response=await update_user_timed_sepa_message(EVENTS_RAWJSON[key],WATCHERS_JSON[key].client,curruser,msgtimestamp); 
			
			//BUGFIX
			if(!awManager.watchersJson[key].id.includes(awManager.watchersJson[key].client)){
				//l'id e il client name sono diversi, seleziona l'id
				log.warning("id and clientname of watcher do not match, using sliced id as clientname...")
				var index=awManager.watchersJson[key].id.lastIndexOf("_")
				awManager.watchersJson[key].client=awManager.watchersJson[key].id.slice(0,index)
				log.warning(awManager.watchersJson[key].client)
			}
			
			data={
				message_graph: "http://www.vaimee.it/my2sec/messages/activitywatch",
				usergraph: "http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail,
				source: "http://www.vaimee.it/sources/"+awManager.watchersJson[key].client,
				msgtimestamp: msgtimestamp,
				msgvalue: awManager.eventsRawJson[key]
			}
			consoleLog(0,"Usergraph: "+data.usergraph)
			consoleLog(0,"Source: "+data.source)
			consoleLog(0,"Timestamp: "+data.msgtimestamp)
			consoleLog(0,"Message: "+data.msgvalue)
			response=await awManager.sepaClient.SEND_MESSAGE(data)
			consoleLog(0,"RESPONSE: "+JSON.stringify(response))
			data={}//wipe data
		}catch(e){
			console.log(e);
			update_success_flag=0;
		}
	} 

	if(update_success_flag==1){

		if(silent_update==0){
			//WHEN ALL UPDATES ARE DONE, CREATE UPDATE EVENT
			//UNCOMMENT TO RESUME UPDATE
			console.log("UPDATING TIMESTAMP")
			await awManager.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+get_current_timestamp()+"\"} }")
			//alert("UPDATED!");
			init_update_button()
			console.log("SUCCESS!")
			change_update_status(1)
			//var loadingbar=document.getElementById("loading_bar");
			//loadingbar.style.animation="load 1s linear"
		}else{
			console.log("SILENT UPDATE, PRODUCER TIMESTAMP DID NOT CHANGE")
			change_update_status(1)
		}
		
	
	}else{
		//alert("UPDATE FAILED!")
		change_update_status(2)
	}

}












//=====================
// UTILITIES FUNCTIONS
//=====================
//------------------------------------------------------------------------------------------------------------------------------------
function change_watcher(dir){
	awManager.change_watcher(dir);
}





//NAME: get_current_timestamp()
function get_current_timestamp(){
	const date=new Date();
	var string_timestamp=date.toISOString()
	//console.log(stringa)
	return string_timestamp
}







function fake_send(){
	alert("this button is outdated, please use the update button in the home screen")
}


function change_update_status(type){
	//$("ready_status").style.display="none";
	//HIDE ALL
	//document.getElementById("ready_status").style.display="none";
	document.getElementById("success_status").style.display="none";
	document.getElementById("error_status").style.display="none";
	document.getElementById("update_spinner").style.display="none";
	//0 ready, 1 success, 2 error, 3 spinner
	switch (type) {
		case 0:
			console.log("case outdated")
			//document.getElementById("ready_status").style.display="block";
			break;
		case 1:
			document.getElementById("success_status").style.display="block";
			break;
		case 2:
			document.getElementById("error_status").style.display="block";
			break;
		case 3:
			document.getElementById("update_spinner").style.display="block";
			break;
		default:
			break;
	}
}




async function timer(span){
	while(scan_started){
		await wait("1000")
		time_scanned++
		document.getElementById(span).innerHTML=calculate_time(time_scanned)
	}
}


function calculate_time(s){
	if(s<60){
		return s+"s"
	}
	if(s>=60 && s<3600){
		var m=Math.floor(s/60)
		s=s-(m*60)
		return m+"m:"+s+"s"
	}
	if(s>=3600){
		var h=Math.floor(s/3600)
		var left_s=s-(h*3600);
		if(left_s<60){
			return h+"h"
		}else{
			var m=Math.floor(left_s/60)
			return h+"h:"+m+"m"
		}
	}
}


function wait(ms){
	return new Promise(resolve=>{
		setTimeout(() => { resolve("waited") }, ms)
	})
}

