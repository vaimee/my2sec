//=====================================
//MYSQL CONSUMER - NODE VERSION V0.1
//A Prototype By Gregorio Monari
//=====================================
require("./jsapV2.js")
require("./mysql-dev4j")
const JsapApi = require('@arces-wot/sepa-js').Jsap//jsap api
var mysql= require('mysql');
const g=require("./greglogs.js");

console.log("####################################")
console.log("### MY2SEC - MYSQL CONSUMER v0.1 ###")
console.log("####################################")

app= new JsapApi(jsap);
g.consoleLog(1,"Jsap App initialized!");


//TRY TO CONNECT TO MYSQL DATABASE
var con = mysql.createConnection({
  host: mysql_host,
  port: mysql_port,
  user: mysql_user,
  password: mysql_pw,
  database: mysql_db
});


//CONNECT TO DB AND SEPA
con.connect(function(err) {
	if (err) throw err;
	g.consoleLog(1,"Connected to MYSQL DB!");
	
	//SUBSCRIBE TO ALL EVENTS OF MY2SEC
	let sub2all_events = app.ALL_USERS_EVENTS({});
	g.consoleLog(1,"SUBSCRIBED 2 EVENTS!")
	//ON NOTIFICATION...
	sub2all_events.on("notification",notification=>{
		g.consoleLog(1,"### NEW EVENTS RECEIVED ###")
		process_events(notification);
		g.consoleLog(1,"### All EVENTS have been processed ###")
	});

});



async function process_events(notification){

	var bindings=get_AddedResults(notification)
	g.consoleLog(1,"Trying to process "+bindings.length+" events")

	for(binding in bindings){
		
		await add_event_to_table(bindings[binding])
		
	}	
}



function add_event_to_table(binding){
	return new Promise(resolve=>{


	//TABLE NAME
	var table_name=binding.username_literal.value;
	//TABLE FIELDS
	var timestamp=binding.datetimestamp.value;
	var event_type=binding.event_type.value;
	var app_name=binding.app.value;
	var app_title=binding.title.value.replace(/\'/g,"\\\'");//POI GLI ASTERISCHI;
	var activity_type=binding.activity_type.value;
	var task=binding.task.value;
	var duration=binding.duration.value;
	if(duration=="" || duration==null || duration==undefined || duration=="none"){
		duration=0.0;
	}
	
	//1-CREATE MYSQL TABLE FOR USER
	g.consoleLog(1,"Trying to create table for "+table_name)
	//var sql = "CREATE TABLE "+table_name+" (datetime DATETIME(6), event_type VARCHAR(255), app_name VARCHAR(255), app_title VARCHAR(255), activity_type VARCHAR(255), task VARCHAR(255))";
	var sql = "CREATE TABLE "+table_name+" (datetime DATETIME(6), event_type VARCHAR(255), app_name VARCHAR(255), app_title VARCHAR(255), activity_type VARCHAR(255), task VARCHAR(255), duration DOUBLE )";
	try{
		con.query(sql, function (err, result) {
			//if (err) throw err;
			g.consoleLog(0,"Table created");

			//2-DELETE MYSQL EVENT FOR USER
			sql = "DELETE FROM "+table_name+" WHERE datetime=\'"+timestamp+"\';";
			con.query(sql, function (err, result) {
				//if (err) throw err;
				g.consoleLog(0,"1 record deleted");
				
				sql = "INSERT INTO "+table_name+" (datetime, event_type, app_name, app_title, activity_type, task, duration) VALUES ('"+timestamp+"', '"+event_type+"','"+app_name+"','"+app_title+"','"+activity_type+"','"+task+"','"+duration+"')";
				con.query(sql, function (err, result) {
					if (err) throw err;
					g.consoleLog(0,"1 record inserted");
					resolve("ok");
				  });

			});

		});
	}catch(err){
		console.log(err);
	}

});

}



//-------------------------------------------------------------------------------------------------------
//==========================
// ### UTILITY FUNCTIONS ###
//==========================
//extracts bindings from json results
function get_AddedResults(msg){
	var bindings=msg.addedResults.results.bindings;
	return bindings;
}

function get_RemovedResults(msg){
	var bindings=msg.removedResults.results.bindings;
	return bindings;
}

