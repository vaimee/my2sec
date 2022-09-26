/*-------------------------------------------------------------\
|| data_format.js: DATA FORMAT SCRIPT
|| 	DATE: 10/07/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: a set of functions used to format data for the
||				 aw producer html elements
\\-------------------------------------------------------------*/
console.log("-> Loaded external script: data_format.js")
// GET HTML ELEMENTS, GLOBALLY
pointsFather = document.getElementById("nav-points-wrapper");
op_status = document.getElementById("operation-status");
events_title = document.getElementById("events-title");


//=======================
// MANAGE EVENTS TABLE
//=======================
//CREATES AN EMPTY TABLE INSIDE A DIV
function create_table_structure(wrapper_id){
	var tablewrapper=document.getElementById(wrapper_id)
	//[1] CREATE
	//CREATE TABLE
	const table=document.createElement("table");
	table.id="events_table"
	table.className="display"
	//CREATE COLUMN HEADER
	const headwrapper=document.createElement("thead");
	const headrow=document.createElement("tr");
	headrow.id="cols_header"
	//CREATE BODY
	const bodywrapper=document.createElement("tbody");
	bodywrapper.id="table_rows"
	
	//[2] APPEND
	headwrapper.appendChild(headrow);	
	table.appendChild(headwrapper);
	table.appendChild(bodywrapper);
	tablewrapper.appendChild(table);
}



function create_events_table(json_object){
	//WRITE DATA INTO THE RAW TABLE
	//print_raw_json_to_textarea("raw_events_wrapper",json_object)
	//WRITE DATA INTO FORMATTED TABLE
	consoleLog(0,json_object.length)



	//SE NON E' VUOTO ESEGUI
	if(json_object.length!=0){

	

	//console.log(json_object)
	//GET PROPERTIES AND CREATE COLUMNS
	var COLUMNS=[]
	colcounter=0;
	for(lilkey in json_object[0].data){//cycle data
		//console.log(lilkey)
		COLUMNS[colcounter]=lilkey;
		colcounter=colcounter+1;
	}
	for(key in json_object[0]){//cycle properties
		if (key!="data") {
			COLUMNS[colcounter]=key;
			colcounter=colcounter+1;
		}
	}

	var colsheader=document.getElementById("cols_header")
	for (var i = 0; i < COLUMNS.length; i++) {
		const node=document.createElement("th");
		const textnode = document.createTextNode(COLUMNS[i]);
		node.appendChild(textnode);
		colsheader.appendChild(node);
	}


	//GET DATA
	var tablerows=document.getElementById("table_rows")
	for (var i = 0; i < json_object.length; i++) {
		const row=document.createElement("tr");
		var event=json_object[i];
		var data=event.data;
		//PRIMA STAMPA I DATI
		for (datakey in data){
			//CREA CELLA
			const cell=document.createElement("td");
			const textnode = document.createTextNode(data[datakey]);
			cell.appendChild(textnode)
			//AGGANCIA ALLA RIGA CORRENTE
			row.appendChild(cell)
		}
		//POI STAMPA LE PROPRIETA'
		for(propkey in event){
			if (propkey!="data") {
				//CREA CELLA
				const cell=document.createElement("td");
				const textnode = document.createTextNode(event[propkey]);
				cell.appendChild(textnode)
				row.appendChild(cell)
			}
		}

		//AGGIUNGI RIGA ALLA TABELLA
		tablerows.appendChild(row);	
	}


	}else{
		consoleLog(1,"skipped empty json")
	}

}



//DELETE ALL CHILDREN OF AN ELEMENT
function delete_children(element_id) {
    var e = document.getElementById(element_id);  
    //e.firstElementChild can be used.
    var child = e.lastElementChild; 
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }  
}


//SHOW RAW EVENTS, MAY BE REMOVED OR MODIFIED
var rawshown=0;
function show_raw_events(){
	if(rawshown==0){
		rawshown=1;
		hide_element("table_wrapper");
		show_element("raw_events_wrapper");
	}else{
		rawshown=0;
		hide_element("raw_events_wrapper");
		show_element("table_wrapper");
	}
}







//====================
// CHANGE WATCHERS
//====================
//CHANGE WATCHER BUTTON?
var current_watcher_index=0;
function cycle_watcher(){

	//INCREMENT
	if (current_watcher_index<WATCHERS.length-1) {
		current_watcher_index=current_watcher_index+1;
	}else{
		current_watcher_index=0;
	}

	//UPDATE DATA
	update_watcher_view(current_watcher_index)


}

function change_watcher(direction){
	//console.log("switching watcher")
	if(direction=="r"){
		//INCREMENT
		if (current_watcher_index<WATCHERS.length-1) {
			current_watcher_index=current_watcher_index+1;
		}else{
			current_watcher_index=0;
		}

		//UPDATE DATA
		update_watcher_view(current_watcher_index)

	}else{
		//DECREMENT
		if (current_watcher_index>0) {
			current_watcher_index=current_watcher_index-1;
		}else{
			current_watcher_index=WATCHERS.length-1;
		}

		//UPDATE DATA
		update_watcher_view(current_watcher_index)
	}

}





//====================
// PRINT WATCHERS INFO
//====================
//------------------------------------------
//PRINT WATCHER NAME AND FORMAT EVENTS TABLE
function update_watcher_view(n){
	var counter=0;
	for (key in WATCHERS_JSON){
		if (counter==n) {
			format_watcher_info(WATCHERS_JSON,WATCHERS_JSON[key].id)

			delete_children("table_wrapper")
			create_table_structure("table_wrapper")
			create_events_table(EVENTS_JSON[key])
			break;
		}else{
			counter=counter+1;
		}
	}

	//FORMAT TABLE
	$(document).ready( function () {
    	events_table=$('#events_table').DataTable();
	} );

	
	var children = pointsFather.children;
	for (var i = 0; i < children.length; i++) {
		  var pointchild = children[i];
		  if(i==n){
			pointchild.className="nav-point-selected"
		  }else{
			pointchild.className="nav-point"
		  }
		  
	}


}








function format_watcher_info(json_object,watcher_id){
	var jsonWatcher=json_object[watcher_id];

	var title=document.getElementById("watcher-title");
	title.innerHTML="id: <b>"+jsonWatcher["id"]+"<b>";
/*
	var el=document.getElementById("watcher_info");
  	var formattedString="";
  	for (lilkey in jsonWatcher) {
  		formattedString=formattedString+"<b>"+lilkey+"</b>: "+jsonWatcher[lilkey]+"<br>"
  	}
  	el.innerHTML=formattedString;
  	consoleLog(1,"format_watcher_info: printed watchers into watcher_info")*/
}



