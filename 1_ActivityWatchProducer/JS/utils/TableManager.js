class TableManager{
	constructor(id){
		this.tableContainerId=id
		this.logicalArray={}
		this.tableClass="display"
		this.selectedRows=[]
		this.selected=false;
		this.log=new GregLogs()
	}

    check_none_events(){
		var cache=this.get_internal_cache()

		if(!cache.hasOwnProperty("working_selection")){return false;}

		var selections=cache["working_selection"];
		var length=Object.keys(selections).length;
		for(var i=0; i<length; i++){
			if(selections[i]=="None"){
				return true
			}
		}
		return false
    }

	get_cache_as_json_array(){
		var arr=this.get_internal_cache();
		var newKnowledgeCell={}
		for(var k in arr){
			var field=[]
			for(var i in arr[k]){
				field.push(arr[k][i])
			}
			newKnowledgeCell[k]=field;
		}
		return newKnowledgeCell;
	}

	get_internal_cache(){
		return this.logicalArray
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
			//?uncomment to update only visible cells
			this.logicalArray["working_selection"][logicalArrayIndex]=flag
			console.log(this.logicalArray)			
		}
		//!UPDATE ALL LOGICAL ARRAY! (not yet, you need to update the table internal memory)
		/*
		var flag_1=0
		if(value=="working"){
			flag_1=1
		}else{
			if(value=="notworking"){
				flag_1=0
			}
		}
		for(var i in this.logicalArray["working_selection"]){
			this.logicalArray["working_selection"][logicalArrayIndex]=flag
		}
		console.log(this.logicalArray)*/
	}

	on_selection_change(i){
		var changed=document.getElementById(`workflag_${i}`)
		this.log.debug(`Changed working flag of row ${i} with value: ${changed.value}`)
		var flag ;
		if(changed.value=="working"){
			flag=1
		}else{
			if(changed.value=="notworking"){
				flag=0
			}
		}
		this.logicalArray["working_selection"][i]=flag
		this.log.debug(this.logicalArray)
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
		this.log=new GregLogs()
	}

	get_original_bindings(){
		return this.originalBindings
	}

	check_none_activity_types(){
		var cache=this.get_internal_cache()
		this.log.debug(cache)

		var length=Object.keys(cache).length;
		for(var i=0; i<length; i++){
			this.log.info(cache[i])
			if(cache[i].hasOwnProperty("activity_type")){
				if(cache[i]["activity_type"].split("#")[1]=="none"){
					return true
				}
			}

		}
		return false
    }
	get_cache_as_json_array(){
		var arr=this.get_internal_cache();
		var newKnowledgeCell={}
		for(var k in arr){
			var field=[]
			for(var i in arr[k]){
				field.push(arr[k][i])
			}
			newKnowledgeCell[k]=field;
		}
		return newKnowledgeCell;
	}

	get_internal_cache(){
		return this.logicalArray
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