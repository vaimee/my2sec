async function createDashboard(dash_id,superset_host,container_id){
    var embed= await supersetEmbeddedSdk.embedDashboard({
		id: dash_id, // given by the Superset embedding UI
		supersetDomain: superset_host,
		mountPoint: document.getElementById(container_id), // any html element that can contain an iframe
		fetchGuestToken: () => fetchGuestTokenFromBackend(superset_host,dash_id),
		dashboardUiConfig: { hideTitle: true }, // dashboard UI config: hideTitle, hideTab, hideChartControls (optional)
	});
    return embed;
}






async function fetchGuestTokenFromBackend(superset_host,dash_id){
	var login_token_string=await fetchAccessTokenFromBackend(superset_host);
	var login_token_json=JSON.parse(login_token_string)
	var access_token=login_token_json.access_token

	consoleLog(1,access_token)

	return new Promise(resolve=>{

		var req = new XMLHttpRequest();
		var reqtext=superset_host+"/api/v1/security/guest_token/"
		var body={
			"resources": [
				{
					"id":dash_id,
					"type":"dashboard"
				}
			],
			"rls":[

			],
			"user": {
				"first_name":"Superset",
				"last_name":"Admin",
				"username":"admin"
			}
		};
		body=JSON.stringify(body);
		
		req.open("POST", reqtext, true);

		//Send the proper header information along with the request
		req.setRequestHeader("Content-Type", "application/json");
		req.setRequestHeader("accept", "application/json");
		req.setRequestHeader('Authorization', 'Bearer ' + access_token);
		req.onreadystatechange = function() {// Call a function when the state changes.
			if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
				// Request finished. Do processing here.
				consoleLog(1,"status "+this.status)
				//consoleLog(1,req.responseText)
				var tmp=JSON.parse(req.responseText)

				resolve(tmp.token)
				//resolve(req.responseText)
			}
		}
		//bodystring="{ \"timestamp\": \"2022-07-12T16:47:46.060Z\", \"duration\": 0, \"data\": {\"last_update\":\""+get_time()+"\"} }"
		req.send(body);

	})
}


function fetchAccessTokenFromBackend(superset_host){
	return new Promise(resolve=>{

		var req = new XMLHttpRequest();
		var reqtext=superset_host+"/api/v1/security/login"
		var body='{\"password\":\"admin\",\"provider\":\"db\",\"refresh\":true,\"username\":\"admin\"}';
		req.open("POST", reqtext, true);

		//Send the proper header information along with the request
		req.setRequestHeader("Content-Type", "application/json");
		req.setRequestHeader("accept", "application/json");
		req.onreadystatechange = function() {// Call a function when the state changes.
			if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
				// Request finished. Do processing here.
				consoleLog(1,"status "+this.status)
				//consoleLog(1,req.responseText)
				resolve(req.responseText)
			}
		}
		//bodystring="{ \"timestamp\": \"2022-07-12T16:47:46.060Z\", \"duration\": 0, \"data\": {\"last_update\":\""+get_time()+"\"} }"
		req.send(body);

	})
}