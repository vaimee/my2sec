const g=require("./greglogs.js")//logging
const JsapApi = require('@arces-wot/sepa-js').Jsap//jsap api
require("./jsapV2.js")//access global variable jsap
//require("./mappings.js")//access global variable mappings


console.log("//====================\\\\")
console.log("# AW MAPPER v0.3.2     #")
console.log('# delete/insert update #')
console.log("\\\\====================//")


//APP CONSTRUCTOR, TAKES THE GLOBAL VARIABLE JSAP AS ONLY PARAMETER
app= new JsapApi(jsap);

//http://www.vaimee.it/sources/aw-my2sec
//http://www.vaimee.it/sources/aw-watcher-working

var SOURCE={
	source: "http://www.vaimee.it/sources/aw-watcher-working"
}


if(process.env.SOURCE!=undefined){
	console.log("LOADING ENV SOURCE: "+process.env.SOURCE)
	SOURCE.source=process.env.SOURCE;
}else{
	console.log("default source: "+SOURCE.source)	
}




//SUBSCRIBE TO MAPPINGS
/*
EVENT_TYPE="none";
let sub2mappings = app.ALL_EVENTS_MAPPINGS(SOURCE);
sub2mappings.on("notification", not=>{

	var mapping_bindings=extract_bindings(not);
	for (index in mapping_bindings){
		EVENT_TYPE=mapping_bindings[index].event_type.value;
		console.log("MAPPING: "+mapping_bindings[index].event_type.value);
	}



	if(EVENT_TYPE!="none"){
		

	}else{
		console.log("NO MAPPING FOUND")
	}

});
*/


//SUBSCRIBE TO ALL MESSAGES OF AW-WATCHER-WINDOW
let sub2all_messages = app.ALL_USERS_MESSAGES(SOURCE);
//ON NOTIFICATION...
console.log("SUBSCRIBED 2 MESSAGES!")
sub2all_messages.on("notification",notification=>{
	// On every notification, the json response (not) contains the BINDINGS
	// bindings: ARRAY CONTAINING ALL THE RESULTS
	// LONGER THAN 1 AT STARTUP IF MESSAGES ARE ALREAY PRESENT IN THE SEPA
	// For that reason we need a big for cycle
	var bindings=extract_bindings(notification);
	//console.log(bindings);
	//The big for cycle
	for (index in bindings){
		try{
			handle_mapping(bindings[index]);
		}catch(error){
			console.log(error)
		}
	}

});




//=============================
// ### MAIN MAPPING HANDLER ###
//=============================
//maps a single binding result, a json message!
//LEVEL: RAW JSON MESSAGE
function handle_mapping(binding){

	//GET RESPONSE VARIABLES
	var user_name=binding.username_literal.value;
	var user_graph=binding.user_graph.value;
	var msg_datetime=binding.message_timestamp.value;
	var raw_json_string=binding.json_message.value;

	//PRINT MESSAGE INFO
	g.consoleLog(1,"#############################")
	g.consoleLog(1,"### NEW MESSAGE RECEIVED! ###")
	g.consoleLog(1,"#############################")
	g.consoleLog(1,"--- DETAILS ---")
	g.consoleLog(1,"> FROM: "+user_name)
	g.consoleLog(1,"> SOURCE: "+SOURCE.source)
	g.consoleLog(1,"> GRAPH: "+user_graph)
	g.consoleLog(1,"> WHEN: "+msg_datetime)
	g.consoleLog(1,"---------------")

	//PREPROCESS JSON TO CHECK AND CLEAN EVENTUAL ERRORS
	var json_ok=0;
	try{
		var clean_json_object = preprocess_json(raw_json_string);
		json_ok=1;
	}catch(error){
		console.log(error)
	}

	//IF JSON IS OK, PROCEED TO MAP MESSAGE AND THEN DELETE IT
	if(json_ok==1){
		//MAP MESSAGE
		map_aw_events(user_graph,msg_datetime,clean_json_object);	

		//DELETE MESSAGE

		console.log(" ")
	}else{
		g.consoleLog(2,"SKIPPING MALFORMED MESSAGE")
		console.log(" ")
	}
	
}


