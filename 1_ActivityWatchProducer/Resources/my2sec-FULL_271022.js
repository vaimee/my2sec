default_jsap={
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


		"CREATE_USERNAMES_GRAPH":{
			"sparql": "CREATE GRAPH <http://www.vaimee.it/my2sec/members>"
		},
		"DROP_USERNAMES_GRAPH":{
			"sparql":"DROP GRAPH <http://www.vaimee.it/my2sec/members>"
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
		},
		"REMOVE_USER":{
			"sparql":"DELETE {?s ?p ?o} WHERE { GRAPH <http://www.vaimee.it/my2sec/members> { <http://www.vaimee.it/my2sec/defuser@vaimee.it> ?p ?o }}"
		},
		"DELETE_USER_PRIVATE_GRAPH":{
			"sparql":"DROP GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it>"
		},
		"DELETE_ALL_USER_DATA":{
			"sparql":"DELETE {?s ?p ?o} WHERE { GRAPH ?usergraph { ?s ?p ?o }}",
			"forcedBindings": {
				"usergraph": {
					"type": "uri",
					"value": "http://www.vaimee.it/my2sec/defuser@vaimee.it"
				}
			}
		},








		"SEND_MESSAGE":{
			"sparql":"INSERT DATA { GRAPH ?message_graph { _:b sw:messageUser ?usergraph ;sw:messageValue ?msgvalue; sw:messageSource ?source ;  time:inXSDDateTimeStamp ?msgtimestamp . }}",
			"forcedBindings": {
				"message_graph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/my2sec/messages/activitywatch>"
				},
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
			"sparql":"DELETE { GRAPH ?message_graph { ?bnode sw:messageUser ?usergraph; sw:messageValue ?jsonmsg; sw:messageSource ?source; time:inXSDDateTimeStamp ?msgtimestamp . }} WHERE { GRAPH ?message_graph { ?bnode sw:messageUser ?usergraph; sw:messageValue ?jsonmsg;  time:inXSDDateTimeStamp ?msgtimestamp . } }",
			"forcedBindings": {
				"message_graph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/my2sec/messages/activitywatch>"
				},
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






		"ADD_EVENT_OLD":{
			"sparql":"WITH ?usergraph DELETE { ?bnodeid rdf:type sw:Event; sw:eventType ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp ; sw:activityType ?activity_type; opo:taskTitle ?task } INSERT { _:b rdf:type sw:Event; sw:eventType ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp ; sw:activityType ?activity_type; opo:taskTitle ?task } WHERE { OPTIONAL {?bnodeid rdf:type sw:Event; sw:eventType ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp ; sw:activityType ?activity_type; opo:taskTitle ?task} }",
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



		"SEND_OP_MESSAGE":{
			"sparql":"INSERT DATA { GRAPH ?usergraph { _:b opo:messageValue ?msgvalue; opo:messageSource ?source ;  time:inXSDDateTimeStamp ?msgtimestamp . }}",
			"forcedBindings": {
				"usergraph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/my2sec/admin@vaimee.it>"
				},
				"source": {
					"type": "uri",
					"value": "<http://www.vaimee.it/sources/open-project>"
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






		"CREATE_PROJECTS_GRAPH":{
			"sparql":"CREATE GRAPH <http://www.vaimee.it/projects#>"
		},
		"UPDATE_PROJECT":{
			"sparql":"WITH <http://www.vaimee.it/projects#> DELETE { ?projecturi rdf:type opo:project; opo:projectId ?del_project_id; opo:projectIdentifier ?del_project_identifier } INSERT { ?projecturi rdf:type opo:project; opo:projectId ?projectid; opo:projectIdentifier ?project_identifier } WHERE { OPTIONAL { ?projecturi rdf:type opo:project; opo:projectId ?del_project_id; opo:projectIdentifier ?del_project_identifier}}",
			"forcedBindings": {
				"projecturi": {
					"type": "uri",
					"value": "http://www.vaimee.it/projects#demo-project"
				},
				"projectid": {
					"type": "literal",
					"value": 1,
					"datatype": "xsd:integer"
				},
				"project_identifier": {
					"type": "literal",
					"value": "Demo Project"
				}
			}
		},
		"UPDATE_TASK":{
			"sparql":"WITH ?graph DELETE { ?old_bnode rdf:type opo:task; opo:hasProject ?old_project; opo:taskId ?task_id; opo:taskTitle ?old_task_title ; opo:Member ?old_member; opo:spentTime ?old_timenode .     ?old_timenode rdf:type opo:hour; rdf:value ?old_value . } INSERT { _:bnode rdf:type opo:task; opo:hasProject ?projecturi; opo:taskId ?task_id; opo:taskTitle ?task_title; opo:Member ?assignee; opo:spentTime _:timenode .       _:timenode rdf:type opo:hour; rdf:value ?spent_time } WHERE { OPTIONAL { ?old_bnode rdf:type opo:task; opo:hasProject ?old_project; opo:taskId ?task_id; opo:taskTitle ?old_task_title ; opo:Member ?old_member; opo:spentTime ?old_timenode .     ?old_timenode rdf:type opo:hour; rdf:value ?old_value . }}",
			"forcedBindings": {
				"graph": {
					"type": "uri",
					"value": "http://www.vaimee.it/projects#"
				},				
				"projecturi": {
					"type": "uri",
					"value": "http://www.vaimee.it/projects#demo-project"
				},
				"task_id": {
					"type": "literal",
					"value": 1,
					"datatype": "xsd:integer"
				},
				"task_title": {
					"type": "literal",
					"value": "micioneinfinito"
				},
				"assignee": {
					"type": "uri",
					"value": "http://www.vaimee.it/members/gregorio.monari@gmail.com"
				},
				"spent_time": {
					"type": "literal",
					"value": "15.50",
					"datatype": "xsd:decimal"
				}
			}
		}		



	},
	"queries": {

		"ALL_USERNAMES": {
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/members> { ?s opo:username ?o }}"
		},

		"ALL_USER_DATA": {
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it> { ?s ?p ?o } }"
		},
		"USER_EVENTS": {
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it> { ?nodeid rdf:type sw:Event; rdf:type ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?timestamp; sw:activityType ?activity_type; opo:taskTitle ?task; sw:hasTimeInterval ?duration . FILTER (?event_type != sw:Event)  } }"
		},
		"USER_EVENTS_COUNT": {
			"sparql":"SELECT (COUNT(?nodeid) AS ?nevents) WHERE { GRAPH ?usergraph { ?nodeid rdf:type sw:Event }}",
			"forcedBindings": {
				"usergraph": {
					"type": "uri",
					"value": "http://www.vaimee.it/my2sec/defuser@vaimee.it"
				}
			}
		},





		"ALL_USERS_MESSAGES":{
			"sparql":"SELECT * WHERE { GRAPH ?message_graph {?bnode_label sw:messageUser ?usergraph; sw:messageValue ?json_message ; sw:messageSource ?source ;time:inXSDDateTimeStamp ?message_timestamp }}",
			"forcedBindings": {
				"message_graph": {
					"type": "uri",
					"value": "<http://www.vaimee.it/my2sec/messages/activitywatch>"
				},
				"source": {
					"type": "uri",
					"value": "<http://www.vaimee.it/sources/aw-watcher-window>"
				}
			}		
		},





		"ALL_USERS_EVENTS_OLD":{
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/members> {?user_graph opo:username ?username_literal} GRAPH ?user_graph {?nodeid rdf:type sw:Event; sw:eventType ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp; sw:activityType ?activity_type; opo:taskTitle ?task}}"	
		},

		"ALL_USERS_EVENTS":{
			"sparql":"SELECT * WHERE { GRAPH <http://www.vaimee.it/my2sec/members> {?user_graph opo:username ?username_literal} GRAPH ?user_graph {?nodeid rdf:type sw:Event; rdf:type ?event_type; sw:nameApp ?app; sw:titleFile ?title; time:inXSDDateTimeStamp ?datetimestamp; sw:activityType ?activity_type; sw:hasTimeInterval ?duration . OPTIONAL { ?nodeid opo:taskTitle ?task} FILTER (?event_type != sw:Event)   }}"	
		},



		"ALL_OP_MESSAGES":{
			"sparql":"SELECT * WHERE{ GRAPH ?usergraph { _:b opo:messageValue ?msgvalue; opo:messageSource ?source ;  time:inXSDDateTimeStamp ?msgtimestamp . }}",
			"forcedBindings": {
				"usergraph": {
					"type": "uri",
					"value": "http://www.vaimee.it/my2sec/admin@vaimee.it"
				},
				"source": {
					"type": "uri",
					"value": "http://www.vaimee.it/sources/open-project"
				}
			}
		},
		"ALL_PROJECTS":{
			"sparql":"SELECT * WHERE {GRAPH <http://www.vaimee.it/projects#> { ?projecturi rdf:type opo:project; opo:projectId ?project_id; opo:projectIdentifier ?project_identifier } }"
		},
		"ALL_OP_TASKS":{
			"sparql":"SELECT * WHERE {GRAPH <http://www.vaimee.it/projects#> { ?bnode rdf:type opo:task; opo:hasProject ?progetto; opo:taskId ?taskid; opo:taskTitle ?tasktitle; opo:Member ?assignee; opo:spentTime ?timenode .    ?timenode rdf:type opo:hour; rdf:value ?spentTimeValue . OPTIONAL {opo:hour rdf:type ?tipo .} }}"
		},
		"USER_TASKS":{
			"sparql":"SELECT * WHERE {GRAPH <http://www.vaimee.it/projects#> { ?bnode rdf:type opo:task; opo:hasProject ?progetto; opo:taskId ?taskid; opo:taskTitle ?tasktitle; opo:Member ?assignee; opo:spentTime ?timenode .    ?timenode rdf:type opo:hour; rdf:value ?spentTimeValue . OPTIONAL {opo:hour rdf:type ?tipo .} }}",
			"forcedBindings": {
				"assignee": {
					"type": "uri",
					"value": "http://www.vaimee.it/my2sec/admin@vaimee.it"
				}
			}
		}


	}
}