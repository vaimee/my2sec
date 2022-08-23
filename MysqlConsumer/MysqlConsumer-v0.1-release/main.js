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
	var app_title=binding.title.value;
	var activity_type=binding.activity_type.value;
	var task=binding.task.value
	
	//1-CREATE MYSQL TABLE FOR USER
	g.consoleLog(1,"Trying to create table for "+table_name)
	var sql = "CREATE TABLE "+table_name+" (datetime DATETIME(6), event_type VARCHAR(255), app_name VARCHAR(255), app_title VARCHAR(255), activity_type VARCHAR(255), task VARCHAR(255))";
	try{
		con.query(sql, function (err, result) {
			//if (err) throw err;
			g.consoleLog(0,"Table created");

			//2-DELETE MYSQL EVENT FOR USER
			sql = "DELETE FROM "+table_name+" WHERE datetime=\'"+timestamp+"\';";
			con.query(sql, function (err, result) {
				//if (err) throw err;
				g.consoleLog(0,"1 record deleted");
				
				sql = "INSERT INTO "+table_name+" (datetime, event_type, app_name, app_title, activity_type, task) VALUES ('"+timestamp+"', '"+event_type+"','"+app_name+"','"+app_title+"','"+activity_type+"','"+task+"')";
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





/*
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
});
*/










/*
function insert_event(binding){


	var table_name=binding.username_literal.value;
	console.log("Creating table for "+table_name)
try{
	//con.connect(function(err) {
	  //if (err) throw err;
	  
	  var sql = "CREATE TABLE "+table_name+" (datetime DATETIME(6), event_type VARCHAR(255), app_name VARCHAR(255), app_title VARCHAR(255), activity_type VARCHAR(255), task VARCHAR(255))";
	  con.query(sql, function (err, result) {
	    //if (err) throw err;
	    console.log("Table created");

	    add_event_to_table(binding);
	    //resolve(result)
	  });

	//});
}catch(error){console.log(error)}

}
*/

/*
function add_event_to_table(binding){
	//TABLE NAME
	var table_name=binding.username_literal.value;
	//TABLE FIELDS
	var timestamp=binding.datetimestamp.value;
	var event_type=binding.event_type.value;
	var app_name=binding.app.value;
	var app_title=binding.title.value;
	var activity_type=binding.activity_type.value;
	var task=binding.task.value
	
	//1-CREATE MYSQL TABLE FOR USER
	g.consoleLog(1,"Trying to create table for "+table_name)
	var sql = "CREATE TABLE "+table_name+" (datetime DATETIME(6), event_type VARCHAR(255), app_name VARCHAR(255), app_title VARCHAR(255), activity_type VARCHAR(255), task VARCHAR(255))";
	try{
		con.query(sql, function (err, result) {
			//if (err) throw err;
			console.log("Table created");
		});
	}catch(err){
		console.log(err);
	}

	//2-DELETE MYSQL EVENT FOR USER
	g.consoleLog(1,"Deleting "+event_type+" of "+timestamp+" from "+table_name)
	var sql = "DELETE FROM "+table_name+" WHERE datetime=\'"+timestamp+"\';";
	try{
		con.query(sql, function (err, result) {
			//if (err) throw err;
			g.consoleLog(0,"1 record deleted");
		});
	}catch(err){
		console.log(err)
	}


	//3-INSERT MYSQL EVENT FOR USER
	g.consoleLog(1,"Inserting "+event_type+" of "+timestamp+" from "+table_name)
	var sql = "INSERT INTO "+table_name+" (datetime, event_type, app_name, app_title, activity_type, task) VALUES ('"+timestamp+"', '"+event_type+"','"+app_name+"','"+app_title+"','"+activity_type+"','"+task+"')";
  	con.query(sql, function (err, result) {
    	if (err) throw err;
    	g.consoleLog(0,"1 record inserted");
  	});

}
*/

//-------------------------------------------------------------------------------------------------------
//==========================
// ### UTILITY FUNCTIONS ###
//==========================
//extracts bindings from json response
function get_AddedResults(msg){
	var bindings=msg.addedResults.results.bindings;
	return bindings;
}