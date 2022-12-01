/*---------------------------------------------------------\
|| sepa-client.js: SEPA CLIENT METHODS
|| 	DATE: 9/8/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: a collection of methods used to 
||     communicate with a sepa engine
\\--------------------------------------------------------*/
//GLOBAL VARIABLES
//let client; //GLOBAL OBJECT FOR THE SEPA CLIENT
//jsap; //E' DIVENTATA GLOBALE
const JsapApi = Sepajs.Jsap;
//console.log(JSON.stringify(default_jsap))

class AwProducer extends AwClient{
	constructor(){
		super()
		this.queryBenchClient= new Sepajs.SEPA(default_jsap)
		this.sepaClient= new JsapApi(default_jsap)
		this.whitelistedWatchers="aw-watcher-working"//"aw-watcher-working,aw-watcher-afk,aw-watcher-scan";
		this.watchersJson={};
		this.eventsRawJson=[];
		this.eventsJson=[];
		this.start_time_json="";
		this.nWatchers=0;
		log.info("New AwProducer created!")
		//this.endTime="";
	}


	async start(){
		this.load_default_configuration()
		log.info("Trying to connect to SEPA host: "+default_jsap.host)
		await this.testSepaConnection()
	}


	logspan_setTotalEvents(id){
		var singleJ="";
		var total_events=0;
		for(var key in this.eventsJson){
			singleJ=this.eventsJson[key];
			total_events=total_events+singleJ.length;
		}
	
		document.getElementById(id).textContent=total_events;
	}

	logspan_setTotalWatchers(id){
		var nWatchers=0;
		for(var key in this.watchersJson){
			nWatchers++
		}
		document.getElementById(id).textContent=nWatchers
	}


	testSepaConnection(){
		var sepa_cbox=document.getElementById("sepa_connectionstatus_wrapper");
		return new Promise(resolve=>{
				this.queryBenchClient.query("select ?time where {<http://sepatest/currentTime> <http://sepatest/hasValue> ?time}")
				.then((data)=>{
					log.info("Connected to SEPA!");
					sepa_cbox.innerHTML="Connected to SEPA ("+default_jsap.host  /*+":"+jsap.sparql11protocol.port*/  +"<img class='white-icon' src='Assets/icons/wifi.svg'>)"
					
					resolve(data);
					document.getElementById("row-2").style.display="flex";
				});
		});	
	}

	async testAwConnection(){

	}



