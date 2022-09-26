/*---------------------------------------------------------\
|| aw-client.js: ACTIVITY WATCH CLIENT CLASS
|| 	DATE: 28/06/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: a collection of methods used to 
||     get and post data to the localhost Activity Watch API
\\--------------------------------------------------------*/
console.log("-> Loaded external script: aw_api_lib.js")


class AwClient {

	//CLASS CONSTRUCTOR, DOES NOTHING
	constructor(){}


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
		this.jsonObj=JSON.parse("{ \"nodeHost\": \"localhost\", \"port\": \"5600\"}") //1340
		consoleLog(1,"awclient: parsed json (AW configuration file)")
		consoleLog(0,JSON.stringify(this.jsonObj))
	}


	//----------------------------------------------
	//NAME: get_watchers()
	//DESCRIPTION: makes an http request to the api to get the list of active buckets in json format
	//ARGUMENTS: none
	//RETURNS: jsonObject jsonWatchers (the json object containing watchers info)
	async get_watchers(){
		//WAIT TO GET THE JSON
		consoleLog(1,"get_watchers: fetching watchers...")
		var jsonWatchers = await this.get("/api/0/buckets/")
		//RETURN THE WATCHERS
		return new Promise(resolve=>{
  			consoleLog(1,"get_watchers: fetched watchers correctly!")
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
		consoleLog(1,"get_events: fetching events of "+watcher_id+"...")
		//WAIT TO GET THE JSON
		var jsonEvents = await this.get("/api/0/buckets/"+watcher_id+"/events")
		//RETURN THE WATCHERS
		return new Promise(resolve=>{
  			consoleLog(1,"get_events: fetched events correctly!")
  			resolve(jsonEvents)
		});
	}


	//--------------------------------------
	//NAME: query_events(String watcher_id, String end_time, String start_time)
	//DESCRIPTION: similar to get_events(), except in this method you can specify a time interval for the events
	//ARGUMENT: String watcher_id (identifies the watcher), String end_time/start_time (formatted ISO timestamp)
	//RETURNS: jsonObject jsonEvents (the json object containing an array of events in a certain period of time)
	async query_events(watcher_id,end_time,start_time){
		consoleLog(1,"get_events: fetching events of "+watcher_id+"...")
		//WAIT TO GET THE JSON, with query example: ?end=2022-07-17T15%3A23%3A55Z&start=2022-07-16T15%3A23%3A55Z
		var path="/api/0/buckets/"+watcher_id+"/events?end="+end_time+"&start="+start_time;
		path=path.replace(/:/g,"%3A"); //REPLACE : WITH %3A FOR A WELL FORMATTED REQUEST
		consoleLog(0,"query_events: reqpath: "+path)
		
		var jsonEvents = await this.get(path) //path
		//RETURN THE WATCHERS
		return new Promise(resolve=>{
  			consoleLog(1,"query_events: fetched events correctly!")
  			resolve(jsonEvents)
		});
	}




	//======================================
	// POST/UPDATE METHODS
	//======================================

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
        			consoleLog(1,"create_bucket: aw-producer bucket created, status "+this.status)
        			resolve("ok")
    			}else{

    				if (this.readyState === XMLHttpRequest.DONE && this.status === 304) {
    					consoleLog(1,"create_bucket: aw-producer bucket already existing, status "+this.status)
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
		var event= await this.get_events('aw-producer')
		event=JSON.parse(event);
		//SE ESISTE GIA', ELIMINALO
		if (event.length>0) {
			await this.delete_event(event[0].id)	
		}
		await this.create_event(json_event)
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
        			consoleLog(1,"create_event: aw-producer event created, status "+this.status)
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
        			consoleLog(1,"remove_event: aw-producer event n."+event_ID+" deleted, status "+this.status)
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
			var jsonResponse;
			consoleLog(0,"api_get: getting "+reqtext)

			req.open("GET",reqtext);	
			
			req.onload = function(){
				//jsonResponse = JSON.parse(req.responseText);
				consoleLog(0,"api_GetJson: fetched data correctly from AW API")
				//consoleLog(0,JSON.stringify(jsonResponse))
				consoleLog(0,req.responseText)
				//resolve(jsonResponse) //return json asynchronously   
				resolve(req.responseText);
			}
			req.send();
		});

	}
	//===============================================================================================================	


}