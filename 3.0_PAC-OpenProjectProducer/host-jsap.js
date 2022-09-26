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

    namespaces: {
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

    updates: {

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
		}


    }


}