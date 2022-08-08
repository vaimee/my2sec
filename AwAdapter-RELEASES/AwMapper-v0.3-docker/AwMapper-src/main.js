/*=========================================\\
||	NAME: main.js of ACTIVITY WATCH MAPPER
||  DATE: 27/7/2022
||  AUTHOR: Gregorio Monari
||	DESCRIPTION: maps a json message into
||  			 semantic events
\\=========================================*/
const g=require("./greglogs.js")//logging
const SEPA = require('@arces-wot/sepa-js').SEPA//client
require("./jsap.js")//access global variable jsap
require("./mappings.js")//access global variable mappings

console.log("//=========\\\\")
console.log("# AW MAPPER #")
console.log("\\\\=========//")



//INITIALIZE SEPA CLIENT
let client = new SEPA(jsap)
g.consoleLog(1,"sepa client initialized!")

//SUBSCRIBE TO MESSAGES
g.consoleLog(1,"subscribing to "+jsap.host+":")


//const sub = client.subscribe("select * where { graph <http://www.vaimee.it/members> {?g <http://www.vaimee.it/ontology/opo#username> ?o} graph ?g {?s <http://www.vaimee.it/ontology/sw#messageValue> ?message }} ")
//const sub = client.subscribe("select * where { ?g ?p ?o} ")
const sub = client.subscribe("select * where { graph <http://www.vaimee.it/members> {?g <http://www.vaimee.it/ontology/opo#username> ?o} graph ?g {?s <http://www.vaimee.it/ontology/sw#messageValue> ?message ; <http://www.w3.org/2006/time#inXSDDateTimeStamp> ?msgtimestamp }} ")

//[0]ON SUBSCRIBE
sub.on("subscribed",console.log)
//g.consoleLog(1,"#### LISTENING TO NOTIFICATIONS ###\n")
//[1]ON NOTIFICATION
sub.on("notification", not => {
  	g.consoleLog(1,"RECEIVED NOTIFICATION!");
	g.consoleLog(0,JSON.stringify(not, null, 2));
	map_message(not);
	//sub.unsubscribe()
})
//[2]ON ERROR
sub.on("error",console.error)



//MAPPA MESSAGGI
async function map_message(msg){
	g.consoleLog(1,"extracting bindings...")
	var bindings=extract_bindings(msg)
	g.consoleLog(1,"reading ["+bindings.length+ "] messages from sparql bindings")

	//CYCLE THE BINDINGS CONTAINING THE EVENTS ARRAYS
	//EVERY CYCLE IS SINGLE: bnode hasvalue "message"
	//AT THE END OF EVERY CYCLE THE MESSAGE HAS TO BE DELETED
	var raw_json,replaced_raw_json,events_json;
	for (var i = 0; i < bindings.length; i++) {
		console.log("\n---------------------------------------------------------");
		g.consoleLog(1,"### MESSAGE "+i+" ###");
		//extract events array from bindings
		g.consoleLog(0,bindings[i].message.value)
		try{
			raw_json=bindings[i].message.value;
			replaced_raw_json=raw_json.replace(/\\/g,"\\\\");
			events_json=JSON.parse(replaced_raw_json);
			//var events_json=events_json.replace(/\\/g,"\\\\");
			//events_json=JSON.parse(bindings[i].message.value);

			var graph=bindings[i].g.value;
			var msgtimestamp=bindings[i].msgtimestamp.value;
			//var msg_to_delete=bindings[i].s.value;
		
			//CYCLE THE EVENTS ARRAY
			for(var j=0;j<events_json.length;j++){
				if (events_json[j].hasOwnProperty("data")){
					g.consoleLog(1,"  FOUND DATA in event ["+j+"]")

					//EXTRACT DATA
					var event_id=events_json[j].id;
					var timestamp=events_json[j].timestamp;
					var data=events_json[j].data;

					//g.consoleLog(0,data);

					//CYCLE PROPERTIES, HERE IS WHERE THE MAGIC HAPPENS
					var counter=0;
					var found_mappings=0;
					var event_triples=[];
					for(key in data){
						g.consoleLog(0,"    ANALIZING KEY: "+key+": "+data[key]);

					
						for (topic in mappings){
						//SE TROVO UN TOPIC CORRISPONDENTE ALLA PROPRIETA', ALLORA DEVO MAPPARLA
							if (key==topic){
								//var mapping_subject="_:b";
								var mapping_predicate=mappings[topic];
								var mapping_object="'''"+data[key].replace(/\\/g,"\\\\")+"'''";
								//CONCATENA STRINGA
								event_triples[counter]=mapping_predicate+" "+mapping_object
								found_mappings=found_mappings+1;
    							break;
							}
						
						}


						counter=counter+1;
					}

					if(found_mappings!=0){
						g.consoleLog(1,"  MAPPED EVENT!!!")
						g.consoleLog(0,"  finished, ready to do the update")
						var sparql_update=construct_sparql_update(event_triples,timestamp,graph);
						g.consoleLog(0,sparql_update)
						//UPDATE SEPA
    					await update_event(sparql_update);
    			
					}else{

					}



				}//end of if

			}//end of for

		}catch(e){
			console.log(e)
		}
    //CANCELLA MESSAGE
    g.consoleLog(1,"deleting message...")
    var sparql_delete=construct_sparql_delete(graph,msgtimestamp); //(msg_to_delete,bindings[i].message.value,graph)
	g.consoleLog(0,sparql_delete)				
    await delete_msg(sparql_delete);
	//console.log("---------------------------------------------------------\n");
	}//end of for

}


