jsap={
    "host": "localhost",
    "oauth": {
        "enable": false,
        "register": "https://localhost:8443/oauth/register",
        "tokenRequest": "https://localhost:8443/oauth/token"
    },
    "sparql11protocol": {
        "protocol": "http",
        "port": 8666,
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
                "port": 9666,
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
    "extended": {},
    "updates": {
        "SEND_KEYCLOAK_MESSAGE":{
			"sparql":"WITH ?graph INSERT { _:b sw:messageValue ?msgvalue; sw:messageSource ?source ;  time:inXSDDateTimeStamp ?msgtimestamp . } WHERE {}",
			"forcedBindings": {
                "graph": {
                    "type": "uri",
                    "value": "<http://www.vaimee.it/my2sec/members>"
                },
				"source": {
					"type": "uri",
					"value": "<http://www.vaimee.it/sources/keycloak>"
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

        "DELETE_ALL_DB":{
            "sparql":"DELETE {?s ?p ?o}WHERE{?s ?p ?o}"
        },

        "ADD_USER":{
			"sparql":"INSERT DATA { GRAPH <http://www.vaimee.it/my2sec/members> { ?usergraph opo:username ?username_literal }}",
			"forcedBindings": {
				"usergraph": {
					"type": "uri",
					"value": "http://www.vaimee.it/my2sec/defuser@vaimee.it"
				},
				"username_literal": {
					"type": "literal",
					"value": "defuser"
				}
			}
		},
		"CREATE_USER_PRIVATE_GRAPH":{
			"sparql":"CREATE GRAPH ?usergraph",
			"forcedBindings": {
				"usergraph": {
					"type": "uri",
					"value": "http://www.vaimee.it/my2sec/defuser@vaimee.it"
				}
			}
		}

    },
    "queries": {
        "QUERY_ALL_DB":{
            "sparql":"SELECT * WHERE {?s ?p ?o}"
        },
        "allGraphMessages":{
			"sparql":"SELECT * WHERE{GRAPH ?graph {?bnode_label sw:messageValue ?json_message ; sw:messageSource ?source . OPTIONAL {?bnode_label time:inXSDDateTimeStamp ?message_timestamp} . }}",
			"forcedBindings": {
				"graph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/my2sec/members>"
				},
				"source": {
					"type": "uri",
					"value": "<http://www.vaimee.it/sources/keycloak>"
				}
			}		
		},
        "ALL_USERNAMES": {
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/members> { ?s opo:username ?o }}"
		},
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
