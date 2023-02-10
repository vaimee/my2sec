/*---------------------------------------------------------\
|| aw-client.js: ACTIVITY WATCH CLIENT CLASS
|| 	DATE: 28/06/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: a collection of methods used to 
||     get and post data to the localhost Activity Watch API
\\--------------------------------------------------------*/
class AwClient {

	//CLASS CONSTRUCTOR, DOES NOTHING
	constructor(){
		
	}


	//===========================
	// GET METHODS
	//===========================

	//--------------------------------------------
	//NAME: get_aw_configuration(String jsonFilePath)
	//DESCRIPTION: reads a json file from the filesystem, then parses it into a JsonObject and initializes the class variable jsonObj
	//ARGUMENTS: String jsonFilePath (the path to the configuration file)
	//RETURNS: a jsonObject containing the parsed json file, you don't need to catch the output since it initializes an internal variable
	//NOTES: uses the fetch api and works only via http protocol, not file protocol
	load_configuration(jsonFilePath){ 
		return new Promise(resolve=>{
			//GET CONFIG FILE
			fetch(jsonFilePath)
			.then(response => response.text())
			.then(data => {
				this.jsonObj=JSON.parse(data)
				consoleLog(1,"awclient: parsed json (AW configuration file)")
				consoleLog(0,JSON.stringify(this.jsonObj))
				resolve(this.jsonObj)	
			});
		});
	}
	//NOTES: this version works on any protocol
	load_default_configuration(){
		this.jsonObj=JSON.parse("{ \"nodeHost\": \"localhost\", \"port\": \"1340\"}") //5600
		log.debug("awclient: loaded default configuration")
		log.trace(JSON.stringify(this.jsonObj))
	}


	//----------------------------------------------
	//NAME: get_watchers()
	//DESCRIPTION: makes an http request to the api to get the list of active buckets in json format
	//ARGUMENTS: none
	//RETURNS: jsonObject jsonWatchers (the json object containing watchers info)
	async get_watchers(){
		//WAIT TO GET THE JSON
		//consoleLog(1,"-------------------------------")
		//consoleLog(1,"aw-client: fetching watchers...")
		var jsonWatchers = await this.get("/api/0/buckets/")
		//RETURN THE WATCHERS
		return new Promise(resolve=>{
  			//consoleLog(1,"aw-client: fetched watchers correctly!")
  			resolve(jsonWatchers)
		});
	}


	//--------------------------------------
	//NAME: get_events(String watcher_id)
	//DESCRIPTION: makes an http request to the api to get the events produced by 1 specific watcher
	//ARGUMENTS: String watcher_id (identifies the watcher, it is a concatenation of client+hostname)
	//RETURNS: jsonObject jsonEvents (the json object containing an array of events)
	//NOTES: calling this metod fetches ALL events of a watcher in the aw server, so it could take some time
	async get_events(watcher_id){
		//consoleLog(1,"aw-client: fetching events of "+watcher_id+"...")
		//WAIT TO GET THE JSON
		var jsonEvents = await this.get("/api/0/buckets/"+watcher_id+"/events")
		//RETURN THE WATCHERS
		return new Promise(resolve=>{
  			//consoleLog(1,"aw-client: fetched events correctly!")
  			resolve(jsonEvents)
		});
	}
	mao(){
		console.log("mao")
	}


	//--------------------------------------
	//NAME: query_events(String watcher_id, String end_time, String start_time)
	//DESCRIPTION: similar to get_events(), except in this method you can specify a time interval for the events
	//ARGUMENT: String watcher_id (identifies the watcher), String end_time/start_time (formatted ISO timestamp)
	//RETURNS: jsonObject jsonEvents (the json object containing an array of events in a certain period of time)
	async query_events(watcher_id,end_time,start_time){
		//consoleLog(1,"-----------------------------------------------")
		//consoleLog(1,"aw-client: fetching events of "+watcher_id+"...")
		//WAIT TO GET THE JSON, with query example: ?end=2022-07-17T15%3A23%3A55Z&start=2022-07-16T15%3A23%3A55Z
		var path="/api/0/buckets/"+watcher_id+"/events?end="+end_time+"&start="+start_time;
		path=path.replace(/:/g,"%3A"); //REPLACE : WITH %3A FOR A WELL FORMATTED REQUEST
		//consoleLog(0,"query_events: reqpath: "+path)
		
		var jsonEvents = await this.get(path) //path
		//RETURN THE WATCHERS
		return new Promise(resolve=>{
  			//consoleLog(1,"aw-client: fetched events correctly!")
  			resolve(jsonEvents)
		});
	}




