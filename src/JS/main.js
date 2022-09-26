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
var send_button_pressed=0;
//TIMESTAMP FOR SYNCHRONIZATION, MUST REMAIN UNTOUCHED
var start_time="";
var end_time="";
//CLIENTS
let awclient= new AwClient();

//SILENT UPDATE
var silent_update=0;
var OVERWRITE_START_TIME="2022-08-22T01:00:00.00Z";
var OVERWRITE_END_TIME="2022-09-22T20:00:00.00Z";



//MAIN
console.log("//-----------------\\\\")
console.log("|| AW PRODUCER V0.10 ||")
console.log("\\\\-----------------//")
consoleLog(1,"### BEGINNING CONFIGURATION ###")
//INITIAL CONFIGURATION
init();



//=========================
// INITIALIZE THE APP
//=========================
async function init(){

	/*-------------------------------------
		[0] PREINITIALIZATION
	-------------------------------------*/
	//PING SEPA	
	consoleLog(1,"### SEPA PREFLIGHT ###")
	document.getElementById("sepa_connectionstatus_wrapper").innerHTML="Connection failed ("+jsap.host+":"+jsap.sparql11protocol.port+")"
	try{
		//echo_res = await echo_sepa();
		echo_sepa()
		//IF SEPA IS CONNECTED: UPDATE WELCOME DASHBOARD
		span_setUserName("user_name_welcome");
		span_setUserMail("user_name");
		sub_events_count(get_localstorage("user"));
	}catch(e){console.log(e)}

	//CLEAN PREVIOUS ELEMENTS
	document.getElementById("row-2").style.display="none";	
	delete_children("nav-points-wrapper");
	change_update_status(0)
	//Get AW API hostname and port from json configuration
	//await awclient.load_default_configuration("JS/config.json");	
	awclient.load_default_configuration("JS/config.json");	
	

	/*-------------------------------------
		[1] FETCH AND PREPROCESS WATCHERS
	-------------------------------------*/
	var filter_whitelist=1;
	//TRANSFORM GLOBAL VARIABLE
	WATCHERS_JSON = await get_filtered_watchers_json(filter_whitelist);
	console.log(WATCHERS_JSON)
	//Extract watchers ID
	consoleLog(1,"### EXTRACT WATCHERS IDs ###")
	var counter=0;
	WATCHERS=[];
	for (key in WATCHERS_JSON) {
		WATCHERS[counter]=WATCHERS_JSON[key].id;		
		counter=counter+1;
	}


	/*-------------------------------------
		[2] FETCH AND PREPROCESS EVENTS
	-------------------------------------*/
	//TRANSFORM GLOBAL VARIABLE
	EVENTS_RAWJSON = await get_filtered_watchers_events(WATCHERS_JSON)
	//Print Watcher Info
	for(key in WATCHERS_JSON){
		EVENTS_JSON[key] = JSON.parse(EVENTS_RAWJSON[key]);
		EVENTS_RAWJSON[key]=EVENTS_RAWJSON[key].replace(/\\/g,"\\\\");//BUGFIX
	
		var start=132150;
		find_bastard(EVENTS_RAWJSON[key],start)
	
	}


	/*-------------------------------------
		[3] UPDATE HTML ELEMENTS
	-------------------------------------*/	
	consoleLog(1,"### UPDATING HTML ELEMENTS ###")
	//UPDATE PANEL
	span_setTotalWatchers("wc_counter")
	span_setTotalEvents("ev_counter")

	//CREATE NAVPOINTS
	for(var k=0; k<WATCHERS.length;k++){
		const pointdiv=document.createElement("div");
		pointdiv.className="nav-point"
		pointsFather.appendChild(pointdiv);
	}

	update_watcher_view(0)

	//[3.1] PRINT EVENTS INFO
	events_title.innerHTML="SHOWING WATCHER EVENTS FROM <span style='color:black'><b>"+start_time.replace(/T/g," // ")+"</b></span> TO   <span style='color:black'><b>"+end_time.replace(/T/g," // ")+"</b></span>";
	//msgg_info.innerHTML=msgg_info.innerHTML+"timeframe=> "+start_time+"||"+end_time+"<br>"

	//TEST EMBED DASHBOARD
	//Example local superset test dashboard
	var curruser=get_localstorage("user");
	var dash_id=await sepa_getUserDashboard(curruser);//"755f0434-6ac6-4d4f-8415-3b2b80c571e9";
	var superset_host="http://dld.arces.unibo.it:8087";
	var container_id="my-superset-container";
	var embed = createDashboard(dash_id,superset_host,container_id)


	consoleLog(0,"ENDOFINIT, showing alerts")


	if(dash_id==""){
		//alert("WARNING: missing superset custom dashboard.\nContact your server administrator to activate it!")
	}


}//END OF init()





