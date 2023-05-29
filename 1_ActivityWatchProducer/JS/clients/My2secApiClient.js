class My2secApiClient{
	constructor(jsap){
		this.log= new GregLogs()
		this.my2secapi_host=this.get_host_from_jsap(jsap)
		//TODO WORKAROUND, OVERRIDE CONFIGURATION: find a better way to do this
		if(this.my2secapi_host.includes("localhost")){
			this.my2secapi_host=this.my2secapi_host.replace("localhost","127.0.0.1"); 
		}
		this.config={
            headers:{
                'Content-Type': 'application/json'
            }
        }
		//console.log(this.my2secapi_host)
		//this.host="127.0.0.1:5000";
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

    get_host_from_jsap(jsap){
        return jsap.extended.AwProducer.endpoints.My2secApi;
    }


	//==============================
	//API ACTIONS
	async startWatchers(){ return await this.action("startAction") }
	async stopWatchers(){ return await this.action("stopAction") }
	async getAppsCurrentCsv(){ return await this.action("getAppsCurrentCSV") }
	async getWorkingEventsAiFiltered(){ return await this.action("getWorkingEventsAiFilter") }
	async setWorkEvents(events){ 

		var url=this.my2secapi_host+"/user";
		var data={
			"watcher-api-request":{
				"requestAction":{
					"watchers-management":{
						"SetWorkingEvents": events
					}
				}
			}
		}
		var res=await axios.post(url,data,this.config);
		if(res.status==400){
			this.log.warning("OH NO! GIANLU'S API STOPPED WORKING! BUT NO WORRIES, HERE COMES THE FALLBACK AHAHAHAHAH")
			res=await axios.post(url,JSON.stringify(data),this.config); //!FALLBACK
			if(res.status!=200){throw new Error("My2secApiRequest failed")}
		}
		//var res=await this.my2sec_post("/user",`{"watcher-api-request":{"requestAction":{"watchers-management":{"SetWorkingEvents": ${events}}}}}`)
		
		return res;
	}
	async getCsvNone(){ return await this.action("getCurrentCSV_None") }
	async sendCurrentCsv(){ return await this.action("sendCurrentCSV") }
	async get_SelectionCsv(){ return await this.action("getSelectionCsv") }
	maous(){
		console.log("mao")
	}

	async action(stringAction){
		//var res=await this.my2sec_post("/user",this[stringAction])
		//return new Promise(resolve=>{resolve(res)})
		var url=this.my2secapi_host+"/user";
		var data=this[stringAction]
		var res=await axios.post(url,data,this.config);
		if(res.status==400){
			this.log.warning("OH NO! GIANLU'S API STOPPED WORKING! BUT NO WORRIES, HERE COMES THE FALLBACK AHAHAHAHAH")
			res=await axios.post(url,JSON.stringify(data),this.config); //!FALLBACK
			if(res.status!=200){throw new Error("My2secApiRequest failed")}
		}

		return res.data
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
			//var url="http://"+this.host+path
			var url=this.my2secapi_host+path;
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