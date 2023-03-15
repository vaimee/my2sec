var AwMapper = require("./Apps/AwMapper.js")
//var KeycloakProducer = require("./Apps/KeycloakProducer.js")
//var KeycloakMapper = require("./Apps/KeycloakMapper.js")
var KeycloakAdapter = require("./Apps/KeycloakAdapter.js")
var SupersetUsersConsumer = require("./Apps/SupersetUsersConsumer.js")
var OpUsersConsumer = require("./Apps/OpUsersConsumer.js")
var testClient = require("./Apps/testClient/testClient.js")
var My2secTester = require("./Apps/testClient/My2secTester.js")
var AwMapperTester = require("./Apps/testClient/AwMapperTester.js")
var MultipleBindingsTester = require("./Apps/testClient/MultipleBindingsTester.js")
var OpAdapterTester = require("./Apps/testClient/OpAdapterTester.js")
var TestMaster = require("./Apps/testClient/TestMaster.js")
var AtAggregatorTester = require("./Apps/testClient/AtAggregatorTester.js")
var AtAggregator = require("./Apps/ActivityTypeAggregator/AtAggregator.js")
var OpAdapter= require("./Apps/OpAdapter.js")
var OpConsumer= require("./Apps/OpConsumer.js")
var SqlActivitiesConsumer= require("./Apps/SqlActivitiesConsumer.js")
var My2secFormConsumer= require("./Apps/My2secFormConsumer.js")
jsap={};//GLOBAL
/*##############################################################
# MAIN INTERFACE OF PAC FACTORY RELOADED, CALL START METHOD HERE
###############################################################*/
init()
async function init(){
console.clear();
console.log("╔═════════════════════════════╗");
console.log("║    PAC FACTORY INTERFACE    ║");
console.log("║ ___________________________ ║")
console.log("║ @Author: Gregorio Monari    ║");
console.log("╚═════════════════════════════╝");

jsap=await load_jsap("./my2sec_19-1-2023.jsap")


console.log("║ Connected to: "+jsap.host);
console.log("║ Http Update/Query port: "+jsap.sparql11protocol.port);
console.log("║ Ws Subscribe port: "+jsap.sparql11seprotocol.availableProtocols.ws.port);
console.log("╚══════════════════════════════");

//get command line arguments
var arguments=process.argv.slice(2);

switch (arguments[0]) {
    case "AwMapper":
        initAwMapper(arguments.slice(1))
        break;
    case "KeycloakAdapter":
        initKeycloakAdapter(arguments.slice(1))
        break;    
    case "KeycloakProducer":
        initKeycloakProducer(arguments.slice(1))
        break;
    case "KeycloakMapper":
        initKeycloakMapper(arguments.slice(1))
        break;
    case "SupersetUsersConsumer":
        initSupersetUsersConsumer(arguments.slice(1))
        break;
    case "testClient":
        initTestClient(arguments.slice(1))
        break;
    case "My2secTester":
        initMy2secTester(arguments.slice(1))
        break;
    case "AwMapperTester":
        initAwMapperTester(arguments.slice(1))
        break;
    case "AtAggregatorTester":
        initAtAggregatorTester(arguments.slice(1))
        break;
    case "AtAggregator":
        initAtAggregator(arguments.slice(1))
        break;
    case "OpAdapter":
        initOpAdapter(arguments.slice(1))
        break;
    case "OpConsumer":
        initOpConsumer(arguments.slice(1))
        break;
    case "My2secFormConsumer":
        initMy2secFormConsumer(arguments.slice(1))
        break;
    case "MultipleBindingsTester":
        initMultipleBindingsTester(arguments.slice(1))
        break;
    case "OpAdapterTester":
        initOpAdapterTester(arguments.slice(1))
        break;
    case "TestMaster":
        initTestMaster(arguments.slice(1))
        break;
    case "SqlActivitiesConsumer":
        initSqlActivitiesConsumer(arguments.slice(1))
        break;
    case "OpUsersConsumer":
        initOpUsersConsumer(arguments.slice(1))
        break;    
    case "help":
        showHelp()
        break;

    default:
        break;
}
}



