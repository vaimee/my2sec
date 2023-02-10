
//DYNAMIC LINKS MENU
document.getElementById("dynamic_links_menu").style.display="none"
function dynamic_links_menu(){
	var dlm=document.getElementById("dynamic_links_menu")
	if(dlm.style.display!="none"){
		dlm.style.display="none"
	}else{
		dlm.innerHTML="<span id='dlm_title'><b>SERVICES</b><span><br>"
		//PRENDI TUTTE LE RIGHE FIGLIE DI DASH-WRAP
		var righe=get_childs_via_class("dashboard-wrapper","row")
		var title;
		//alert(righe[0].id)
		for (var i = 0; i < righe.length; i++) {
			//alert(righe[i].id)
			title=get_row_title(righe[i].id)
			if(title!="gtnull"){
				//CREATE LINK!
				dlm.innerHTML=dlm.innerHTML+"<a href='#"+righe[i].id+"'>&nbsp;&nbsp;"+title+"</a><br>"				
			}

		}
		//alert(i)
		//dlm.innerHTML=dlm.innerHTML+titles[0]+"\n"
		
		dlm.style.display="block"
	}
}





//ESTRAI IL TITOLO DALLA RIGA
//get_row_title(righe[0].id)


function get_row_title(id){
	//alert(id)
	var childtopbar=get_childs_via_class(id,"rowtopbar");
	//alert(childtopbar[0].className)
	//alert(childtopbar.length)
	//SE NON HA TOPBAR NON E' VALIDA
	if(childtopbar.length!=0){
		var childtitle=get_childs_via_class(childtopbar[0].id,"rowtitle")
		//alert(childtitle[0].className)
		var text_title=childtitle[0].textContent
		//alert(text_title)
		return text_title
	}else{
		return "gtnull"
	}
}


//---------------------------------------------
//NAME: get_child_rows(Str(#cwrap),Str(.cname))
//RETURNS: row_childs
//DESCRIPTION: 
//  START FROM ID, GET MULTIPLE CILDREN
//  Returns an array of children
//	identified via class
//	from the father element id
function get_childs_via_class(idwrap,cname){
	//GET CONTENT WRAPPER
	var dash_container=document.getElementById(idwrap)
	//alert(dash_container.className)
	var dashChilds= dash_container.childNodes
	//alert(dashChilds[5].className)
	var NRIGHE=0;
	var row_childs=[];
	for(i=0; i<dashChilds.length; i++){
		if(dashChilds[i].className==cname){
			row_childs[NRIGHE]=dashChilds[i];
			NRIGHE=NRIGHE+1;
		}
	}
	return row_childs
}




//alert(row_childs[0].className)

function switchDashView(button){
	var rowtitle=button.parentElement
	var row=rowtitle.parentElement
	//alert(row.id)
	var children=row.childNodes;
	//children[7].style.display="none"
	var wrapindex;
	for (var i=0; i<children.length; i++){
		if(children[i].className=="cols-wrapper"){
			wrapindex=i;
		}
	}

	if(children[wrapindex].style.display!="none"){
		children[wrapindex].style.display="none"
	}else{
		children[wrapindex].style.display="flex"	
	}
	
}
//alert("hello")
