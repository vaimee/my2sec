//GLOBAL VARIABLE
//access with your main script via require("yourpath/jsap.js")
jsap={
	"host": "localhost",
	"oauth": {
		"enable": false,
		"register": "https://localhost:8443/oauth/register",
		"tokenRequest": "https://localhost:8443/oauth/token"
	},
	"sparql11protocol": {
		"protocol": "http",
		"port": 8600,
		"query": {
			"path": "/query",
			"method": "POST",
			"format": "JSON"
		},
		"update": {
			"path": "/update",
			"method": "POST",
			"format": "JSON"
		}
	},
	"sparql11seprotocol": {
		"protocol": "ws",
		"availableProtocols": {
			"ws": {
				"port": 9600,
				"path": "/subscribe"
			},
			"wss": {
				"port": 9443,
				"path": "/secure/subscribe"
			}
		}
	},
	"graphs": {
		
	},
	"namespaces": {

		"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
		"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
		"xsd": "http://www.w3.org/2001/XMLSchema#",
		"owl": "http://www.w3.org/2002/07/owl#",
		"time":"http://www.w3.org/2006/time#",

		"jsap": "http://www.vaimee.it/ontology/jsap#",
		"opo": "http://www.vaimee.it/ontology/opo#",
		"sw": "http://www.vaimee.it/ontology/sw#",
		"pac": "http://www.vaimee.it/ontology/pac#"

	},
	"extended": {
		
	},
	"updates": {},

	"queries": {
	

		"ALL_USERS_EVENTS":{
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/members> {?user_graph opo:username ?username_literal} GRAPH ?user_graph {?nodeid rdf:type sw:Event; rdf:type ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp; sw:activityType ?activity_type; opo:taskTitle ?task; sw:hasTimeInterval ?duration .  FILTER (?event_type != sw:Event)   }}"	
		}


	}
}





if(process.env.HOST_NAME!=undefined){
	var host_name=process.env.HOST_NAME;
	console.log("LOADING ENV HOST_NAME: "+host_name)
	jsap.host=host_name;
}else{
	console.log("default hostname")	
}


if(process.env.HTTP_PORT!=undefined){
	var http_port=process.env.HTTP_PORT;
	console.log("LOADING ENV HOST_NAME: "+http_port)
	jsap.sparql11protocol.port=http_port;	
}else{
	console.log("default hostname")	
}


if(process.env.WS_PORT!=undefined){
	var ws_port=process.env.WS_PORT;
	console.log("LOADING ENV HOST_NAME: "+ws_port)
	jsap.sparql11seprotocol.availableProtocols.ws.port=ws_port;
}else{
	console.log("default hostname")	
}
