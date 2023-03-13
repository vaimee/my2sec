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

class AwProducer extends AwMy2SecClient{
	constructor(jsap){
		super(jsap)
		//this.mc= new My2secClient()
		this.sepa_host_string=jsap.host
		this.queryBenchClient= new Sepajs.SEPA(jsap)
		this.sepaClient= new JsapApi(jsap)
		this.whitelistedWatchers="aw-watcher-working,aw-watcher-afk,aw-watcher-notshutdown,aw-watcher-start-stop"//"aw-watcher-working,aw-watcher-afk,aw-watcher-scan";
		this.watchersJson={};
		this.eventsRawJson=[];
		this.eventsJson=[];
		this.start_time_json="";
		this.nWatchers=0;
		//log.info("New AwProducer created!")
		//this.endTime="";
	}

	async startTests(){
		this.log.info("testing connections...")
		this.log.debug("log_level set to error to avoid console cluttering")
		var temp=this.log.loglevel
		this.log.loglevel=1
		var results={
			"sepa":"",
			"aw":"",
			"my2sec":""
		}
		//test sepa
		try{
			await this.testSepaConnection()
			results.sepa="passed"
		}catch(e){
			console.log(e)
			results.sepa="not-passed"
		}
		//test aw
		try{
			await this.testAwConnection()
			results.aw="passed"
		}catch(e){
			console.log(e)
			console.log("TEST NOT PASSED")
			results.aw="not-passed"
		}
		//test my2sec
		this.log.loglevel=temp
		return results
	}

