/*-------------------------------------------------------------\
|| data_format.js: DATA FORMAT SCRIPT
|| 	DATE: 10/07/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: a set of functions used to format data for the
||				 aw producer html elements
\\-------------------------------------------------------------*/
// GET HTML ELEMENTS, GLOBALLY
pointsFather = document.getElementById("nav-points-wrapper");
op_status = document.getElementById("operation-status");
events_title = document.getElementById("events-title");


class AwManager extends AwProducer{
	
	constructor(jsap){
		super(jsap)
		this.current_watcher_index=0;
		this.tm=new TableManager("validation_body")
		this.atm= new ActivityTableManager("validation_body")
		/* AW PRODUCER DECLARES: 
		this.watchersJson={};
		this.eventsRawJson=[];
		this.eventsJson=[];
		*/
	}

	//====================
	// PRINT WATCHERS INFO
	//====================
	logspan_setTotalEvents(id){
		var singleJ="";
		var total_events=0;
		for(var key in this.eventsJson){
			singleJ=this.eventsJson[key];
			total_events=total_events+singleJ.length;
		}
	
		document.getElementById(id).textContent=total_events;
	}

	logspan_setTotalWatchers(id){
		var nWatchers=0;
		for(var key in this.watchersJson){
			nWatchers++
		}
		document.getElementById(id).textContent=nWatchers
	}


	//===========================================
	//VALIDATION
	async initialize_validation_procedure(){
		var res=await this.verifyQuery()
		
		try{
			res=JSON.parse(res)
		}catch(e){
			console.log(e)
			res=[]
		}

		console.log("AI FILTER RESULTS: "+res)
		this.tm.injectTable(res,"app,title,timestamp,working_selection")
		if(!this._jsonEmpty(res)){
			$(document).ready( function () {
				var events_table=$("#wst").DataTable();
			} );
		}else{
			console.log("Received empty json")
			var _corpo=document.getElementById("validation_body")
			_corpo.innerHTML=`
			<br><br>
			<div width="100%" align="center">
				Events are already classified
				<br>and ready to be sent!
			</div>
				`
		}
	}
	
	_jsonEmpty(json){
		//json=JSON.parse(json)
		if(Object.keys(json).length === 0){
			return true
		}else{
			return false
		}
	}


	//===========================================
	//UPLOAD