//extracts a json object containing the sparql results bindings  
function extract_bindings(msg){
	var bindings=msg.addedResults.results.bindings;
	return bindings;
}

//DELETE MESSAGE
function delete_msg(sparql_delete){
	return new Promise(resolve=>{
		client.update(sparql_delete)
    		.then(()=>{
    			console.log("Deleted");
    			resolve("deleted");
    		})
	});
}

function construct_sparql_delete(graph,msgtimestamp){
	//var sparql_delete="delete {<"+msg_to_delete+"> <http://www.vaimee.it/ontology/sw#messageValue> ?o}where{ graph <"+graph+"> {<"+msg_to_delete+"> <http://www.vaimee.it/ontology/sw#messageValue> ?o} }";
	//var sparql_delete="with <"+graph+"> delete {?s <http://www.vaimee.it/ontology/sw#messageValue> '''"+object+"''' }where{ ?s <http://www.vaimee.it/ontology/sw#messageValue> '''"+object+"''' }";
	var sparql_delete="delete { graph <"+graph+"> { ?bnode <http://www.vaimee.it/ontology/sw#messageValue> ?jsonmsg;  <http://www.w3.org/2006/time#inXSDDateTimeStamp> '''"+msgtimestamp+"''' . }} where { graph <"+graph+"> { ?bnode <http://www.vaimee.it/ontology/sw#messageValue> ?jsonmsg;  <http://www.w3.org/2006/time#inXSDDateTimeStamp> '''"+msgtimestamp+"''' . } }"

	return sparql_delete;
}


//UPDATE EVENT
function update_event(sparql_update){
	return new Promise(resolve=>{
		client.update(sparql_update)
    		.then(()=>{
    			console.log("Updated");
    			resolve("updated");
    		})
	});
}

function construct_sparql_update(event_triples,timestamp,graph){
	//AGGIUNGI TIMESTAMP
	var sparql_update="";
	sparql_update=sparql_update + "_:b <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.vaimee.it/ontology/sw#event> ; ";
	sparql_update=sparql_update + "<http://www.w3.org/2006/time#inXSDDateTimeStamp> "+"'''"+timestamp+"'''"+" ; ";
	//AGGIUNGI LE PROPRIETA' DELL'EVENTO
	for (var i = 0; i < event_triples.length-1; i++) {
		sparql_update=sparql_update+event_triples[i]+" ; "
	}
	sparql_update=sparql_update+event_triples[i]+" . "
	//WRAPPA NELLA QUERY
	sparql_update="insert data { graph <"+graph+"> { "+sparql_update+"}}"
	//RESTITUISCI LA QUERY
	return sparql_update;
}



function construct_sparql_delete_update(){

}