	async testAw(){
		console.log("INITIAL CLEANING DB")
		var rawr=await this.get_events("aw-producer")
		rawr=JSON.parse(rawr)
		for(var k in rawr){
			await this.delete_event(rawr[k].id)
		}
		console.log(await this.get_events("aw-producer"))
		
		
		console.log("-----------------------")
		await this.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+get_current_timestamp()+"\"} }")
		console.log("--------------------------------")
		await this.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+get_current_timestamp()+"\"} }")
		console.log(await this.get_events("aw-producer"))
		console.log("------------------------")
		
		
		console.log("CLEANING DB")
		var rawr=await this.get_events("aw-producer")
		rawr=JSON.parse(rawr)
		for(var k in rawr){
			await this.delete_event(rawr[k].id)
		}
		console.log(await this.get_events("aw-producer"))

	}

	testSepaConnection(){
		var sepa_cbox=document.getElementById("sepa_connectionstatus_wrapper");
		return new Promise(resolve=>{
				this.queryBenchClient.query("select ?time where {<http://sepatest/currentTime> <http://sepatest/hasValue> ?time}")
				.then((data)=>{
					log.info("Connected to SEPA!");
					sepa_cbox.innerHTML="Connected to SEPA ("+this.sepa_host_string  /*+":"+jsap.sparql11protocol.port*/  +"<img class='white-icon' src='Assets/icons/wifi.svg'>)"
					
					resolve(data);
					//document.getElementById("row-2").style.display="flex";
				});
		});	
	}

	async testAwConnection(){
		var res = await this.get_filtered_watchers_json(1);
		return res
	}



	//=========================AW EVENTS==============================================================
	//VERIFY QUERY (DOES NOT MODIFY INTERNAL VARIABLES)
	async verifyQuery(){
		return await this.getFilteredCsv()
	}
	
	
	//UPLOAD QUERY
	async uploadQuery(){
		this.watchersJson = await this.get_filtered_watchers_json(1);
		//this.watchersJson[]
		//var start_time_jsonstring = await this.get_events("aw-producer");
		this.start_time_json=await this.get_producer_event("last_start")//JSON.parse(start_time_jsonstring);
		console.log("TEMPO DI INIZIO")
		var tempdate=this.start_time_json.data.last_start
		tempdate= new Date(tempdate);
		tempdate.setSeconds(tempdate.getSeconds()-10);
		this.start_time_json.data.last_start=tempdate.toISOString()
		console.log(this.start_time_json)
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


	//QUERY FOR THE EXPLORER INTERFACE
	async explorerQuery(){
		//override whitelist, we will fetch aw-watcher-working from the IA
		this.watchersJson = await this.get_filtered_watchers_json(1,
			"aw-watcher-afk,aw-watcher-notshutdown,aw-watcher-start-stop");
		//this.watchersJson[]
		//var start_time_jsonstring = await this.get_events("aw-producer");
		this.start_time_json=await this.get_producer_event("last_start")//JSON.parse(start_time_jsonstring);
		console.log("TEMPO DI INIZIO")
		var tempdate=this.start_time_json.data.last_start
		tempdate= new Date(tempdate);
		tempdate.setSeconds(tempdate.getSeconds()-10);
		this.start_time_json.data.last_start=tempdate.toISOString()
		console.log(this.start_time_json)
		this.eventsRawJson=await this.get_filtered_watchers_events()

		//INTEROPERABILITY
		try{
			this.eventsRawJson["aw-watcher-working"]=await this.getWorkingEvents()
			this.watchersJson["aw-watcher-working"]={id:"aw-watcher-working"}
		}catch(e){
			console.log("Found empty json")
			console.log(e)
			this.eventsRawJson["aw-watcher-working"]="[]"
			this.watchersJson["aw-watcher-working"]={id:"aw-watcher-working"}
		}
		console.log(this.watchersJson)
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
	async getWorkingEvents(){
		var res=await this.getAppsCsv()
		console.log(res)
		res=JSON.parse(res)
		var jsonObj=[]
		Object.keys(res.app).forEach(i=>{
			var cell={}
			cell["id"]=i
			cell["timestamp"]=res.timestamp[i]
			cell["duration"]=res.duration[i]
			cell["data"]={
				"app":res.app[i],
				"title":res.title[i],
				"url":res.url[i],
				"working_selection":res.working_selection[i]
			}
			jsonObj.push(cell)
		})
		console.log(jsonObj)
		return new Promise(resolve=>{resolve(JSON.stringify(jsonObj))})
	}





	//GET AW EVENTS REFINED FOR SEPA PRODUCTION
	async get_filtered_watchers_json(filtering_active,override_whitelist){
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
		if(override_whitelist==undefined){
			log.info("Using default whitelist: "+this.whitelistedWatchers)
			var raw_whitelist=this.whitelistedWatchers;
		}else{
			log.info("Override whitelist: "+override_whitelist)
			var raw_whitelist=override_whitelist;
		}
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
			log.debug("FILTERED WATCHERS!")
			//OVERRIDE GLOBAL VARIABLE
			watchers_json=filtered_watchers_json;
		}else{
			log.warning("USING UNFILTERED WATCHERS, MAY LEAD TO INSTABILITY")
		}
		//consoleLog(0,JSON.stringify(watchers_json));
		//alert("ciao")
		//[0.1] CREATE AW PRODUCER BUCKET IF IT DOES NOT EXISTS
		if(aw_producer_exists==0){
			log.debug("FIRST RUN, CREATING AW PRODUCER")
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
		if(!(Object.keys(this.start_time_json).length===0)){
	
			//GET FETTA DI EVENTI BABY
			if(silent_update==0){
				start_time=this.start_time_json.data.last_start;
				end_time = get_current_timestamp();
				console.log("FETCHING EVENTS FROM "+start_time+" TO "+end_time)
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
			log.info("first run, fetching all events")
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



//SEND MESSAGE TO SEPA
function update_sepa_message(jsonMessage,watcher_client,watcher_hostname){
	//var string="insert {<http://dld.arces.unibo.it/ontology/greg/messaggion"+String(counter)+"> <valore> '''"+JSON.stringify(jsonMessage)+"'''} where{}"
	var string="insert { _:b <hasValue> '''"+JSON.stringify(jsonMessage)+"'''; <hasClient> '''"+watcher_client+"'''; <hasHost> '''"+watcher_hostname+"'''} where{}"
	log.debug(string)
	client.update(string)
	.then(()=>{
		log.info("update_sepa_message: "+watcher_client +" EVENTS UPLOADED CORRECTLY!")
	});

}


function update_user_sepa_message(jsonMessage,watcher_client,username){
	//var string="insert {<http://dld.arces.unibo.it/ontology/greg/messaggion"+String(counter)+"> <valore> '''"+JSON.stringify(jsonMessage)+"'''} where{}"
	return new Promise(resolve=>{
		var string="insert { graph <http://www.vaimee.it/"+username+"> {_:b <http://www.vaimee.it/ontology/sw#messageValue> '''"+jsonMessage+"'''}} where{}"
		log.debug(string)
		client.update(string)
		.then(()=>{
			log.info("update_sepa_message: "+watcher_client +" EVENTS UPLOADED CORRECTLY!")
			resolve("updated");
			
		});
	});

}


function update_user_timed_sepa_message(jsonMessage,watcher_client,username,timestamp){
	//var string="insert {<http://dld.arces.unibo.it/ontology/greg/messaggion"+String(counter)+"> <valore> '''"+JSON.stringify(jsonMessage)+"'''} where{}"
	return new Promise(resolve=>{
		var string="insert { graph <http://www.vaimee.it/my2sec/"+username+"> {_:b <http://www.vaimee.it/ontology/sw#messageValue> '''"+jsonMessage+"''' ; <http://www.vaimee.it/ontology/sw#messageSource> <http://www.vaimee.it/sources/"+watcher_client+"> ; <http://www.w3.org/2006/time#inXSDDateTimeStamp> '''"+timestamp+"'''}} where{}"
		log.debug(string)
		client.update(string)
		.then(()=>{
			log.info("update_sepa_message: "+watcher_client +" EVENTS UPLOADED CORRECTLY!")
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