	//======================================
	// POST/UPDATE METHODS
	//======================================
	//UPDATE LAST START FLAG
	async update_start_flag(){
		console.log("URKA")
		//var events= await awManager.get_events('aw-producer')
		var start_event=await this.get_producer_event("last_start")
		if(Object.keys(start_event).length===0){
			console.log("Start event does not exist")
			var res = await this.create_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_start\":\""+get_current_timestamp()+"\"} }");
			console.log(res)
		}else{
			console.log("Fetched Start Event: "+start_event.data.last_start)
			var update_event=await this.get_producer_event("last_update")
			if(Object.keys(update_event).length===0){
				console.log("start event exists but no update has ever been made")
			}else{
				console.log("Fetched Update Event: "+update_event.data.last_update)
				if(new Date(start_event.data.last_start)<new Date(update_event.data.last_update)){
					console.log("NUOVO START")
					await this.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_start\":\""+get_current_timestamp()+"\"} }")
				}else{
					console.log("RIPRENDI DA PAUSA")
				}
			}
			//await awManager.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+get_current_timestamp()+"\"} }")
		}
		
	}
	async get_producer_event(type){
		var events=await this.get_events('aw-producer')
		events=JSON.parse(events)
		//console.log(events)
		var event={}
		for(var key in events){
			var data=events[key].data
			if(Object.keys(data).join(",").includes(type)){
				event=events[key]
			}
		}
		return new Promise(resolve=>{
			resolve(event)
		})
	}




	//------------------------------
	//NAME: create_producer_bucket()
	//DESCRIPTION: creates a new "aw-producer" bucket. Does nothing if already exists
	//ARGUMENTS: none
	create_producer_bucket(){
		return new Promise(resolve=>{
			var req = new XMLHttpRequest();
			var reqtext="http://"+this.jsonObj.nodeHost+":"+this.jsonObj.port+"/api/0/buckets/aw-producer"
			//console.log("cazzomaledetto"+reqtext)

			req.open("POST", reqtext, true);

			//Send the proper header information along with the request
			req.setRequestHeader("Content-Type", "application/json");
			
			req.onreadystatechange = function() {// Call a function when the state changes.
    			if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        			// Request finished. Do processing here.
        			//consoleLog(1,"create_bucket: aw-producer bucket created, status "+this.status)
        			resolve("ok")
    			}else{

    				if (this.readyState === XMLHttpRequest.DONE && this.status === 304) {
    					//consoleLog(1,"create_bucket: aw-producer bucket already existing, status "+this.status)
    					resolve("ok")
    				}
    			}
			}
			req.send("{ \"client\": \"aw-producer\", \"type\": \"sepaconnector\", \"hostname\": \"unknown\"}");	
		});
	}


	//------------------------------
	//NAME: update_event(String json_event)
	//DESCRIPTION: sends a stringified json to aw api to update a specific event
	//ARGUMENTS: String json_event (a stringified json object containing the event to update) 
	//NOTES: the json event needs to have an ID field in order to be updated, but the aw server auto-assigns an ID to new events so chill
	async update_event(json_event){
		console.log("### TIMESTAMP TO UPDATE: "+json_event)
		var event
		var type=""
		if(Object.keys(JSON.parse(json_event).data).join(",").includes("last_update")){
			type="last_update"
		}else{
			type="last_start"
		}
		console.log("Update type: "+type)
		event = await this.get_producer_event(type)
		console.log("PREVIOUS EVENT: "+JSON.stringify(event))
		//SE ESISTE GIA', ELIMINALO
		if(Object.keys(event).length>0){
			console.log("events exists, delete")
			await this.delete_event(event.id)	
		}
		var res=await this.create_event(json_event)
		console.log(await this.get_events("aw-producer"))
	}


	//------------------------------
	//NAME: create_event(String json_event)
	//DESCRIPTION: sends a stringified json to aw api to insert a new event
	//ARGUMENTS: String json_event (a stringified json object containing the event to insert) 
	//NOTES: aw server automatically inserts the new event into the jsonEvents array of the watcher producing the event
	create_event(json_event){
		return new Promise(resolve=>{
			var req = new XMLHttpRequest();
			var reqtext="http://"+this.jsonObj.nodeHost+":"+this.jsonObj.port+"/api/0/buckets/aw-producer/events"
			req.open("POST", reqtext, true);

			//Send the proper header information along with the request
			req.setRequestHeader("Content-Type", "application/json");
			
			req.onreadystatechange = function() {// Call a function when the state changes.
    			if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        			// Request finished. Do processing here.
        			//consoleLog(1,"create_event: aw-producer event created, status "+this.status)
        			resolve("ok")
    			}
			}
			//bodystring="{ \"timestamp\": \"2022-07-12T16:47:46.060Z\", \"duration\": 0, \"data\": {\"last_update\":\""+get_time()+"\"} }"
			req.send(json_event);	
		});
	}


	//------------------------------
	//NAME: delete_event(String json_event)
	//DESCRIPTION: deletes an event by ID
	//ARGUMENTS: String event_id (the number id of the event to delete) 
	delete_event(event_ID){
		consoleLog(0,"removing event")
		return new Promise(resolve=>{

			var req = new XMLHttpRequest();
			var reqtext="http://"+this.jsonObj.nodeHost+":"+this.jsonObj.port+"/api/0/buckets/aw-producer/events/"+event_ID;
			req.open("DELETE", reqtext, true);

			//Send the proper header information along with the request
			req.setRequestHeader("Content-Type", "application/json");
			
			req.onreadystatechange = function() {// Call a function when the state changes.
    			if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        			// Request finished. Do processing here.
        			//consoleLog(1,"remove_event: aw-producer event n."+event_ID+" deleted, status "+this.status)
        			resolve("ok")
    			}
			}
			req.send();	
		});
	}




	//======================================================//
	//	/|\ [THE ROOT, ALLOWS TO GET DATA FROM THE API]		//
	// 	\|/	  ______________________________________		//
	//	 |___|______________________________________|___	//
	//___|______________________________________________|___//
	//|													   |//	
	//======================================================//
	//NAME: get(String path)
	//DESCRIPTION: sends an http request to the AW API, which responds with a json file
	//ARGUMENTS: String path (the path for the api call)
	//RETURNS: JsonObject jsonResponse (the API response, it is a Promise and needs to be listened with "await")
	//NOTES: you can call this method with the "await" keyword form within an async function to wait for it to finish
	get(path){
		return new Promise(resolve=>{
			var req= new XMLHttpRequest();
			var reqtext="http://"+this.jsonObj.nodeHost+":"+this.jsonObj.port+path
			req.open("GET",reqtext);	
			req.onload = function(){
				log.debug("AwClient request: GET "+reqtext)
				log.trace("AwClient response: "+req.responseText)
				resolve(req.responseText);
			}
			req.send();
		});
	}
	//===============================================================================================================	


}





