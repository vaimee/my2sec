//MYSQL DEFAULT CONNECTION PARAMETERS
mysql_host="dld.arces.unibo.it";
mysql_port="3333";
mysql_user="root";
mysql_pw="Gregnet/99";
mysql_db="EventsDB";

//GET MYSQL ENV
if(process.env.MYSQL_HOST!=undefined){
	mysql_host=process.env.MYSQL_HOST;
	console.log("LOADED ENV mysql_host: "+mysql_host)
}else{
	console.log("default mysql_host")	
}

if(process.env.MYSQL_PORT!=undefined){
	mysql_port=process.env.MYSQL_PORT;
	console.log("LOADED ENV mysql_port: "+mysql_port)
}else{
	console.log("default mysql_port")	
}

if(process.env.MYSQL_USER!=undefined){
	mysql_user=process.env.MYSQL_USER;
	console.log("LOADED ENV mysql_user: "+mysql_user)
}else{
	console.log("default mysql_user")	
}

if(process.env.MYSQL_PW!=undefined){
	mysql_pw=process.env.MYSQL_PW;
	console.log("LOADED ENV mysql_pw: "+mysql_pw)
}else{
	console.log("default mysql_pw")	
}

if(process.env.MYSQL_DB!=undefined){
	mysql_db=process.env.MYSQL_DB;
	console.log("LOADED ENV mysql_db: "+mysql_db)
}else{
	console.log("default mysql_db")	
}