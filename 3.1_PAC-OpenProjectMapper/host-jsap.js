jsap={
	"host": "localhost",
	"oauth": {
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



    "updates": {

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

		"OLD_UPDATE_TASK":{
			"sparql":"WITH <http://www.vaimee.it/projects#> DELETE { ?tasknode rdf:type opo:task; opo:hasProject ?del_projecturi; opo:taskId ?task_id; opo:taskTitle ?del_task_title; opo:Member ?del_assignee; opo:spentTime ?timenode .    ?timenode rdf:type opo:hour; rdf:value ?del_spent_time .  } INSERT { _:b rdf:type opo:task; opo:hasProject ?projecturi; opo:taskId ?task_id; opo:taskTitle ?task_title; opo:Member ?assignee; opo:spentTime _:bnode .    _:bnode rdf:type opo:hour; rdf:value ?spent_time . } WHERE { OPTIONAL { ?tasknode rdf:type opo:task ; opo:hasProject ?projecturi; opo:taskId ?task_id ; opo:spentTime ?timenode}}",
			"forcedBindings": {
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