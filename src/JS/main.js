/*---------------------------------------------------------\
|| main.js: MAIN SCRIPT OF ACTIVITY WATCH PRODUCER
|| 	DATE: 28/06/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: initializes the application and defines 
||		some major functions
\\---------------------------------------------------------*/
//GLOBAL VARIABLES
//SYNC WITH INIT AND SEND BUTTON
var WATCHERS=[]; //IDs OF EVERY WATCHER
var WATCHERS_JSON=[];
var EVENTS_RAWJSON=[]; //EVENTS OF EVERY WATCHER BUT UNTOUCHED STRING
var EVENTS_JSON=[];
var events_table;
//TIMESTAMP FOR SYNCHRONIZATION, MUST REMAIN UNTOUCHED
var start_time="";
var end_time="";
//CLIENTS
//let awclient= new AwClient();

//SILENT UPDATE
var silent_update=0;
var OVERWRITE_START_TIME="2022-11-10T00:00:00.00Z";
var OVERWRITE_END_TIME="2022-12-1T23:00:00.00Z";

//GLOBAL
let awManager;
let userInfoConsumer;

//MAIN
console.log("//------------------------\\\\")
console.log("|| ActivityWatch PRODUCER ||")
console.log("\\\\------------------------//")
//INITIAL CONFIGURATION
init();

async function init(){
	log.info("Initializing App")
	console.log(" ")
	console.log("### GETTING USER CREDENTIALS ###")
	const user_credentials_json = await window.versions.request_user_credentials()
	//update_localstorage("user",JSON.parse(user_credentials_json).email);
	log.info("Fetched user information correctly")
	userInfoConsumer= new UserInfoConsumer(JSON.parse(user_credentials_json).email)
	await userInfoConsumer.sepa_getUserName();
	log.info("User Email: "+userInfoConsumer.usermail) // prints out 'pong'
	log.info("User Name: "+userInfoConsumer.userName)

	console.log(" ")
	console.log("### INITIALIZING THINGS ###")
	awManager = new AwManager();
	await awManager.start()
	//IF SEPA IS CONNECTED: UPDATE WELCOME DASHBOARD
	userInfoConsumer.logspan_username("user_name_welcome")
	userInfoConsumer.logspan_usermail("user_name");
	userInfoConsumer.logspan_subEventsCount("sub_counter")

	console.log(" ")
	console.log("### LOADING SUPERSET DASHBOARD ###")
	var dash_id=await userInfoConsumer.sepa_getUserDashboard();//"755f0434-6ac6-4d4f-8415-3b2b80c571e9";
	log.info("Fetched dashboard_id of "+userInfoConsumer.userName+" :"+dash_id)
	var superset_host="http://dld.arces.unibo.it:8087";
	var container_id="my-superset-container";
	var embed = createDashboard(dash_id,superset_host,container_id)

	console.log(" ")
	console.log("### LOADING TASKS ###")
	let tasksConsumer = new TasksConsumer();
	tasksConsumer.generate_tasks_template("task-wrapper")

	console.log(" ")
	console.log("### FETCHING AW EVENTS ###")
	await awManager.loadEvents();



	//==================================================
	console.log(" ")
	console.log("### UPDATING HTML ELEMENTS ###")
	//UPDATE PANEL
	awManager.logspan_setTotalWatchers("wc_counter")
	awManager.logspan_setTotalEvents("ev_counter")
	//CREATE NAVPOINTS
	for(var key in awManager.watchersJson){
		const pointdiv=document.createElement("div");
		pointdiv.className="nav-point";
		pointsFather.appendChild(pointdiv);
	}

	awManager.update_watcher_view(0)

	//[3.1] PRINT EVENTS INFO
	events_title.innerHTML="SHOWING WATCHER EVENTS FROM <span style='color:black'><b>"+start_time.replace(/T/g," // ")+"</b></span> TO   <span style='color:black'><b>"+end_time.replace(/T/g," // ")+"</b></span>";



	//TEST OPEN PROJECT IFRAME
	/*
	var req= new XMLHttpRequest();
	var reqtext="http://localhost:889/projects/demo-project/work_packages/4/activity"
	req.open("GET",reqtext);	
	req.onload = function(){
		//jsonResponse = JSON.parse(req.responseText);
		//consoleLog(0,"api_GetJson: fetched data correctly from AW API")
		//consoleLog(0,JSON.stringify(jsonResponse))
		//consoleLog(0,"API response: "+req.responseText)
		//resolve(jsonResponse) //return json asynchronously   
		console.log(req.responseText);
		var cunt=document.getElementById("mao")
		cunt.innerHTML=req.responseText
	}
	req.send();
	*/


}


//===================================
// SEND DATA TO SEPA ON BUTTON PRESS
//===================================
var send_button_pressed=false;
async function button_press(){
	if(!send_button_pressed){
		consoleLog(1,"### BUTTON PRESSED, STARTING SEPA UPLOAD ###")
		change_update_status(3)//activate loading spinner
		send_button_pressed=true;//set button pressed flag
		console.log(" ")

		//UPDATE MESSAGE	
		var update_success_flag=1;
		var response;
		var data={};
		for (var key in awManager.watchersJson) {		
			try{
				var msgtimestamp=get_current_timestamp();
				//response=await update_user_timed_sepa_message(EVENTS_RAWJSON[key],WATCHERS_JSON[key].client,curruser,msgtimestamp); 
				var testmsg=""
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
				awManager.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+end_time+"\"} }")
				//alert("UPDATED!");
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
	}else{
		alert("ERROR: ALREADY UPLOADED")
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



var content_shown=1;
var aw_content=document.getElementById("content-wrapper");
var superset_content=document.getElementById("home_screen");

//superset_content.style.display="none"
aw_content.style.display="none"
function switch_content(){
	if(content_shown==0){
		content_shown=1;
		aw_content.style.display="none"
		superset_content.style.display="initial"
	}else{
		content_shown=0;
		aw_content.style.display="initial"
		superset_content.style.display="none"
	}
}



function fake_send(){
	alert("this button is outdated, please use the update button in the home screen")
}


function change_update_status(type){
	//$("ready_status").style.display="none";
	//HIDE ALL
	document.getElementById("ready_status").style.display="none";
	document.getElementById("success_status").style.display="none";
	document.getElementById("error_status").style.display="none";
	document.getElementById("update_spinner").style.display="none";
	//0 ready, 1 success, 2 error, 3 spinner
	switch (type) {
		case 0:
			document.getElementById("ready_status").style.display="block";
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