//===================================
// SEND DATA TO SEPA ON BUTTON PRESS
//===================================
async function button_press(){

	if(send_button_pressed==0){

		//ACTIVATE LOADING SPINNER
		change_update_status(3)

		send_button_pressed=1;
		var curruser=get_localstorage("user");

		consoleLog(1,"### BUTTON PRESSED, STARTING SEPA UPLOAD ###")
		//GET EVENTS DATA
		consoleLog(0,JSON.stringify(EVENTS_JSON))
		consoleLog(1,"fetched internal events object, starting upload procedure")
		//var button_icon=document.getElementById("sepabutton_icon");
		//var button_spinner=document.getElementById("sepabutton_spinner");

		//UPDATE MESSAGE	
		var update_success_flag=1;
		var response;
	
		for (key in WATCHERS_JSON) {		
			try{
				var msgtimestamp=get_current_timestamp();
				response=await update_user_timed_sepa_message(EVENTS_RAWJSON[key],WATCHERS_JSON[key].client,curruser,msgtimestamp); 
			}catch(e){
				console.log(e);
				update_success_flag=0;
			}
		} 
	
		if(update_success_flag==1){

			if(silent_update==0){
				//WHEN ALL UPDATES ARE DONE, CREATE UPDATE EVENT
				awclient.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+end_time+"\"} }")
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















//================
// MAIN FUNCTIONS
//================
//-------------------------------------------------------------------------------------------------------------------------------------

//WELCOME DASHBOARD
//------------------
function span_setUserMail(id){
	document.getElementById(id).textContent=get_localstorage("user")
}
async function span_setUserName(id){
	var user_mail=get_localstorage("user")
	var userName=await sepa_getUserName(user_mail)
	console.log("USERNAME: "+userName)
	document.getElementById(id).textContent=userName.toUpperCase()
}
function span_setConnectionStatus(id){

}


//UPDATE PANEL
function span_setTotalEvents(id){
	var singleJ="";
	var total_events=0;
	for(key in EVENTS_JSON){
		singleJ=EVENTS_JSON[key];
		total_events=total_events+singleJ.length;
	}

	document.getElementById(id).textContent=total_events;
}
function span_setTotalWatchers(id){
	document.getElementById(id).textContent=WATCHERS.length
}


//SUPERSET DASHBOARD
//-------------------
function get_dashboard_id(){

	

	return "755f0434-6ac6-4d4f-8415-3b2b80c571e9"
}



//GET AND FILTER WATCHERS
//-----------------------
async function get_filtered_watchers_json(filtering_active){
	//Get active watchers
	consoleLog(1,"### GETTING WATCHERS ###")
	var watchers_json = await awclient.get_watchers();
	watchers_json = JSON.parse(watchers_json);//BUGFIX


	//CHECK IF PRODUCER EXISTS BEFORE WHITELIST
	var aw_producer_exists=0; //bugfix
	for (key in watchers_json){
		if(watchers_json[key].id=="aw-producer"){
			aw_producer_exists=1;
			consoleLog(1,"AW PRODUCER FOUND!")
			//consoleLog(1,aw_producer_exists)
		}
	}

	//FILTER WHITELIST
	var raw_whitelist=get_localstorage("whitelist");
	//alert(raw_whitelist.replace(/\s/g, ""));
	var raw_whitelist_nospaces=raw_whitelist.replace(/\s/g, "")
	//var tempwhite=raw_whitelist_nospaces.split(",")
	//var filtering_active=1;
	//var WHITELIST=["aw-watcher-window"];
	var WHITELIST=raw_whitelist_nospaces.split(",")
	var filtered_watchers_json=JSON.parse("{}");
	number_of_filtered_watchers=0;
	number_of_unfiltered_watchers=0;
	for (key in watchers_json){
		var identifier=watchers_json[key].id.split("_")
		console.log(identifier[0])
		number_of_unfiltered_watchers++
		for(index in WHITELIST){
			console.log("W:"+WHITELIST[index])
			if(WHITELIST[index]==identifier[0]){
				
				

				filtered_watchers_json[key]=watchers_json[key];
				number_of_filtered_watchers++
				break;
			}

		}

	}

	//alert(number_of_filtered_watchers)

	if(filtering_active==1){

		consoleLog(0,"FILTERED WATCHERS!")
		//OVERRIDE GLOBAL VARIABLE
		watchers_json=filtered_watchers_json;

	}else{
		
		consoleLog(2,"USING UNFILTERED WATCHERS, MAY LEAD TO INSTABILITY")

	}

	consoleLog(0,JSON.stringify(watchers_json));
	//alert("ciao")


	//[0.1] CREATE AW PRODUCER BUCKET IF IT DOES NOT EXISTS
	if(aw_producer_exists==0){
		consoleLog(0,"FIRST RUN, CREATING AW PRODUCER")
		await awclient.create_producer_bucket();
			
	}

	//RETURN WATCHERS JSON OBJECT
	return watchers_json

}

//GET EVENTS BY WATCHER
//----------------------
async function get_filtered_watchers_events(watchers_json){




	//[1.2] Get Watchers Events
	consoleLog(1,"### GETTING EVENTS ###")

	var events_json=[]; //TEMP CONTAINER
	var events_rawjson=[];

	var data_fetch_success_flag=1;
	var start_time_json = await awclient.get_events("aw-producer")
	start_time_json=JSON.parse(start_time_json);
	//IF START TIME EVENT EXISTS GET EVENTS SLICE, ELSE GET ALL EVENTS
	if(start_time_json.length>0){

		//GET FETTA DI EVENTI BABY
		if(silent_update==0){
			start_time=start_time_json[0].data.last_update;
			end_time = get_current_timestamp();
		}else{
			console.log("Fetching silent time")
			start_time=OVERWRITE_START_TIME;//"2022-08-22T01:00:00.00Z";
			end_time =OVERWRITE_END_TIME;//get_current_timestamp();
		}
		consoleLog(1,"fetching events from "+start_time+" to "+end_time)
		for (key in watchers_json) {
			try{
				events_rawjson[key]=await awclient.query_events(watchers_json[key].id,end_time,start_time);
				//find_bastard(events_rawjson[key],132150+42645)
				events_json[key] = JSON.parse(events_rawjson[key]);
			}catch(e){console.log(e);data_fetch_success_flag=0;}
		}

	}else{

		//GET ALL EVENTS
		consoleLog(1,"first run, fetching all events")
		end_time = get_current_timestamp();//FIX BUG ON FIRST START
		for(key in watchers_json){
			try{
				events_rawjson[key]=await awclient.get_events(watchers_json[key].id);
				events_json[key] = JSON.parse(events_rawjson[key]);
			}catch(e){console.log(e);data_fetch_success_flag=0;}

		}

	}

	
	
	//PREPROCESS EVENTS. ADDED FOR STABILITY
	//var events_filter_app=["private"];
	//consoleLog(0,events_json)
	events_json=filter_events_by_app(events_json);
	//bugfix
	for(key in watchers_json){

		events_rawjson[key]=JSON.stringify(events_json[key]);
		//events_rawjson[key]=events_rawjson[key].replace(/\\/g,"\\");//BUGFIX
		//console.log(events_rawjson[key])
		var start=132150;
		find_bastard(events_rawjson[key],start)



	}

	

	return events_rawjson

}


function find_bastard(raw_json_string,start){
	console.log("Examining string with "+raw_json_string.length+" chars")
	var section="";
	
	for(var i=0; i<100; i++){
		section=section+raw_json_string[start+i];
	}
	console.log(section)
}


//=====================
// UTILITIES FUNCTIONS
//=====================
//------------------------------------------------------------------------------------------------------------------------------------
//NAME: get_current_timestamp()
function get_current_timestamp(){
	const date=new Date();
	var string_timestamp=date.toISOString()
	//console.log(stringa)
	return string_timestamp
}



function filter_events_by_app(eventsobj){

	consoleLog(1,"### FILTERING EVENTS ###")
	//console.log("ciao icaro!")
	//extract single watcher events

	for (key in eventsobj){
		console.log(eventsobj[key].length)
		eventsobj[key]=eventsobj[key].filter(filter_event_by_app);
		console.log(eventsobj[key].length)
	}

	return eventsobj
}

function filter_event_by_app(e){
	return e.data.app!="private"
}


var content_shown=1;
var aw_content=document.getElementById("content-wrapper");
var superset_content=document.getElementById("superset-wrapper");

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





