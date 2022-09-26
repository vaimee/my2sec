/*---------------------------------------------------------\
|| main.js: OLD MAIN SCRIPT OF ACTIVITY WATCH PRODUCER
|| 	DATE: 28/06/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: initializes the application and defines 
||		some major functions
\\---------------------------------------------------------*/
//GLOBAL VARIABLES
//--CONFIGURATION
var jsonConfig; //contains the localhost configuration
//TEMPORARY EVENTS CONTAINER, MAY CHANGE IN THE FUTURE
var watchers_json;
var WATCHERS=[]; //IDs OF EVERY WATCHER
var WATCHERS_CLIENTS=[];
var WATCHERS_HOST=[];
var events_json=[]; //EVENTS OF EVERY WATCHER
var events_rawjson=[]; //EVENTS OF EVERY WATCHER BUT UNTOUCHED STRING
var events_table;

var send_button_pressed=0;

//TIMESTAMP FOR SYNCHRONIZATION, MUST REMAIN UNTOUCHED
var start_time="";
var end_time="";
//CLIENTS
let awclient= new AwClient();


//MAIN
console.log("//----------------\\\\")
console.log("|| AW PRODUCER V0.9 ||")
console.log("\\\\----------------//")
consoleLog(1,"### BEGINNING CONFIGURATION ###")
//INITIAL CONFIGURATION
init();



