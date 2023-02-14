/*---------------------------------------------------------\
|| main.js: MAIN SCRIPT OF ACTIVITY WATCH PRODUCER
|| 	DATE: 28/06/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: initializes the application and defines 
||		some major functions
\\---------------------------------------------------------*/
var cache=[]
//CLIENTS
let awManager;
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

	//TRY TO STOP WATCHERS AT STARTUP TO AVOID BUGS
	console.log("PROVO A SPEGNERE I WATCHERS")
	awManager.stopWatchers()



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

	
	log.info("### LOADING TASKS ###")
	let tasksConsumer;
	try{
		tasksConsumer = new TasksConsumer(userInfoConsumer.usermail);
		tasksConsumer.start()
		//tasksConsumer.generate_tasks_template("task-wrapper")		
	}catch(e){
		console.log(e)
	}
	
	//INIT THE CLASS OF THE UPDATE BUTTON
	init_update_button()

	//INIT VALIDATION PROCEDURE
	//awApiUpdateManager=new AwApiUpdateManager(default_jsap,awManager,userInfoConsumer,tasksConsumer)
	//awApiUpdateManager.start();

	awApiUpdateManager=new AwApiUpdateManager(default_jsap,awManager,userInfoConsumer,tasksConsumer)

	//test()

	/*
	let flagsub=awManager.sepaClient.GET_USER_SYNCHRONIZATION_FLAG({
		flag_type:"http://www.vaimee.it/my2sec/trainingactivitiesflag",
		usergraph:"http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail
	})
	var firstTime=true
	flagsub.on("notification",not=>{console.log(not)})
	*/

	//DA QUI INIZIAVA
	/*
	let trainingactivitiessub=awManager.sepaClient.USER_TRAINING_ACTIVITIES({
		usergraph:"http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail
	}) 
	let flagsub=awManager.sepaClient.GET_SYNCHRONIZATION_FLAG({
		flag_type:"http://www.vaimee.it/my2sec/trainingactivitiesflag"
		//usergraph:"http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail
	})
	
	var firstActivity=true;
	trainingactivitiessub.on("notification",not=>{
		if(firstActivity){
			firstActivity=false;
		}else{
			console.log("ACTIVITIES RECEIVED!")
			console.log(not)
			if(not.removedResults.results.bindings.length==0){ //on added results
				//trainingactivitiessub.unsubscribe();
				var bindings=not.addedResults.results.bindings
				for(var i in bindings){
					for(var k in bindings[i]){
						bindings[i][k]=bindings[i][k].value
					}
					cache.push(bindings[i])
				}
			}else{
				console.log("ignored removed activities")
			}
		}
	})
	var firstTime=true
	flagsub.on("notification",not=>{
		console.log("FLAG NOTIFICATION: "+JSON.stringify(not))
		if(firstTime){
			console.log("first flag")
			firstTime=false;
		}else{
		
		try{
			console.log("FLAG RECEIVED!")
			console.log(not)
			if(not.removedResults.results.bindings.length==0){
				if(not.addedResults.results.bindings[0].usergraph.value=="http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail){
					var syncresponse=awManager.sepaClient.RESET_SYNCHRONIZATION_FLAG({
						flag:not.addedResults.results.bindings[0].flag.value
					})
					//flagsub.unsubscribe()
					console.log("calling on_received_training_activities, cache: "+JSON.stringify(cache))
					on_received_training_activities(cache)
					cache=[];
					//console.log(e)
				}else{
					console.log("ignored flag")
				}
			}else{
				console.log("ignored removed flag")
			}
		}catch(e){console.log(e)}
		}
		//}//END OF IF
	})
	*/

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

