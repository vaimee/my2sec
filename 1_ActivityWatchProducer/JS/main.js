/*---------------------------------------------------------\
|| main.js: MAIN SCRIPT OF ACTIVITY WATCH PRODUCER
|| 	DATE: 28/06/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: initializes the application and defines 
||		some major functions
\\---------------------------------------------------------*/
var log=new Greglogs();
var cache=[]
//CLIENTS
let awManager;
let scanManager;
let userInfoConsumer;
let awApiUpdateManager;
//GLOBAL
//var _SCAN_STARTED=false;
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
	log.info("Initializing Application") 
	var json_package=await window.versions.request_user_credentials();
	json_package=JSON.parse(json_package)//contains jsap and user credentials
	console.log(json_package)


	log.info("----------< Init ACTIVITYWATCH Client, test datasources >----------")
	//IF THIS SECTION FAILS, THE APP EXECUTION MUST STOP
	awManager = new AwManager(json_package["my2sec_jsap"]);
	log.info("** TEST DATASOURCES **")
	var test_results=await awManager.startTests();
	console.table(test_results)
	Object.keys(test_results).forEach(k=>{
		if(test_results[k]=="not-passed"){
			throw new Error("Datasource error: ")
		}
	})
	log.info("** TEST PASSED, DATASOURCES ONLINE! **")
	

	//TRY TO STOP WATCHERS AT STARTUP TO AVOID BUGS
	console.log("PROVO A SPEGNERE I WATCHERS")
	awManager.stopWatchers()

	console.log(" ")

	//THIS SECTION MUST ALSO NOT FAIL, SO I WILL NOT CATCH ANY ERROR
	log.info("----------< Init UserInfoManager >----------")
	log.debug("getting keycloak user credentials from node...")
	//const user_credentials_string = await window.versions.request_user_credentials()
	//const user_credentials_json=JSON.parse(user_credentials_string)
	const user_credentials_json=json_package["user_login_json"];
	log.info_table(user_credentials_json)
	log.info("Fetched user information correctly")
	userInfoConsumer= new UserInfoConsumer(json_package["my2sec_jsap"],user_credentials_json.email)
	await userInfoConsumer.sepa_getUserName();
	log.debug("User info consumer initialized with data: Email("+userInfoConsumer.usermail+"), username("+userInfoConsumer.userName+")") // prints out 'pong'
	userInfoConsumer.logspan_username("user_name_welcome")
	userInfoConsumer.logspan_usermail("user_name");
	//userInfoConsumer.logspan_subEventsCount("sub_counter")
	console.log(" ")

	log.info("----------< Init SUPERSET dashboard >----------")
	try{
		var dash_id=await userInfoConsumer.sepa_getUserDashboard();//"755f0434-6ac6-4d4f-8415-3b2b80c571e9";
		log.info("Fetched dashboard_id of "+userInfoConsumer.userName+" :"+dash_id)
		var superset_host="http://dld.arces.unibo.it:8087";
		var container_id="my-superset-container";
		var embed = createDashboard(dash_id,superset_host,container_id)
	}catch(e){
		console.log(e)
	}
	console.log(" ")

	
	log.info("----------< Init TASKS dashboard >----------")
	let tasksConsumer;
	try{
		tasksConsumer = new TasksConsumer(json_package["my2sec_jsap"],userInfoConsumer.usermail);
		log.info("** start task consumer **")
		tasksConsumer.start()
		//tasksConsumer.generate_tasks_template("task-wrapper")		
		//log.info("tasks consumed")
	}catch(e){
		console.log(e)
	}
	console.log(" ")
	
	//INIT THE CLASS OF THE UPDATE BUTTON
	log.info("----------< Init CONTROL PANEL >----------")
	//await initControlPanel();

	scanManager=new ScanManager(json_package["my2sec_jsap"]);
	scanManager.logStatus();

	init_update_button()

	//INIT VALIDATION PROCEDURE
	//awApiUpdateManager=new AwApiUpdateManager(default_jsap,awManager,userInfoConsumer,tasksConsumer)
	//awApiUpdateManager.start();

	awApiUpdateManager=new AwApiUpdateManager(json_package["my2sec_jsap"],awManager,userInfoConsumer,tasksConsumer)

	//test()

}





/*
async function test(){
	console.log("TESTING")
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
*/

//===== UPLOAD MANAGING ==================================================================================
//###################
//# START-STOP SCAN #
//###################
//update ia knowledge
var currentSection=0;
var scan_started=false;
var time_scanned=0;
var updatebutton=document.getElementById("update-procedure-button")
var explorerbutton=document.getElementById("explorer-button")
var startbutton=document.getElementById("start-stop-innertext")
async function start_button(){
	try{
		if(!scan_started){
			currentSection=0;
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
			currentSection=0;
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
	console.log("INIT UPDATE BUTTON")
	var start_event=await awManager.get_producer_event("last_start")
	if(Object.keys(start_event).length===0){ //SE NON ESISTE UNO START EVENT NON ESISTE NEANCHE UNO STOP EVENT -> inizia scansione
		console.log("Start event does not exist")
		updatebutton.className="default-button-deactivated"
		explorerbutton.className="default-button-deactivated"
		startbutton.innerHTML=`Start Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
		//_SCAN_STARTED=false;
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
//when user presses update button in the homepage
async function start_update_procedure(){
	//INIT VALIDATION PROCEDURE
	awApiUpdateManager.start();
	awApiUpdateManager.on_update_button_pressed();
}
//when user closes validation window prematurely
async function abort_update_procedure(){
	awApiUpdateManager.abort_update_procedure();
	awApiUpdateManager.stop();
}
//when user presses the validation button in any of the three sections
async function on_validation_button_pressed(){
	awApiUpdateManager.on_validation_button_pressed()
}
//change selection
function on_selection_change(i){
	awApiUpdateManager.awManager.tm.on_selection_change(i)	
}
function on_activity_selection_change(i){
	awApiUpdateManager.awManager.atm.on_activity_selection_change(i)	
}
function select_all(){
	awApiUpdateManager.awManager.tm.select_all_visible_rows()
}
function set_all_rows_to_value(value){
	awApiUpdateManager.awManager.tm.set_all_rows_to_value(value)
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

