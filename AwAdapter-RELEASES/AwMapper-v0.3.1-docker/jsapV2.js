//GLOBAL VARIABLE
//access with your main script via require("yourpath/jsap.js")
jsap={
	"host": "host.docker.internal",
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
	"updates": {


		"CREATE_USERNAMES_GRAPH":{
			"sparql": "CREATE GRAPH <http://www.vaimee.it/my2sec/members>"
		},
		"DROP_USERNAMES_GRAPH":{
			"sparql":"DROP GRAPH <http://www.vaimee.it/my2sec/members>"
		},



		"ADD_USER":{
			"sparql":"INSERT DATA { GRAPH <http://www.vaimee.it/my2sec/members> { <http://www.vaimee.it/my2sec/defuser@vaimee.it> opo:username '''defuser''' }}"
		},
		"CREATE_USER_PRIVATE_GRAPH":{
			"sparql":"CREATE GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it>"
		},



		"REMOVE_USER":{
			"sparql":"DELETE {?s ?p ?o} WHERE { GRAPH <http://www.vaimee.it/my2sec/members> { <http://www.vaimee.it/my2sec/defuser@vaimee.it> ?p ?o }}"
		},
		"DELETE_USER_PRIVATE_GRAPH":{
			"sparql":"DROP GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it>"
		},
		"DELETE_ALL_USER_DATA":{
			"sparql":"DELETE {?s ?p ?o} WHERE { GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it> { ?s ?p ?o }}"
		},



		"SEND_MESSAGE":{
			"sparql":"INSERT DATA { GRAPH ?usergraph { _:b sw:messageValue ?msgvalue; sw:messageSource ?source ;  time:inXSDDateTimeStamp ?msgtimestamp . }}",
			"forcedBindings": {
				"usergraph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/my2sec/defuser@vaimee.it>"
				},
				"source": {
					"type": "uri",
					"value": "<http://www.vaimee.it/sources/aw-watcher-window>"
				},
				"msgtimestamp": {
					"type": "literal",
					"value": "2022-08-10T15:33:42.503000+00:00"
				},
				"msgvalue": {
					"type": "literal",
					"value": "{json_msg}"
				}
			}
		},	

		"DELETE_MESSAGE":{
			"sparql":"DELETE { GRAPH ?usergraph { ?bnode sw:messageValue ?jsonmsg; sw:messageSource ?source; time:inXSDDateTimeStamp ?msgtimestamp . }} WHERE { GRAPH ?usergraph { ?bnode sw:messageValue ?jsonmsg;  time:inXSDDateTimeStamp ?msgtimestamp . } }",
			"forcedBindings": {
				"usergraph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/my2sec/defuser@vaimee.it>"
				},
				"source": {
					"type": "uri",
					"value": "<http://www.vaimee.it/sources/aw-watcher-window>"
				},
				"msgtimestamp": {
					"type": "literal",
					"value": "2022-08-10T15:33:42.503000+00:00"
				}
			}
		},	



		"ADD_EVENT_MAPPING": {
			"sparql": "INSERT DATA { GRAPH <http://www.vaimee.it/my2sec/configuration> { _:mapping rdf:type sw:Mapping ; sw:eventType ?event_type ; sw:messageSource ?source }}",
			"forcedBindings": {
				"source": {
					"type": "uri",
					"value": "http://www.vaimee.it/sources/aw-watcher-window"
				},
				"event_type": {
					"type": "uri",
					"value": "sw:ActivityWatchEvent"
				}
			}
		},

		"DELETE_ALL_EVENTS_MAPPINGS": {
			"sparql": "DELETE { GRAPH <http://www.vaimee.it/my2sec/configuration> { ?s ?p ?o }} WHERE { GRAPH <http://www.vaimee.it/my2sec/configuration> { ?s ?p ?o } }"
		},

	

		"ADD_EVENT":{
			"sparql":"INSERT { GRAPH ?usergraph { _:b rdf:type sw:Event; sw:eventType ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp ; sw:activityType ?activity_type; opo:taskTitle ?task }} WHERE {}",
			"forcedBindings": {
				"usergraph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/defuser>"
				},
				"event_type": {
					"type": "uri",
					"value": "sw:windowEvent"
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
					"value": "sw:developement"
				},
				"task": {
					"type": "literal",
					"value": "WP2-IMPLEMENTAZIONE COMPONENTI"
				}
			}
		}


	},
	"queries": {

		"ALL_USERNAMES": {
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/members> { ?s opo:username ?o }}"
		},
		"ALL_USERS_MESSAGES":{
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/members> {?user_graph opo:username ?username_literal} GRAPH ?user_graph {?bnode_label sw:messageValue ?json_message ; sw:messageSource ?source ;time:inXSDDateTimeStamp ?message_timestamp }}",
			"forcedBindings": {
				"source": {
					"type": "uri",
					"value": "<http://www.vaimee.it/sources/aw-watcher-window>"
				}
			}		
		},		



		"ALL_USER_DATA": {
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it> { ?s ?p ?o } }"
		},

		"USER_EVENTS": {
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it> { ?nodeid rdf:type sw:Event; sw:eventType ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?timestamp; sw:activityType ?activity_type; opo:taskTitle ?task  } }"
		},


		"ALL_EVENTS_MAPPINGS": {
			"sparql": "SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/configuration> { _:mapping rdf:type sw:Mapping ; sw:eventType ?event_type ; sw:messageSource ?source }}",
			"forcedBindings": {
				"source": {
					"type": "uri",
					"value": "<http://www.vaimee.it/sources/aw-watcher-window>"
				}
			}
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
