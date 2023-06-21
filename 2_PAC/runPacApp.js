const AwMapper=require("./Apps/My2Sec/AwMapper.js")
//const KeycloakProducer = require("./Apps/My2Sec/KeycloakProducer.js")
//const KeycloakMapper = require("./Apps/My2Sec/KeycloakMapper.js")
const KeycloakAdapter = require("./Apps/My2Sec/KeycloakAdapter.js")
const SupersetUsersConsumer = require("./Apps/My2Sec/SupersetUsersConsumer.js")
const OpUsersConsumer = require("./Apps/My2Sec/OpUsersConsumer.js")
const testClient = require("./Tests/My2Sec/testClient.js")
const My2secTester = require("./Tests/My2Sec/My2secTester.js")
const AwMapperTester = require("./Tests/My2Sec/AwMapperTester.js")
const MultipleBindingsTester = require("./Tests/My2Sec/MultipleBindingsTester.js")
const OpAdapterTester = require("./Tests/My2Sec/OpAdapterTester.js")
const TestMaster = require("./Tests/My2Sec/TestMaster.js")
const AtAggregatorTester = require("./Tests/My2Sec/AtAggregatorTester.js")
const AtAggregator = require("./Apps/My2Sec/ActivityTypeAggregator/AtAggregator.js")
const OpAdapter= require("./Apps/My2Sec/OpAdapter.js")
const OpConsumer= require("./Apps/My2Sec/OpConsumer.js")
const SqlActivitiesConsumer= require("./Apps/My2Sec/SqlActivitiesConsumer.js")
const My2secFormConsumer= require("./Apps/My2Sec/My2secFormConsumer.js")
const WeatherForecastAdapter= require("./Apps/Criteria/WeatherForecastAdapter/WeatherForecastAdapter.js")
const UsersProfessionsConsumer= require("./core/Pattern/My2Sec/UsersProfessionsConsumer.js")
const ProfessionInfoConsumer= require("./core/Pattern/My2Sec/ProfessionInfoConsumer.js")
const MongoDbMessagesTester=require("./Tests/My2Sec/MongoDbMessagesTester")
const MongoTestMaster = require("./Tests/My2Sec/MongoTestMaster.js")
const MongoAtAggregatorTester = require("./Tests/My2Sec/MongoAtAggregatorTester")
jsap={};//GLOBAL
/*##############################################################
# MAIN INTERFACE OF PAC FACTORY RELOADED, CALL START METHOD HERE
###############################################################*/
/*
  TODO: better title and readability, handle help case if no app is specified by accident
*/
init()
async function init(){
console.log(
`============================================================================================
.██▓███...▄▄▄.......▄████▄.......█████▒▄▄▄.......▄████▄..▄▄▄█████▓.▒█████...██▀███.▓██...██▓
▓██░..██▒▒████▄....▒██▀.▀█.....▓██...▒▒████▄....▒██▀.▀█..▓..██▒.▓▒▒██▒..██▒▓██.▒.██▒▒██..██▒
▓██░.██▓▒▒██..▀█▄..▒▓█....▄....▒████.░▒██..▀█▄..▒▓█....▄.▒.▓██░.▒░▒██░..██▒▓██.░▄█.▒.▒██.██░
▒██▄█▓▒.▒░██▄▄▄▄██.▒▓▓▄.▄██▒...░▓█▒..░░██▄▄▄▄██.▒▓▓▄.▄██▒░.▓██▓.░.▒██...██░▒██▀▀█▄...░.▐██▓░
▒██▒.░..░.▓█...▓██▒▒.▓███▀.░...░▒█░....▓█...▓██▒▒.▓███▀.░..▒██▒.░.░.████▓▒░░██▓.▒██▒.░.██▒▓░
▒▓▒░.░..░.▒▒...▓▒█░░.░▒.▒..░....▒.░....▒▒...▓▒█░░.░▒.▒..░..▒.░░...░.▒░▒░▒░.░.▒▓.░▒▓░..██▒▒▒.
░▒.░.......▒...▒▒.░..░..▒.......░.......▒...▒▒.░..░..▒.......░......░.▒.▒░...░▒.░.▒░▓██.░▒░.
░░.........░...▒...░............░.░.....░...▒...░..........░......░.░.░.▒....░░...░.▒.▒.░░..
...............░..░░.░......................░..░░.░...................░.░.....░.....░.░.....
.. Version 0.7.12 .░............................░...................................░.░.....
.. Author: Gregorio Monari .................................................................
============================================================================================`
);

console.log("[Preflight]")
//get command line arguments
var arguments=process.argv.slice(2);
//console.log("Launching Pac module: "+arguments[0])
//console.log(arguments)
if(arguments.length>1){
    if(arguments[1].includes("-jsap")){
        console.log("- Getting jsap from: "+arguments[2])
        jsap=await load_and_override_jsap(arguments[2])
        temp=arguments.slice(3) //leva il jsap dagli argomenti
        temp.unshift(arguments[0])
        arguments=temp
        //console.log(arguments)
    }else{
        console.log("No jsap argument found, loading default jsap")
        jsap=await load_and_override_jsap("./resources/my2sec_26-5-2023.jsap")
        //console.log(arguments)
    }
}else{
    console.log("No jsap argument found, loading default jsap")
    jsap=await load_and_override_jsap("./resources/my2sec_26-5-2023.jsap")
    //console.log(arguments)
}




console.log("- Host:       "+jsap.host);
console.log("- Http port:  "+jsap.sparql11protocol.port);
console.log("- Ws port:    "+jsap.sparql11seprotocol.availableProtocols.ws.port);

console.log("[Launching Pac module: "+arguments[0]+"]")
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
    case "WeatherForecastAdapter":
        initWeatherForecastAdapter(arguments.slice(1))
        break;    
    case "UsersProfessionsConsumer":
        initUsersProfessionsConsumer(arguments.slice(1))
        break;  
    case "ProfessionInfoConsumer":
        initProfessionInfoConsumer(arguments.slice(1))
        break;  
    case "MongoDbMessagesTester":
        initMongoDbMessagesTester(arguments.slice(1))
        break;    
    case "MongoTestMaster":
        initMongoTestMaster(arguments.slice(1))
        break;    
    case "MongoAtAggregatorTester":
        initMongoAtAggregatorTester(arguments.slice(1))
        break;    
    case "help":
        showHelp()
        break;

    default:
        showHelp()
        break;
}
}

function initProfessionInfoConsumer(args){
    var consumer=new ProfessionInfoConsumer(jsap)
    if(args[0]=="--test"){
        consumer.test()
    }else{
        consumer.start()
    }
}
function initMongoAtAggregatorTester(args){
    var tester=new MongoAtAggregatorTester(jsap,args)
    //tester.log.loglevel=0;
    tester.startMaster()   
}
function initMongoTestMaster(args){
    var tester=new MongoTestMaster(jsap,args)
    //tester.log.loglevel=0;
    tester.startMaster()   
}
function initMongoDbMessagesTester(args){
    var test=new MongoDbMessagesTester(jsap,args)
    test.start()
}
function initUsersProfessionsConsumer(args){
    var consumer=new UsersProfessionsConsumer(jsap)
    if(args[0]=="--test"){
        consumer.test()
    }else{
        consumer.start()
    }
}

function initWeatherForecastAdapter(args){
    var adapter=new WeatherForecastAdapter(jsap,args)
    //tester.log.loglevel=0;
    adapter.start()      
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
async function load_and_override_jsap(file){
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