//EXTRACT ALL THE EVENTS FROM A MESSAGE
//LEVEL: JSON EVENTS ARRAY
async function map_aw_events(user_graph,msg_datetime,events_obj){
	g.consoleLog(1,"--- TRYING TO MAP: "+events_obj.length+" events ---")

	//EXTRACT SINGLE EVENTS
	//var forced_data={
	//	datetimestamp: "2022-08-10T17:33:42.503000+00:00",
	//	appname: "chrome.exe",
	//	apptitle: "youtube"
	//}



	for (single_event in events_obj){
		var found_source=0;

		if(SOURCE.source=="http://www.vaimee.it/sources/aw-watcher-working"){
			var event_forced_bindings=construct_window_event_forced_bindings(user_graph,events_obj[single_event])
			found_source++
		}else{
			if(SOURCE.source=="http://www.vaimee.it/sources/aw-my2sec"){
				var event_forced_bindings=construct_my2sec_event_forced_bindings(user_graph,events_obj[single_event])
				found_source++				
			}
		}


		if(found_source!=0){
			g.consoleLog(0,JSON.stringify(event_forced_bindings))
			//INJECT FORCED BINDINGS AND UPDATE
			await update_sepa(event_forced_bindings);
		}else{
			console.log("ERROR! NO SOURCE FOUND")
		}

	}

	//AFTER FINISHING THE EVENT,DELETE MESSAGE
	var delete_bindings=JSON.parse("{}");
	delete_bindings["usergraph"]=user_graph;
	delete_bindings["msgtimestamp"]=msg_datetime;
	delete_bindings["source"]=SOURCE.source;
	console.log(" ")
	g.consoleLog(1,"MESSAGE FINISHED, DELETING MESSAGE:")
	g.consoleLog(0,JSON.stringify(delete_bindings))
	//app.DELETE_MESSAGE(delete_bindings).then(res=>{g.consoleLog(0,"Delete response: " + res)})	

}


function update_sepa(bindings){
	return new Promise(resolve=>{
		app.ADD_EVENT(bindings).then(res=>{
			g.consoleLog(0,"Update response: " + res);
			resolve(res);
		})			
	});
}




//HANDLES A SINGLE EVENT
//LEVEL: JSON EVENT
//output example
function construct_window_event_forced_bindings(user_graph,event){

	//PRINT DEBUG TITLE
	g.consoleLog(0,"> processing window event "+event.id+" of "+event.timestamp)
	g.consoleLog(0,event)
	//g.consoleLog(0,">> preparing to map: "+data.length+" keys")

	//CONSTRUCT BINDINGS
	var event_forced_bindings = JSON.parse("{}");
	event_forced_bindings["usergraph"]=user_graph;
	event_forced_bindings["datetimestamp"]=event.timestamp;
	event_forced_bindings["event_type"]="sw:windowEvent";
	event_forced_bindings["app"]=event.data.app;
	event_forced_bindings["title"]=event.data.title.replace(/\\/g,"\\\\");
	event_forced_bindings["activity_type"]="sw:"+event.data.activity_type;
	event_forced_bindings["task"]=event.data.task;

	return event_forced_bindings

}


function construct_my2sec_event_forced_bindings(user_graph,event){

	//PRINT DEBUG TITLE
	g.consoleLog(0,"> processing my2sec event "+event.id+" of "+event.timestamp)
	g.consoleLog(0,event)
	//g.consoleLog(0,">> preparing to map: "+data.length+" keys")

	//CONSTRUCT BINDINGS
	var event_forced_bindings = JSON.parse("{}");
	event_forced_bindings["usergraph"]=user_graph;
	event_forced_bindings["datetimestamp"]=event.timestamp;
	event_forced_bindings["event_type"]="sw:"+event.data.scan+"Event";
	event_forced_bindings["app"]="none"//event.data.app;
	event_forced_bindings["title"]="none"//event.data.title.replace(/\\/g,"\\\\");
	event_forced_bindings["activity_type"]="sw:none"//event.data.title.replace(/\\/g,"\\\\");
	event_forced_bindings["task"]="none"
	return event_forced_bindings

}




//-------------------------------------------------------------------------------------------------------
//==========================
// ### UTILITY FUNCTIONS ###
//==========================
//extracts bindings from json response
function extract_bindings(msg){
	var bindings=msg.addedResults.results.bindings;
	return bindings;
}

//CHECK JSON FOR ERRORS, REPLACE SPECIAL CHARACTERS
function preprocess_json(raw_json_string){
	
	raw_json_string=raw_json_string.replace(/\\/g,"\\\\");

	var clean_json_object=JSON.parse(raw_json_string)

	return clean_json_object
}









