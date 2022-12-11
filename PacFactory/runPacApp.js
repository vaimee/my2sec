var AwMapper = require("./Apps/AwMapper.js")
//var KeycloakProducer = require("./Apps/KeycloakProducer.js")
//var KeycloakMapper = require("./Apps/KeycloakMapper.js")
var KeycloakAdapter = require("./Apps/KeycloakAdapter.js")
var SupersetUsersConsumer = require("./Apps/SupersetUsersConsumer.js")
var testClient = require("./Apps/testClient.js")
var AtAggregator = require("./Apps/ActivityTypeAggregator/AtAggregator.js")
require("./my2sec-jena-next_111222.jsap")
//require("./my2sec-jena-next_281122.jsap.js")
//require("./my2sec-jena_251122.jsap.js")
//require("./my2sec-FULL_271022.js")
/*##############################################################
# MAIN INTERFACE OF PAC FACTORY RELOADED, CALL START METHOD HERE
###############################################################*/
console.clear();
console.log("╔═════════════════════════════╗");
console.log("║    PAC FACTORY INTERFACE    ║");
console.log("║ ___________________________ ║")
console.log("║ @Author: Gregorio Monari    ║");
console.log("╠╦════════════════════════════╝");
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
    case "AtAggregator":
        initAtAggregator(arguments.slice(1))
        break;
    case "help":
        showHelp()
        break;

    default:
        break;
}

async function initAtAggregator(args){
    var aggr= new AtAggregator(jsap)
    var log=aggr.log;
    log.loglevel=0;
    aggr.start()    
}


function initAwMapper(args){
    var mapper= new AwMapper(jsap)
    var log=mapper.log;
    log.loglevel=0;
    mapper.start()
}

function initKeycloakAdapter(args){
    var adapter= new KeycloakAdapter(jsap)
    var log=adapter.log;
    log.loglevel=0;
    adapter.start()
}

function initSupersetUsersConsumer(args){
    //----CREATE PRODUCER MODULE----
    var consumer = new SupersetUsersConsumer(jsap);
    var log=consumer.log;// get logger from consumer
    log.loglevel=0;//set consumer log level
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
    log.loglevel=0;//set producer log level
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
    log.loglevel=0;// set producer log level
    //[2] START APP
    //app.test("test_1");
    app.start();//start app
}


function initTestClient(args){
    //[1] CREATE APP
    var app = new testClient(jsap);
    var log=app.log;// get logger from producer
    log.loglevel=0;// set producer log level
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