/*
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
*/
/*
async function on_validation_button_pressed(){
	if(currentSection==0){
		confirm_and_upload()
	}else{
		send_validated_activities()
	}
	currentSection++
}
*/
/*
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
*/
//update verfied data to sepa
/*
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
		change_update_status(1)
		if(silent_update==0){
			begin_activities_validation();
			//WHEN ALL UPDATES ARE DONE, CREATE UPDATE EVENT
			//UNCOMMENT TO RESUME UPDATE
			var syncresponse=await awManager.sepaClient.SET_SYNCHRONIZATION_FLAG({
				flag_type:"http://www.vaimee.it/my2sec/awproducerflag",
				usergraph:"http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail
			  })
			console.log("Sync flag response: "+JSON.stringify(syncresponse))
			console.log("UPDATING TIMESTAMP")
			await awManager.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+get_current_timestamp()+"\"} }")
			//alert("UPDATED!");
			init_update_button()
			console.log("SUCCESS!")
			

			

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
*/
var dt=[{
	"usergraph": {
		"type": "uri",
		"value": "http://www.vaimee.it/defuser"
	},
	"event_type": {
		"type": "uri",
		"value": "my2sec:windowEvent"
	},
	"datetimestamp": {
		"type": "literal",
		"value": "2022-08-10T15:33:42.503000+00:00"
	},
	"app": {
		"type": "literal",
		"value": "chrome.exe"
	},
	"title": {
		"type": "literal",
		"value": "youtube"
	},
	"activity_type": {
		"type": "uri",
		"value": "my2sec:Developing"
	},
	"task": {
		"type": "literal",
		"value": "WP2-IMPLEMENTAZIONE COMPONENTI"
	},
	"duration": {
		"type": "literal",
		"value": "16.0"
	}	
},
{
	"usergraph": {
		"type": "uri",
		"value": "http://www.vaimee.it/defuser"
	},
	"event_type": {
		"type": "uri",
		"value": "my2sec:windowEvent"
	},
	"datetimestamp": {
		"type": "literal",
		"value": "2022-08-10T15:33:42.503000+00:00"
	},
	"app": {
		"type": "literal",
		"value": "chrome.exe"
	},
	"title": {
		"type": "literal",
		"value": "youtube"
	},
	"activity_type": {
		"type": "uri",
		"value": "my2sec:Developing"
	},
	"task": {
		"type": "literal",
		"value": "WP2-IMPLEMENTAZIONE COMPONENTI"
	},
	"duration": {
		"type": "literal",
		"value": "16.0"
	}	
}
]

//on_received_training_activities(dt)
//ACTIVITIES VALIDATION
/*
function begin_activities_validation(){
	document.getElementById("vs1").className="validation_section";
	document.getElementById("vs2").className="validation_section-selected";
	document.getElementById("validation_body").innerHTML="";
	console.log("BEGINNING ACTIVITIES PROCEDURE")
	change_update_status(0);
}

function on_received_training_activities(bindings){
	console.log("Setting original bindings:")
	console.log(bindings)
	awManager.atm.originalBindings=bindings;
	var known_categories="Developing,Meeting,Researching,Testing,Other,Email"
	console.log("Injecting table")
	awManager.atm.injectTable(bindings,"activity_type,app,title,duration,datetimestamp",known_categories)
	if(!awManager._jsonEmpty(bindings)){
		$(document).ready( function () {
			var events_table=$("#wst").DataTable();
		} );
	}else{
		console.log("ERROR: JSON CAN'T BE EMPTY")
		change_update_status(2)
	}
	//on_validated_activities()
}

async function send_validated_activities(){
	change_update_status(3);
	var arr=awManager.atm.logicalArray//Json styled csv
	console.log(arr)
	//throw new Error("MAO")
	var ok=0;
	try{
		for(var i in arr){
			arr[i]["usergraph"]="http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail

			var title=arr[i]["title"].replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
			title=title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
			arr[i]["title"]=title;
			console.log(arr[i])

			var syncresponse=await awManager.sepaClient.ADD_VALIDATED_ACTIVITY(arr[i])
			console.log("Add validated activity response: "+JSON.stringify(syncresponse))	
		}
		
		try{

		
		var toRemove=awManager.atm.originalBindings;
		console.log("REMOVING: ")
		console.log(toRemove)
		for(var i in toRemove){
			var syncresponse=await awManager.sepaClient.REMOVE_TRAINING_ACTIVITY({
				activity: toRemove[i].nodeid
			})
			console.log("Remove training activity response: "+JSON.stringify(syncresponse))	
		}

		}catch(e){
			console.log(e)
		}
		
		var syncresponse=await awManager.sepaClient.SET_SYNCHRONIZATION_FLAG({
			flag_type:"http://www.vaimee.it/my2sec/validatedactivitiesflag",
			usergraph:"http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail
		  })
		console.log("Sync flag response: "+JSON.stringify(syncresponse))	
		ok=1;
	}catch(e){
		console.log(e)
		ok=0;
	}
	if(ok==1){
		change_update_status(1)
		document.getElementById("success_status").innerHTML="Success! You can view your tasks on OpenProject"
	}else{
		change_update_status(2)
	}

}
*/



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

/*
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
			console.log("status box removed")
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
}*/

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
