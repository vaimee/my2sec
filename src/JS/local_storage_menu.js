/*---------------------------------------------------------\
| local_storage_menu.js: LOCAL STORAGE MENU SCRIPT
| 	DATE: 3/08/2022
| 	AUTHOR: Gregorio Monari
| 	DESCRIPTION: collection of methods to handle local storage
\---------------------------------------------------------*/




//GET HTML ELEMENTS
var allcontent=document.getElementById("content-wrapper") //SERVE PER L'OPACITA' QUANDO APRI IL MENU
var menuwin=document.getElementById("menu_window"); //MENU LATERALE
var sepaconfig=document.getElementById("sepa-config-form"); //MENU LATERALE
var userconfig=document.getElementById("username-form"); //MENU LATERALE
var whitelistconfig=document.getElementById("whitelist-form"); //MENU LATERALE
//alert(sepaconfig.hostname_options.value)
var default_options_json = {

    //NOME UTENTE DI DEFAULT
    "jsap": default_jsap,

    "user":"defaultuser@vaimee.it",

    "synchronize":"true",

    "darkmode":"false",

    "whitelist":"aw-my2sec,aw-watcher-working"

}



init_options()
//consoleLog(0,username)
//alert(username)
//alert("finish")


function init_options(){
    //INIT MENU OR NOT FOR FIRST TIME
    var string_options=localStorage.getItem("json_options");
    if(string_options==null){
        //alert(string_options)
        var defstring=JSON.stringify(default_options_json)
        localStorage.setItem("json_options",defstring);
        consoleLog(1,"MENU INITIALIZED")
        alert("FIRST RUN, APP INITIALIZED CORRECTLY!")
        consoleLog(0,defstring)
    }else{
        consoleLog(1,"MENU ALREADY INITIALIZED")
        //alert("MENU ALREADY INITIALIZED")
    }

    //COPY LOCALSTORAGE INTO HTML ELEMENTS
    jsap = get_localstorage("jsap");

    sepaconfig.hostname_options.value=jsap.host;
    sepaconfig.http_port_options.value=jsap.sparql11protocol.port;
    sepaconfig.ws_port_options.value=jsap.sparql11seprotocol.availableProtocols.ws.port;
    sepaconfig.tls_options="false";

    userconfig.username_options.value=get_localstorage("user");
    whitelistconfig.whitelist_options.value=get_localstorage("whitelist");
    

}


function save_options_button(){
	consoleLog(1,"saving options...")

    //UPDATE JSAP
    consoleLog(0,"modifying jsap")
    jsap.host=sepaconfig.hostname_options.value;
    jsap.sparql11protocol.port=sepaconfig.http_port_options.value;
    jsap.sparql11seprotocol.availableProtocols.ws.port=sepaconfig.ws_port_options.value;
    //jsap.host=sepaconfig.hostname_options.value;


    //alert("modified jsap")

    //UPDATE LOCAL STORAGE
    consoleLog(0,"updating localstorage")
    update_localstorage("jsap",jsap);

    
    //UPDATE USERNAME
    update_localstorage("user",userconfig.username_options.value);

    //UPDATE WHITELIST
    update_localstorage("whitelist",whitelistconfig.whitelist_options.value)
    //alert(whitelistconfig.whitelist_options.value)

    //RESTART SEPA CLIENT
    consoleLog(0,"restarting sepa client")
    init_sepa_client();

    //CLOSE MENU
    menu_switch();

    //RESTART APPLICATION
    init();

    //alert("LOCAL OPTIONS UPDATED") //BUGFIX
    //location.refresh();

}

//SHOW/HIDE MENU
var menu_shown=0;
function menu_switch(){
	if(menu_shown==0){
		menuwin.style.display="block"
		allcontent.style.opacity="0.4"
		menu_shown=1;
	}else{
		menuwin.style.display="none"
		allcontent.style.opacity="1"
		menu_shown=0;
	}
}


function get_localstorage(key){
    consoleLog(1,"GETTING OPTIONS")
    var string_options=localStorage.getItem("json_options");
    consoleLog(0,string_options)
    var json_options=JSON.parse(string_options);
	return json_options[key]
}

function update_localstorage(key,value){
    consoleLog(1,"UPDATING OPTIONS")
    var string_options=localStorage.getItem("json_options");
    var json_options=JSON.parse(string_options);
	json_options[key]=value;
	string_options=JSON.stringify(json_options);
    consoleLog(0,string_options)
	localStorage.setItem("json_options",string_options);
}