class AwMy2SecClient extends AwClient{
	constructor(host){
		super();
		this.load_default_configuration()
		this.host=host;
		//RESET: apps_current.csv / apps_selection da cancellare
		this.startAction='{"watcher-api-request":{"requestAction":{"watchers-management":"START_ALL"}}}' //START SCAN
		this.stopAction='{"watcher-api-request":{"requestAction":{"watchers-management":"STOP_ALL"}}}' //STOP SCAN
		this.getAppsCurrentCSV='{"watcher-api-request":{"getAction":"GetCurrentCSV"}}' //CURRENT EVENTS (not filtered)
		this.getWorkingEventsAiFilter='{"watcher-api-request":{"getAction":"GetWorkingEvents-AI-Filter"}}' //FILTERED EVENTS
		//ritorna tutti gli eventi flaggati (none,0,1) -> none significa che il filtro non è ancora stato applicato perchè ci sono pochi eventi
		//0 non lavorativo, 1 lavorativo
		//SE RESTITUISCE UN JSON VUOTO {} ALLORA CONOSCE TUTTO E NON SERVE setWorkingEvents, vai diretto a getCurrentCSV_None
		//PROMPTO L'UTENTE AD AGGIUSTARE LE BOX
		this.setWorkingEvents='{"watcher-api-request":{"requestAction":{"watchers-management":{"SetWorkingEvents": SOMETHING}}}}' //RESTITUISCI TUTTI GLI EVENTI ALL'API, SIA CON 0 E CON 1, NON SI ASPETTA null
		this.getCurrentCSV_None='{"watcher-api-request":{"getAction":"GetCurrentCSV-None"}}' //ritorna true se ci sono none. Se restituisce false va tutto bene
		//CARICA I DATI SU AW, SE NON LO FAI AWlocal si desincronizza col sepa
		this.sendCurrentCSV='{"watcher-api-request":{"requestAction":{"watchers-management":"SendCurrentCSV"}}}'

		this.getSelectionCsv='{"watcher-api-request":{"getAction":"GetSelectionCSV"}}'
	
	}