	//===========================================
	//EXPLORER
	update_watcher_view(n){
		var counter=0;
		for (var key in this.watchersJson){
			if (counter==n) {
				this.format_watcher_info(this.watchersJson,this.watchersJson[key].id)
	
				this.delete_children("table_wrapper")
				this.create_table_structure("table_wrapper")
				this.create_events_table(this.eventsJson[key])
				break;
			}else{
				counter=counter+1;
			}
		}
	
		//FORMAT TABLE
		$(document).ready( function () {
			var events_table=$('#events_table').DataTable();
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


	//=======================
	// MANAGE EVENTS TABLE
	//=======================
	//CREATES AN EMPTY TABLE INSIDE A DIV
	create_table_structure(wrapper_id){
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


	create_events_table(json_object){
		//WRITE DATA INTO THE RAW TABLE
		//print_raw_json_to_textarea("raw_events_wrapper",json_object)
		//WRITE DATA INTO FORMATTED TABLE
		log.debug(json_object.length)
		//SE NON E' VUOTO ESEGUI
		if(json_object.length!=0){
		//console.log(json_object)
		//GET PROPERTIES AND CREATE COLUMNS
		var COLUMNS=[]
		var colcounter=0;
		for(var lilkey in json_object[0].data){//cycle data
			//console.log(lilkey)
			COLUMNS[colcounter]=lilkey;
			colcounter=colcounter+1;
		}
		for(var key in json_object[0]){//cycle properties
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
			for (var datakey in data){
				//CREA CELLA
				const cell=document.createElement("td");
				const textnode = document.createTextNode(data[datakey]);
				cell.appendChild(textnode)
				//AGGANCIA ALLA RIGA CORRENTE
				row.appendChild(cell)
			}
			//POI STAMPA LE PROPRIETA'
			for(var propkey in event){
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
			log.info("skipped empty json")
		}
	}


	//DELETE ALL CHILDREN OF AN ELEMENT
	delete_children(element_id) {
    	var e = document.getElementById(element_id);  
    	//e.firstElementChild can be used.
    	var child = e.lastElementChild; 
    	while (child) {
    	    e.removeChild(child);
    	    child = e.lastElementChild;
    	}  
	}



	//====================
	// CHANGE WATCHERS
	//====================
	//CHANGE WATCHER BUTTON?
	cycle_watcher(){
		//INCREMENT
		if (this.current_watcher_index<this.nWatchers-1) {
			this.current_watcher_index=this.current_watcher_index+1;
		}else{
			this.current_watcher_index=0;
		}
		//UPDATE DATA
		this.update_watcher_view(this.current_watcher_index)
	}



	change_watcher(direction){
		console.log(direction+":"+this.current_watcher_index)
		console.log(this.nWatchers)
		//console.log("switching watcher")
		if(direction=="r"){
			//INCREMENT
			if (this.current_watcher_index<this.nWatchers-1) {
				this.current_watcher_index=this.current_watcher_index+1;
			}else{
				this.current_watcher_index=0;
			}
	
			//UPDATE DATA
			this.update_watcher_view(this.current_watcher_index)
	
		}else{
			//DECREMENT
			if (this.current_watcher_index>0) {
				this.current_watcher_index=this.current_watcher_index-1;
			}else{
				this.current_watcher_index=this.nWatchers-1;
			}
	
			//UPDATE DATA
			this.update_watcher_view(this.current_watcher_index)
		}
	
	}


	format_watcher_info(json_object,watcher_id){
		var jsonWatcher=json_object[watcher_id];
	
		var title=document.getElementById("watcher-title");
		title.innerHTML="id: <b>"+jsonWatcher["id"]+"<b>";
	}




}




class TableManager{
	constructor(id){
		this.tableContainerId=id
		this.logicalArray={}
		this.tableClass="display"
		this.selectedRows=[]
		this.selected=false;
	}


	select_all_visible_rows(){
		if(!this.selected){
			this.select_all_rows()
		}else{
			this.deselect_all_rows()
		}
	}

	deselect_all_rows(){
		console.log("DESELECT ALL")
		this.selectedRows=[];
		this.selected=false;
		document.getElementById("select_all_rows").innerHTML="SELECT ALL"
		document.getElementById("set_all_rows_to_working").style.display="none";
		document.getElementById("set_all_rows_to_notworking").style.display="none";
	}

	select_all_rows(){
		console.log("SELECT ALL")
		this.selected=true;
		document.getElementById("select_all_rows").innerHTML="DESELECT ALL"
		document.getElementById("set_all_rows_to_working").style.display="inline";
		document.getElementById("set_all_rows_to_notworking").style.display="inline";

		var father=document.getElementById(this.tableContainerId)
		var rows=father.getElementsByTagName("select")
		for(var i in rows){
			if(!rows[i].id){
				//do nothing
			}else{
				console.log("Selected: "+rows[i].id)
				this.selectedRows.push(rows[i])
			}
		}


	}

	set_all_rows_to_value(value){
		var workSelections='<option value="working">Working</option><option value="notworking">Not Working</option>'
		var notworkSelections='<option value="notworking">Not Working</option><option value="working">Working</option>'
		for(var i in this.selectedRows){
			var id=this.selectedRows[i].id;
			var logicalArrayIndex;
			var split=id.split("_")
			logicalArrayIndex=parseInt(split[1]);
			var flag ;
			var selection="";
			if(value=="working"){
				selection=workSelections;
				flag=1
			}else{
				if(value=="notworking"){
					selection=notworkSelections;
					flag=0
				}
			}
			var tochange=document.getElementById(id);
			tochange.innerHTML=selection
			this.logicalArray["working_selection"][logicalArrayIndex]=flag
			console.log(this.logicalArray)			
		}
	}

	on_selection_change(i){
		var changed=document.getElementById(`workflag_${i}`)
		console.log(`Changed working flag of row ${i}: ${changed.value}`)
		var flag ;
		if(changed.value=="working"){
			flag=1
		}else{
			if(changed.value=="notworking"){
				flag=0
			}
		}
		this.logicalArray["working_selection"][i]=flag
		console.log(this.logicalArray)
	}


	styleTable(id){
		return new Promise(resolve=>{
			$(document).ready( function () {
				var events_table=$(id).DataTable();
				resolve(events_table)
			} );
		})
	}

	injectTable(jsonCsv,whitelist){
		this.logicalArray=jsonCsv
		var table=this.newValidationTable(jsonCsv,whitelist)
		document.getElementById(this.tableContainerId).innerHTML=table;
	}


	newExplorerTable(){

	}

	//fields: monodimensional array, array: bidimensional array
	newValidationTable(jsonCsv,whitelist){
		var head=""
		for(var key in jsonCsv){
			if(whitelist.includes(key)){
				head=head+`<th>${key}</th>`
			}
		}
		var body=""
		for(var i in jsonCsv.app){
			body=body+"<tr>"
			for(var key in jsonCsv){
				if(whitelist.includes(key)){
					if(key!="working_selection"){
						body=body+`<td>${jsonCsv[key][i]}</td>`
					}else{
						var workSelections='<option value="working">Working</option><option value="notworking">Not Working</option>'
						var notworkSelections='<option value="notworking">Not Working</option><option value="working">Working</option>'
						var nullSelections='<option disabled selected value> -- select an option -- </option><option value="working">Working</option><option value="notworking">Not Working</option>'
						var selection=""
						if(jsonCsv[key][i]=="0"){
							selection=notworkSelections;
						}else{
							if(jsonCsv[key][i]=="1"){
								selection=workSelections;
							}else{
								selection=nullSelections;
							}
						}
						body=body+`<td>
							<select name="workflag" id="workflag_${i}" onchange="on_selection_change(${i})">
								${selection}
							</select>
						</td>`
					}
				}
			}
			body=body+"</tr>"
		}
		return `
		<table id="wst" class=${this.tableClass}>
			<thead>
				<tr>${head}</tr>
			</thead>
			<tbody>
				${body}
			</tbody>
		</table>`
	}

}



class ActivityTableManager{
	constructor(id){
		this.tableContainerId=id
		this.logicalArray={}
		this.originalBindings=[]
		this.tableClass="display"
	}


	on_activity_selection_change(i){
		var changed=document.getElementById(`activity_type_${i}`)
		console.log(changed.innerHTML)
		console.log(`Changed activity_type of row ${i}: ${changed.value}`)
		this.logicalArray[i]["activity_type"]="my2sec:"+changed.value
		console.log(this.logicalArray)
	}


	styleTable(id){
		return new Promise(resolve=>{
			$(document).ready( function () {
				var events_table=$(id).DataTable();
				resolve(events_table)
			} );
		})
	}

	injectTable(jsonCsv,whitelist,known_categories){
		this.logicalArray=jsonCsv
		var table=this.newValidationTable(jsonCsv,whitelist,known_categories)
		//throw new Error("MAO")
		document.getElementById(this.tableContainerId).innerHTML=table;
	}


	newExplorerTable(){

	}

	//fields: monodimensional array, array: bidimensional array
	newValidationTable(bindings,whitelist,known_categories){
		var head=""
		for(var key in bindings[0]){
			if(whitelist.includes(key)){
				head=head+`<th>${key}</th>`
			}
		}
		var body=""
		for(var i in bindings){
			body=body+"<tr>"
			for(var key in bindings[i]){
				if(whitelist.includes(key)){
					if(key!="activity_type"){
						body=body+`<td>${bindings[i][key]}</td>`
					}else{
						var category=bindings[i][key];
						category=category.slice(category.lastIndexOf("#")+1);
						console.log(category)
						//if(known_categories.includes(category)){
							var selection=`<option value="${category}">${category}</option>`
							var catarr=known_categories.split(",");
							for(var c in catarr){
								var cat=catarr[c].trim();
								if(cat!=category){
									selection=selection+`<option value="${cat}">${cat}</option>`
								}
							}
							body=body+`<td>
								<select name="activity_type" id="activity_type_${i}" onchange="on_activity_selection_change(${i})">
									${selection}
								</select>
							</td>`
						//}else{
						//	console.log("unknown category")
						//}
					}
				}
			}
			body=body+"</tr>"
		}
		return `
		<table id="wst" class=${this.tableClass}>
			<thead>
				<tr>${head}</tr>
			</thead>
			<tbody>
				${body}
			</tbody>
		</table>`
	}

}


/*
var t=new TableManager("validation_body")
var data=[
	["urka","moa","no"],
	["miao","bus","busone"]
]
t.injectTable(["App","Title","Work Flag"],data)
*/




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



