//-----------------------
// [0] INITIALIZE THE APP
async function init(){

	/*-------------------------------------
		[0] PREINITIALIZATION
	-------------------------------------*/
	//GESTIONE UTENTE
	document.getElementById("user_name").textContent=get_localstorage("user")
	document.getElementById("row-2").style.display="none";	
	delete_children("nav-points-wrapper");
	//FOUND BUG
	document.getElementById("sepa_connectionstatus_wrapper").innerHTML="Connection failed ("+jsap.host+":"+jsap.sparql11protocol.port+")"
	
	//Get AW API hostname and port from json configuration
	//await awclient.load_default_configuration("JS/config.json");	
	awclient.load_default_configuration("JS/config.json");	
	


	/*-------------------------------------
		[1] FETCH AND PREPROCESS WATCHERS
	-------------------------------------*/
	//Get active watchers
	consoleLog(1,"### GETTING WATCHERS ###")
	watchers_json = await awclient.get_watchers();
	watchers_json = JSON.parse(watchers_json);//BUGFIX

	//FILTER WHITELIST
	var raw_whitelist=get_localstorage("whitelist");
	//alert(raw_whitelist.replace(/\s/g, ""));
	var raw_whitelist_nospaces=raw_whitelist.replace(/\s/g, "")
	//var tempwhite=raw_whitelist_nospaces.split(",")
	var filtering_active=1;
	//var WHITELIST=["aw-watcher-window"];
	var WHITELIST=raw_whitelist_nospaces.split(",")
	filtered_watchers_json=JSON.parse("{}");
	var number_of_unfiltered_watchers=0;
	var number_of_filtered_watchers=0;
	for (key in watchers_json){
		number_of_unfiltered_watchers++
		for(index in WHITELIST){
			
			if(WHITELIST[index]==watchers_json[key].client){
				
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

	//[1.1] Extract watchers ID
	consoleLog(1,"### EXTRACT WATCHERS IDs ###")
	var aw_producer_exists=0; //bugfix
	var counter=0;
	WATCHERS=[];
	for (key in watchers_json) {

		if(watchers_json[key].id=="aw-producer"){
			aw_producer_exists==1;
			consoleLog(1,"AW PRODUCER FOUND!")
		}

		WATCHERS[counter]=watchers_json[key].id;
		
		counter=counter+1;
	}



	/*-------------------------------------
		[2] FETCH AND PREPROCESS EVENTS
	-------------------------------------*/

	//[0.1] CREATE AW PRODUCER BUCKET
	if(aw_producer_exists==0){
		consoleLog(0,"FIRST RUN, CREATING AW PRODUCER")
		await awclient.create_producer_bucket();
			
	}

	//alert("ciao")	
	//[1.2] Get Watchers Events
	consoleLog(1,"### GETTING EVENTS ###")
	var data_fetch_success_flag=1;
	var start_time_json = await awclient.get_events("aw-producer")
	start_time_json=JSON.parse(start_time_json);
	//IF START TIME EVENT EXISTS GET EVENTS SLICE, ELSE GET ALL EVENTS
	if(start_time_json.length>0){

		//GET FETTA DI EVENTI BABY
		start_time=start_time_json[0].data.last_update;
		end_time = get_current_timestamp();
		consoleLog(1,"fetching events from "+start_time+" to "+end_time)
		for (key in watchers_json) {
			try{
				events_rawjson[key]=await awclient.query_events(watchers_json[key].id,end_time,start_time);
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

	
	//[2] PRINT ALL INFO FOR THE FIRST TIME
	consoleLog(1,"### UPDATING HTML ELEMENTS ###")

	//CREATE NAVPOINTS
	for(var k=0; k<WATCHERS.length;k++){
		const pointdiv=document.createElement("div");
		pointdiv.className="nav-point"
		pointsFather.appendChild(pointdiv);
	}

	//Print Watcher Info
	update_watcher_view(0)


	//UPDATE OPERATION STATUS: DATA FETCHED CORRECTLY
	//if(data_fetch_success_flag==1){
		//op_status.innerHTML="DATA READY TO SEND"
	//}else{
		//op_status.innerHTML="ERROR FETCHING DATA"
	//}


	//CREATE SEPA CLIENT HERE? I DON'T KNOW
	//[3.1] PRINT EVENTS INFO
	events_title.innerHTML="SHOWING WATCHER EVENTS FROM <span style='color:black'><b>"+start_time.replace(/T/g," // ")+"</b></span> TO   <span style='color:black'><b>"+end_time.replace(/T/g," // ")+"</b></span>";
	//msgg_info.innerHTML=msgg_info.innerHTML+"timeframe=> "+start_time+"||"+end_time+"<br>"


	consoleLog(1,"### SEPA PREFLIGHT ###")

	//PING SEPA
	var echo_res;
	echo_res = await echo_sepa();

	//SUB 2 EVENTS
	var curruser=get_localstorage("user");
	sub_events_count(curruser);

	consoleLog(0,"ENDOFINIT")

}//END OF init()






//---------------------------------
//SEND DATA TO SEPA ON BUTTON PRESS
async function button_press(){

	if(send_button_pressed==0){
		send_button_pressed=1;

		var curruser=get_localstorage("user");

		consoleLog(1,"### BUTTON PRESSED, STARTING SEPA UPLOAD ###")
		//GET EVENTS DATA
		consoleLog(0,JSON.stringify(events_json))
		consoleLog(1,"fetched internal events object, starting upload procedure")
		var button_icon=document.getElementById("sepabutton_icon");
		var button_spinner=document.getElementById("sepabutton_spinner");
	
	
	
	
	
	
		//UPDATE MESSAGE
		var flag_list=0; //0=blacklist
		var BLACKLIST=["aw-watcher-afk_LAPTOP-A3FDT9J3","aw-stopwatch","aw-producer"];
		
	
		var update_success_flag=1;
		var response;
	
		
	
		for (key in watchers_json) {
			
			//for(var i=0; i<FILTER.length; i++){
				//if(){
	
				//}
			//}
	
			try{
				
				var msgtimestamp=get_current_timestamp();
				response=await update_user_timed_sepa_message(events_rawjson[key],watchers_json[key].client,curruser,msgtimestamp); 
	
	
			}catch(e){
				console.log(e);
				update_success_flag=0;
			}
	
	
		} 
	
	
		if(update_success_flag==1){
			   //WHEN ALL UPDATES ARE DONE, CREATE UPDATE EVENT
			awclient.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+end_time+"\"} }")
			alert("UPDATED!");
			var loadingbar=document.getElementById("loading_bar");
			loadingbar.style.animation="load 1s linear"
		}else{
			alert("UPDATE FAILED!")
		}
	}else{
		alert("ERROR: ALREADY UPLOADED")
	}
 
}



//===========
// UTILITIES
//===========
//-----------------------------
//NAME: get_current_timestamp()
function get_current_timestamp(){
	const date=new Date();
	var string_timestamp=date.toISOString()
	//console.log(stringa)
	return string_timestamp
}



//temp: switch_user_menu
//var user_menu_shown=0;


