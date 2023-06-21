jsappe={
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
	"extended": {
		
	},
	"updates": {
        "BINDINGS_TEST":{
			"sparql":"INSERT DATA{ GRAPH <http://www.vaimee.it/testing/multiple_bindings> {_:bnode <http://sepatest/hasValue> ?o}}",
			"forcedBindings": {
				"o": {
					"type": "literal",
					"value": "example"
				}
			}	            
        },
		"MIXED_BINDINGS":{
			"sparql":"INSERT DATA{ GRAPH ?graph {_:bnode <http://sepatest/hasValue> ?value ; <http://sepatest/hasColor> ?color }}",
			"forcedBindings": {
				"graph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/testing/multiple_bindings>"					
				},
				"value": {
					"type": "literal",
					"value": "mao"
				},
				"color": {
					"type": "literal",
					"value": "red"
				}
			}	            
        },
		"ADD_EVENT":{
			"sparql":"WITH ?usergraph DELETE { ?bnodeid rdf:type sw:Event; rdf:type ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp ; sw:activityType ?activity_type; opo:taskTitle ?task; sw:hasTimeInterval ?duration } INSERT { _:b rdf:type sw:Event; rdf:type ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp ; sw:activityType ?activity_type; opo:taskTitle ?task; sw:hasTimeInterval ?duration } WHERE { OPTIONAL {?bnodeid rdf:type sw:Event; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp ; sw:activityType ?activity_type; opo:taskTitle ?task; sw:hasTimeInterval ?duration} }",
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
				},
				"duration": {
					"type": "literal",
					"value": "16.0"
				}
			}
		},
		"simpleUpdate":{
			"sparql":"INSERT DATA{ GRAPH ?graph {_:bnode <http://sepatest/hasValue> ?o}}",
			"forcedBindings": {
				"graph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/testing/multiple_bindings>"
				},
				"o": {
					"type": "literal",
					"value": "example"
				}
			}	            
        }
    },
	"queries": {
        "VALUES_TEST":{
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/testing/multiple_bindings> {?s ?p ?o}}",
			"forcedBindings": {
				"p": {
					"type": "uri",
					"value": "<http://sepatest/hasValue>"
				}
			}		
		},
		"ALL_GRAPH_DATA":{
			"sparql":"SELECT * WHERE { GRAPH ?graph { ?s ?p ?o } }",
			"forcedBindings":{
				"graph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/testing/multiple_bindings>"
				}
			}
		}
    }
}