	//=========================AW EVENTS=============
	async loadEvents(){
		this.watchersJson = await this.get_filtered_watchers_json(1);
		var start_time_jsonstring = await this.get_events("aw-producer");
		this.start_time_json=JSON.parse(start_time_jsonstring);
		this.eventsRawJson=await this.get_filtered_watchers_events()
		for(var key in this.watchersJson){
			
			this.eventsJson[key] = JSON.parse(this.eventsRawJson[key]);
			this.eventsRawJson[key]=this.eventsRawJson[key].replace(/\\/g,"\\\\");//BUGFIX	
			this.eventsRawJson[key]=this.eventsRawJson[key].replace(/\"/g,"\\\"");//BUGFIX
			this.eventsRawJson[key]=this.eventsRawJson[key].replace(/\'/g,"\\\'");//BUGFIX	
			console.log(this.eventsRawJson[key])	
		}
		//CALCULATE NUMBER OF WATCHERS
		var tempcount=0;
		for(var key in this.watchersJson){
			tempcount++
		}
		this.nWatchers=tempcount;
	}

	//GET AW EVENTS REFINED FOR SEPA PRODUCTION
	async get_filtered_watchers_json(filtering_active){
		//Get active watchers
		var watchers_json = await this.get_watchers();
		watchers_json = JSON.parse(watchers_json);//BUGFIX
		//CHECK IF PRODUCER EXISTS BEFORE WHITELIST
		var aw_producer_exists=0; //bugfix
		for (var key in watchers_json){
			if(watchers_json[key].id=="aw-producer"){
				aw_producer_exists=1;
				//consoleLog(1,"AW PRODUCER FOUND!")
				//consoleLog(1,aw_producer_exists)
			}
		}
		//FILTER WHITELIST
		var raw_whitelist=this.whitelistedWatchers;
		//alert(raw_whitelist.replace(/\s/g, ""));
		var raw_whitelist_nospaces=raw_whitelist.replace(/\s/g, "")
		//var tempwhite=raw_whitelist_nospaces.split(",")
		//var filtering_active=1;
		//var WHITELIST=["aw-watcher-window"];
		var WHITELIST=raw_whitelist_nospaces.split(",")
		var filtered_watchers_json=JSON.parse("{}");
		var number_of_filtered_watchers=0;
		var number_of_unfiltered_watchers=0;
		for (key in watchers_json){
			var identifier=watchers_json[key].id.split("_")
			//console.log(identifier[0])
			number_of_unfiltered_watchers++
			for(var index in WHITELIST){
				//console.log("W:"+WHITELIST[index])
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
		//consoleLog(0,JSON.stringify(watchers_json));
		//alert("ciao")
		//[0.1] CREATE AW PRODUCER BUCKET IF IT DOES NOT EXISTS
		if(aw_producer_exists==0){
			consoleLog(0,"FIRST RUN, CREATING AW PRODUCER")
			await this.create_producer_bucket();		
		}
		//RETURN WATCHERS JSON OBJECT
		return watchers_json
	}


	async get_filtered_watchers_events(){
		//[1.2] Get Watchers Events
		var events_json=[]; //TEMP CONTAINER
		var events_rawjson=[];
	
		var data_fetch_success_flag=1;

		//IF START TIME EVENT EXISTS GET EVENTS SLICE, ELSE GET ALL EVENTS
		if(this.start_time_json.length>0){
	
			//GET FETTA DI EVENTI BABY
			if(silent_update==0){
				start_time=this.start_time_json[0].data.last_update;
				end_time = get_current_timestamp();
			}else{
				console.log("Fetching silent time")
				start_time = OVERWRITE_START_TIME;//"2022-08-22T01:00:00.00Z";
				end_time = OVERWRITE_END_TIME;//get_current_timestamp();
			}
			//consoleLog(1,"fetching events from "+start_time+" to "+end_time)
			for (var key in this.watchersJson) {
				try{
					events_rawjson[key]=await this.query_events(this.watchersJson[key].id,end_time,start_time);
					//find_bastard(events_rawjson[key],132150+42645)
					events_json[key] = JSON.parse(events_rawjson[key]);
				}catch(e){console.log(e);data_fetch_success_flag=0;}
			}
	
		}else{
	
			//GET ALL EVENTS
			consoleLog(1,"first run, fetching all events")
			end_time = get_current_timestamp();//FIX BUG ON FIRST START
			for(key in this.watchersJson){
				try{
					events_rawjson[key]=await this.get_events(this.watchersJson[key].id);
					events_json[key] = JSON.parse(events_rawjson[key]);
				}catch(e){console.log(e);data_fetch_success_flag=0;}
	
			}
	
		}
		//console.log(events_rawjson)
		//PREPROCESS EVENTS. ADDED FOR STABILITY
		//var events_filter_app=["private"];
		//consoleLog(0,events_json)
		events_json=this.filter_events_by_app(events_json);
		//bugfix
		for(key in this.watchersJson){
			events_rawjson[key]=JSON.stringify(events_json[key]);
			//console.log(events_rawjson[key])
			//var start=132150;
			//find_bastard(events_rawjson[key],start)
		}
		//console.log(events_rawjson)
		return events_rawjson
	
	}


	filter_events_by_app(eventsobj){
		console.log(" ")
		console.log("### FILTERING EVENTS ###")
		//console.log("ciao icaro!")
		//extract single watcher events
	
		for (var key in eventsobj){
			console.log(eventsobj[key].length)
			eventsobj[key]=eventsobj[key].filter(this.filter_event_by_app);
			console.log(eventsobj[key].length)
		}
	
		return eventsobj
	}
	
	filter_event_by_app(e){
		return e.data.app!="private"
	}

}

//var ciao=new AwProducer;
//ciao.start()

//var jsap;
/*
function init_sepa_client(){
	consoleLog(1,"sepaclient: parsed jsap (SEPAclient configuration file)")
	consoleLog(0,JSON.stringify(default_jsap))
	const SEPA = Sepajs.SEPA
	client= new SEPA(default_jsap)
	consoleLog(1,"sepaclient: Sepajs client created!")
}
*/

//SEND MESSAGE TO SEPA
function update_sepa_message(jsonMessage,watcher_client,watcher_hostname){
	//var string="insert {<http://dld.arces.unibo.it/ontology/greg/messaggion"+String(counter)+"> <valore> '''"+JSON.stringify(jsonMessage)+"'''} where{}"
	var string="insert { _:b <hasValue> '''"+JSON.stringify(jsonMessage)+"'''; <hasClient> '''"+watcher_client+"'''; <hasHost> '''"+watcher_hostname+"'''} where{}"
	consoleLog(0,string)
	client.update(string)
	.then(()=>{
		consoleLog(1,"update_sepa_message: "+watcher_client +" EVENTS UPLOADED CORRECTLY!")
	});

}


function update_user_sepa_message(jsonMessage,watcher_client,username){
	//var string="insert {<http://dld.arces.unibo.it/ontology/greg/messaggion"+String(counter)+"> <valore> '''"+JSON.stringify(jsonMessage)+"'''} where{}"
	return new Promise(resolve=>{
		var string="insert { graph <http://www.vaimee.it/"+username+"> {_:b <http://www.vaimee.it/ontology/sw#messageValue> '''"+jsonMessage+"'''}} where{}"
		consoleLog(0,string)
		client.update(string)
		.then(()=>{
			consoleLog(1,"update_sepa_message: "+watcher_client +" EVENTS UPLOADED CORRECTLY!")
			resolve("updated");
			
		});
	});

}


function update_user_timed_sepa_message(jsonMessage,watcher_client,username,timestamp){
	//var string="insert {<http://dld.arces.unibo.it/ontology/greg/messaggion"+String(counter)+"> <valore> '''"+JSON.stringify(jsonMessage)+"'''} where{}"
	return new Promise(resolve=>{
		var string="insert { graph <http://www.vaimee.it/my2sec/"+username+"> {_:b <http://www.vaimee.it/ontology/sw#messageValue> '''"+jsonMessage+"''' ; <http://www.vaimee.it/ontology/sw#messageSource> <http://www.vaimee.it/sources/"+watcher_client+"> ; <http://www.w3.org/2006/time#inXSDDateTimeStamp> '''"+timestamp+"'''}} where{}"
		consoleLog(0,string)
		client.update(string)
		.then(()=>{
			consoleLog(1,"update_sepa_message: "+watcher_client +" EVENTS UPLOADED CORRECTLY!")
			resolve("updated");
			
		});
	});

}



















function extract_bindings(msg){
	var bindings=msg.addedResults.results.bindings;
	return bindings;
}

function extract_query_bindings(msg){
	var bindings=msg.results.bindings;
	return bindings;
}
