/*---------------------------------------------------------\
|| sepa-client.js: SEPA CLIENT METHODS
|| 	DATE: 9/8/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: a collection of methods used to 
||     communicate with a sepa engine
\\--------------------------------------------------------*/
console.log("-> Loaded external script: sepa_client.js")

//GLOBAL VARIABLES
let client; //GLOBAL OBJECT FOR THE SEPA CLIENT
//jsap; //E' DIVENTATA GLOBALE

init_sepa_client()


var jsap;
function init_sepa_client(){

	consoleLog(1,"sepaclient: parsed jsap (SEPAclient configuration file)")
	consoleLog(0,JSON.stringify(jsap))
	const SEPA = Sepajs.SEPA
	client= new SEPA(jsap)
	consoleLog(1,"sepaclient: Sepajs client created!")
}


//SEND MESSAGE TO SEPA
function update_sepa_message(jsonMessage,watcher_client,watcher_hostname){
	//var string="insert {<http://dld.arces.unibo.it/ontology/greg/messaggion"+String(counter)+"> <valore> '''"+JSON.stringify(jsonMessage)+"'''} where{}"
	var string="insert { _:b <hasValue> '''"+JSON.stringify(jsonMessage)+"'''; <hasClient> '''"+watcher_client+"'''; <hasHost> '''"+watcher_hostname+"'''} where{}"
	consoleLog(0,string)
	client.update(string)
	.then(()=>{
		consoleLog(1,"update_sepa_message: "+watcher_client +" EVENTS UPLOADED CORRECTLY!")
	});

}


function update_user_sepa_message(jsonMessage,watcher_client,username){
	//var string="insert {<http://dld.arces.unibo.it/ontology/greg/messaggion"+String(counter)+"> <valore> '''"+JSON.stringify(jsonMessage)+"'''} where{}"
	return new Promise(resolve=>{
		var string="insert { graph <http://www.vaimee.it/"+username+"> {_:b <http://www.vaimee.it/ontology/sw#messageValue> '''"+jsonMessage+"'''}} where{}"
		consoleLog(0,string)
		client.update(string)
		.then(()=>{
			consoleLog(1,"update_sepa_message: "+watcher_client +" EVENTS UPLOADED CORRECTLY!")
			resolve("updated");
			
		});
	});

}


function update_user_timed_sepa_message(jsonMessage,watcher_client,username,timestamp){
	//var string="insert {<http://dld.arces.unibo.it/ontology/greg/messaggion"+String(counter)+"> <valore> '''"+JSON.stringify(jsonMessage)+"'''} where{}"
	return new Promise(resolve=>{
		var string="insert { graph <http://www.vaimee.it/my2sec/"+username+"> {_:b <http://www.vaimee.it/ontology/sw#messageValue> '''"+jsonMessage+"''' ; <http://www.vaimee.it/ontology/sw#messageSource> <http://www.vaimee.it/sources/"+watcher_client+"> ; <http://www.w3.org/2006/time#inXSDDateTimeStamp> '''"+timestamp+"'''}} where{}"
		consoleLog(0,string)
		client.update(string)
		.then(()=>{
			consoleLog(1,"update_sepa_message: "+watcher_client +" EVENTS UPLOADED CORRECTLY!")
			resolve("updated");
			
		});
	});

}




function sub_events_count(username){

	consoleLog(1,"SUBSCRIBING TO MAPPINGS")

	var counter_el=document.getElementById("sub_counter");

	var NOTIFICATIONS_COUNT=0;

	const sub = client.subscribe("select (COUNT(?nodeid) AS ?nevents) where { graph <http://www.vaimee.it/my2sec/"+username+"> {?nodeid <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.vaimee.it/ontology/sw#Event> }} ")
	//const sub = client.subscribe("select (COUNT(?s) AS ?ntriples) where { graph <http://www.vaimee.it/"+username+"> {?s ?p ?o }} ")
	//const sub = client.subscribe("select * where { graph <http://www.vaimee.it/"+username+"> {?s ?p ?o }} ")
	//const sub = client.subscribe("select * where { ?g ?p ?o} ")
	
	//[0]ON SUBSCRIBE
	sub.on("subscribed",console.log)
	//g.consoleLog(1,"#### LISTENING TO NOTIFICATIONS ###\n")
	//[1]ON NOTIFICATION
	sub.on("notification", not => {
		consoleLog(1,"RECEIVED NOTIFICATION!");
		//consoleLog(0,JSON.stringify(not, null, 2));

		var bindings=extract_bindings(not);
		counter_el.innerHTML=bindings[0].nevents.value;

		//sub.unsubscribe()
		//NOTIFICATIONS_COUNT=NOTIFICATIONS_COUNT+1;
		//counter_el.textContent=NOTIFICATIONS_COUNT;
	})
	//[2]ON ERROR
	sub.on("error",console.error)	
}


var sepa_cbox=document.getElementById("sepa_connectionstatus_wrapper");
function echo_sepa(){
	return new Promise(resolve=>{



			client.query("select ?time where {<http://sepatest/currentTime> <http://sepatest/hasValue> ?time}")
			.then((data)=>{
				console.log("RECEIVED DATA");
				sepa_cbox.innerHTML="Connected to SEPA ("+jsap.host  /*+":"+jsap.sparql11protocol.port*/  +"<img class='white-icon' src='Assets/icons/wifi.svg'>)"
				
				resolve(data);
				document.getElementById("row-2").style.display="flex";
			});




	});	
}




function sepa_getUserName(userMail){
	return new Promise(resolve=>{
			client.query("select ?username where { graph <http://www.vaimee.it/my2sec/members> { <http://www.vaimee.it/my2sec/"+userMail+"> <http://www.vaimee.it/ontology/opo#username> ?username }}")
			.then((data)=>{
				//console.log("");
				var bindings=extract_query_bindings(data);
				var userName=bindings[0].username.value;
				resolve(userName);
			});

	});	
}



function sepa_getUserDashboard(userMail){
	return new Promise(resolve=>{
			client.query("select ?dash_id where { graph <http://www.vaimee.it/my2sec/dashboards> { <http://www.vaimee.it/my2sec/"+userMail+"> <http://www.vaimee.it/my2sec/superset/dashID> ?dash_id;  }}")
			.then((data)=>{
				//console.log("");
				var bindings=extract_query_bindings(data);

				if(bindings.length!=0){
					var dash_id=bindings[0].dash_id.value;
					console.log(dash_id)
				}else{
					dash_id="";
				}


				resolve(dash_id);
			});
	});	
}




function extract_bindings(msg){
	var bindings=msg.addedResults.results.bindings;
	return bindings;
}

function extract_query_bindings(msg){
	var bindings=msg.results.bindings;
	return bindings;
}