function initOpUsersConsumer(args){
    var consumer=new OpUsersConsumer(jsap,args)
    //tester.log.loglevel=0;
    consumer.start()      
}
function initSqlActivitiesConsumer(args){
    var consumer=new SqlActivitiesConsumer(jsap,args)
    //tester.log.loglevel=0;
    consumer.start()      
}
function initOpAdapterTester(args){
    var tester=new OpAdapterTester(jsap,args)
    //tester.log.loglevel=0;
    tester.start()      
}
function initTestMaster(args){
    var tester=new TestMaster(jsap,args)
    //tester.log.loglevel=0;
    tester.startMaster()   
}
function initMultipleBindingsTester(args){
    var tester=new MultipleBindingsTester(jsap,args)
    //tester.log.loglevel=0;
    tester.start()   
}
function initMy2secFormConsumer(args){
    var consumer=new My2secFormConsumer(jsap)
    //consumer.log.loglevel=0;
    consumer.start()   
}
function initOpAdapter(args){
    var OpClient=new OpAdapter(jsap)
    //OpClient.log.loglevel=0;
    OpClient.start()   
}
function initOpConsumer(args){
    var OpClient=new OpConsumer(jsap)
    //OpClient.log.loglevel=0;
    OpClient.start()   
}
function initAtAggregatorTester(args){
    var tester=new AtAggregatorTester(jsap)
    //tester.log.loglevel=0;
    tester.start()   
}
function initAwMapperTester(args){
    var tester=new AwMapperTester(jsap)
    //tester.log.loglevel=0;
    tester.start()   
}
function initMy2secTester(args){
    var tester=new My2secTester(jsap)
    //tester.log.loglevel=0;
    tester.start()
}

async function initAtAggregator(args){
    var aggr= new AtAggregator(jsap)
    var log=aggr.log;
    log.loglevel=parseInt(args)||0;
    aggr.start()    
}


function initAwMapper(args){
    var mapper= new AwMapper(jsap)
    var log=mapper.log;
    //log.loglevel=0;
    mapper.start()
}

function initKeycloakAdapter(args){
    var adapter= new KeycloakAdapter(jsap)
    var log=adapter.log;
    //log.loglevel=0;
    adapter.start()
}

function initSupersetUsersConsumer(args){
    //----CREATE PRODUCER MODULE----
    var consumer = new SupersetUsersConsumer(jsap);
    var log=consumer.log;// get logger from consumer
    //log.loglevel=0;//set consumer log level
    //consumer.start();
    if(args[0]=="-test"){
        consumer.initTest("test_1");
    }else{
        consumer.start();
    }
    
    
}

function initKeycloakProducer(args){
    //----CREATE PRODUCER MODULE----
    var producer = new KeycloakProducer(jsap);
    var log=producer.log;// get logger from producer
    //log.loglevel=0;//set producer log level
    //producer.start();
    if(args[0]=="-test"){
        producer.initTest("test_1");
    }else{
        producer.start();
    }
    
    
}

function initKeycloakMapper(args){
    //console.log(args)
    //[1] CREATE APP
    var app = new KeycloakMapper(jsap);
    var log=app.log;// get logger from producer
   // log.loglevel=0;// set producer log level
    //[2] START APP
    //app.test("test_1");
    app.start();//start app
}


function initTestClient(args){
    //[1] CREATE APP
    var app = new testClient(jsap);
    var log=app.log;// get logger from producer
    //log.loglevel=0;// set producer log level
    //[2] START APP
    //app.test("test_1");
    app.start();//start app   
}



function showHelp(){
    console.log("######################################")
    console.log("PAC FACTORY DEPLOYMENT INTERFACE GUIDE")
    console.log("command: node runPacApp <AppName|help> [<appArg0> <appArg1> ... <appArgN>]")
    console.log("Quick Explanation:")
    console.log("> The command runPacApp allows to run Pac modules by specifying a module name (AppName) and optionally app-specific command line arguments [<appArg0> ... <appArgN>]")
    console.log("> Example: node runPacApp KeycloakProducer -test")
}






//====================================0
//PARSE JSAP
async function load_jsap(file){
    var text=await readFile(file);
    var tempjsap=JSON.parse(text);

    if(process.env.HOST_NAME!=undefined){
        var host_name=process.env.HOST_NAME;
        console.log("LOADING ENV HOST_NAME: "+host_name)
        tempjsap.host=host_name;
    }else{
        //console.log("default hostname")	
    }
    
    if(process.env.HTTP_PORT!=undefined){
        var http_port=process.env.HTTP_PORT;
        console.log("LOADING ENV HOST_NAME: "+http_port)
        tempjsap.sparql11protocol.port=http_port;	
    }else{
        //console.log("default hostname")	
    }
    
    
    if(process.env.WS_PORT!=undefined){
        var ws_port=process.env.WS_PORT;
        console.log("LOADING ENV HOST_NAME: "+ws_port)
        tempjsap.sparql11seprotocol.availableProtocols.ws.port=ws_port;
    }else{
        //console.log("default hostname")	
    }

    return tempjsap;
}


function readFile(filename){
    var fs = require('fs');
    return new Promise(resolve=>{
      fs.readFile(filename, 'utf8', function (err,data) {
        if (err) return console.log(err);
        //console.log('FILE SAVED');
        resolve(data)
      });
    })
}
