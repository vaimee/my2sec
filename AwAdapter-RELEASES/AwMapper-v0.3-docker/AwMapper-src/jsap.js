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
		"reconnect" : true,
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