	//==============================
	//API ACTIONS
	async startWatchers(){ return await this.action("startAction") }
	async stopWatchers(){ return await this.action("stopAction") }
	async getAppsCsv(){ return await this.action("getAppsCurrentCSV") }
	async getFilteredCsv(){ return await this.action("getWorkingEventsAiFilter") }
	async setWorkEvents(events){ 
		var res=await this.my2sec_post("/user",`{"watcher-api-request":{"requestAction":{"watchers-management":{"SetWorkingEvents": ${events}}}}}`)
		return new Promise(resolve=>{resolve(res)})
	}
	async getCsvNone(){ return await this.action("getCurrentCSV_None") }
	async sendCurrentCsv(){ return await this.action("sendCurrentCSV") }
	async get_SelectionCsv(){ return await this.action("getSelectionCsv")}
	maous(){
		console.log("mao")
	}
	async action(stringAction){
		var res=await this.my2sec_post("/user",this[stringAction])
		return new Promise(resolve=>{resolve(res)})
	}



	//==============================
	// MANAGE DATA
	parseToArr(res){
		var arr=[]
		try{
			res=JSON.parse(res)
			if(!this._validate_json(res)){
				throw new Error("Invalid json")
			}
			Object.keys(res.app).forEach(i=>{
				Object.keys(res).forEach(field=>{
					console.log(i+"-"+field+":"+res[field][i])
				})
			})


		}catch(e){
			console.log(e)
		}
	}
	_validate_json(j){
		var success=true
		if(j.app==undefined){
			success=false
		}
		return success
	}



	//==============================
	//HTTP CLIENT
	my2sec_post(path,body){
		return new Promise(resolve=>{
			var req = new XMLHttpRequest();
			var url="http://"+this.host+path
			req.open("POST", url, true);
			//Send the proper header information along with the request
			req.setRequestHeader("Content-Type", "application/json");
			req.onreadystatechange = function() {// Call a function when the state changes.
    			if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        			// Request finished. Do processing here.
        			resolve(req.responseText)
    			}
			}
			req.send(body);	
		});
	}
	/*
	get(path){
		return new Promise(resolve=>{
			var req= new XMLHttpRequest();
			var reqtext="http://"+this.host+path
			consoleLog(0,"My2sec client request: GET "+reqtext)
			req.open("GET",reqtext);	
			req.setRequestHeader("Content-Type", "application/json");
			req.onload = function(){
				resolve(req.responseText);
			}
			req.send();
		});
	}
	*/

}

