g=require('./greglogs.js')
const express = require('express');
const JsapApi = require('@arces-wot/sepa-js').Jsap//jsap api
require('./host-jsap.js')
console.clear()
//require('dotenv')
console.log("###############");
console.log("# OP PRODUCER #");
console.log("###############");


//INITIALIZE ELEMENTS (client and server)
let client= new JsapApi(jsap);
const app = express();
app.use(express.json());
//INITIALIZE APP
//init()







//EXPRESS ROUTERS
app.post('/*', (request,response)=>{
    //CREATE HTTP REQUEST FOR THE API
    g.Log(1,"WEBHOOK POST RECEIVED!")
    //STRINGIFY JSON
    var string_message=JSON.stringify(request.body);
    g.Log(1,string_message)

    //REPLACE SPECIAL CHARACTERS
    string_message=string_message.replace(/\\/g,"\\\\");

    //DEFINE FORCED BINDINGS
    data = {
        usergraph : "http://www.vaimee.it/my2sec/admin@vaimee.it",
        source: "http://www.vaimee.it/sources/open-project",
        msgtimestamp : get_current_timestamp(),
        msgvalue: string_message
    }
    //UPDATE SEPA!
    client.SEND_OP_MESSAGE(data)
    .then(res=>{
        console.log("Update response: " + res)
        response.json("{}"); 
    })


    		
});





//-----------------------------------------------------------------------------------------------------------
//FUNCTIONS
function get_current_timestamp(){
	const date=new Date();
	var string_timestamp=date.toISOString()
	//console.log(stringa)
	return string_timestamp
}


async function init(){
    const testresult=await testSepaSource()
    g.Log(1,"SEPA connection status: "+testresult)
}


function testSepaSource(){
    g.Log(1,"Trying to connect to SEPA...")
	//CREATE HTTP REQUEST FOR THE API
	return new Promise(resolve=>{
		client.query("select * where {?s ?p 'js'}")
        .then((data)=>{
            resolve("ok!");
            //console.log(data)
        })
	});
}


//-----------------------------------------------------------------------------------------------------
//LISTEN TO REQUESTS
var listen_port=1399;
app.listen(listen_port, () => {
    console.log('server is listening on port '+listen_port);
});









