var TestFactory=require('../../gregnet_modules/PacFactory/TestFactory.js');
var AwMapper=require('../AwMapper.js');
var AtAggregator = require("../ActivityTypeAggregator/AtAggregator.js");
require("./greg_events.json.js")
require("./aw-watcher-afk.json.js")
require("./aw-watcher-start-stop.json.js")
require("./aw-watcher-notshutdown.json.js")

class My2secTester extends TestFactory{
    constructor(jsap){
        //TITLE
        console.log("║║ ###########################");
        console.log("║║ # App: My2secTester v0.1");
        console.log("║║ ###########################");
        
        //INSERT HERE MODULES THAT NEED TO BE STARTED
        var modulesDefinition={
            "AwMapper":AwMapper,
            "AtAggregator":AtAggregator
        }
        //INSERT HERE GRAPHS AND FLAGS WHICH NEED TO BE CLEANED
        var testGraphs=[
            "http://www.vaimee.it/my2sec/messages/activitywatch",
            "http://vaimee.it/my2sec/events",
            "http://vaimee.it/my2sec/activities"
        ];
        var testFlags=[
            "http://www.vaimee.it/my2sec/awproducerflag",
            "http://www.vaimee.it/my2sec/awmapperflag",
            "http://www.vaimee.it/my2sec/trainingactivitiesflag",
            "http://www.vaimee.it/my2sec/validatedactivitiesflag",
            "http://www.vaimee.it/my2sec/awactivitiesaggregatorflag",
        ];
        super(
            jsap,
            testGraphs,
            testFlags,
            modulesDefinition,
            "http://www.vaimee.it/my2sec/awactivitiesaggregatorflag" //end condition
        );
        this.testEnded=false;
        this.generalCounter=0;
        this.numberOfEvents=100;
    }

    

    //@ OVERRIDE
    async test(){
        console.log(" ")
        console.log(" ")
        this.log.info("####################")
        this.log.info("My2sec Test started!")
        this.log.info("####################")
        
        //IMPORT EVENTS
        this.log.info("----- 1] Import events -----")
        var msgarr=this.import_json_events(this.numberOfEvents)
        //UPDATE EVENTS
        this.log.info("----- 2] Update events -----")
        var response=await this.SEND_MESSAGE({
            message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it",
            source:"http://www.vaimee.it/sources/aw-watcher-working",
            msgtimestamp:new Date().toISOString(),
            msgvalue:msgarr[0]
        })
        this.log.info("SEND_MESSAGE response: "+JSON.stringify(response))
        //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
        response=await this.SEND_MESSAGE({
            message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it",
            source:"http://www.vaimee.it/sources/aw-watcher-afk",
            msgtimestamp:new Date().toISOString(),
            msgvalue:msgarr[1]
        })
        this.log.info("SEND_MESSAGE response: "+JSON.stringify(response))
        //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
        response=await this.SEND_MESSAGE({
            message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it",
            source:"http://www.vaimee.it/sources/aw-watcher-start-stop",
            msgtimestamp:new Date().toISOString(),
            msgvalue:msgarr[2]
        })
        this.log.info("SEND_MESSAGE response: "+JSON.stringify(response))
        //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
        response=await this.SEND_MESSAGE({
            message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it",
            source:"http://www.vaimee.it/sources/aw-watcher-notshutdown",
            msgtimestamp:new Date().toISOString(),
            msgvalue:msgarr[3]
        })
        this.log.info("SEND_MESSAGE response: "+JSON.stringify(response))
        //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
        this.log.info("Sending Synch flag")
        var response=await this.SET_SYNCHRONIZATION_FLAG({
            flag_type:"http://www.vaimee.it/my2sec/awproducerflag",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it"
        })
        this.log.info("SET_SYNC_FLAG response: "+JSON.stringify(response))


        //NOW WE WAIT FOR ACTIVITIES TO VALIDATE

        this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
            flag_type:"http://www.vaimee.it/my2sec/trainingactivitiesflag"
        },"on_training_activities")

    }
    
    async on_training_activities(not){
        //GET RESULTS
        var prefixes=""
        Object.keys(jsap.namespaces).forEach(k=>{prefixes=prefixes+` PREFIX ${k}:<${jsap.namespaces[k]}>`})
        prefixes=prefixes.trim()
        //console.log(prefixes+" "+jsap.queries.ALL_USERS_EVENTS.sparql)
        var res=await this.rawQuery(prefixes+" "+jsap.queries.ALL_USERS_EVENTS.sparql)
        res=this.extractResultsBindings(res)

        if(res.length==0){
            var response=await this.SET_SYNCHRONIZATION_FLAG({
                flag_type:"http://www.vaimee.it/my2sec/validatedactivitiesflag",
                usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it"
            })           
        }

    }


/*
    async on_test_finished(){
        this.log.info("##################")
        this.log.info("MY2SEC TEST ENDED")
        this.log.info("##################")
        this.log.info("Validating results:")

        //GET RESULTS
        var prefixes=""
        Object.keys(jsap.namespaces).forEach(k=>{prefixes=prefixes+` PREFIX ${k}:<${jsap.namespaces[k]}>`})
        prefixes=prefixes.trim()
        //console.log(prefixes+" "+jsap.queries.ALL_USERS_EVENTS.sparql)
        var res=await this.rawQuery(prefixes+" "+jsap.queries.ALL_USERS_EVENTS.sparql)
        res=this.extractResultsBindings(res)
        
        res=res.sort(function(x, y){
            return x.datetimestamp - y.datetimestamp;
        })
        //console.log(res)
        //console.log(res.length)
        
        //TEST 1: NUMBERS
        //this.generalCounter=this.generalCounter+1
        this.log.info("MAPPED "+res.length+" events.")
        
        if(res.length!=this.numberOfEvents){
            this.log.error(" 1] NUMBER TEST FAILED: WRONG MAPPED EVENTS NUMBER")
        }else{
            this.log.info("1] NUMBER TEST PASSED! =)")
        }



        //TEST 2: EVENTS MATCHING
        var msgarr=this.import_json_events(this.numberOfEvents)
        var msgvalue=msgarr[0];
        msgvalue=msgvalue.replace(/\\\\/g,"\\");
        msgvalue=msgvalue.replace(/\\\"/g,"\"");//BUGFIX
        msgvalue=msgvalue.replace(/\\\'/g,"\'");//BUGFIX
        msgvalue=JSON.parse(msgvalue)
        //console.log(msgvalue)
        for(var i=0; i<0; i++){
            console.log("Event: #"+i)
            console.log(msgvalue[i])
            console.log(res[i])
        }
    
        var total_validation=true
        var failed=0
        for(var i=0; i<msgvalue.length; i++){
            var found=false
            for(var j=0; j<res.length; j++){
                //console.log(msgvalue[j].data.app)
                if(
                    msgvalue[i].data.app==res[j].app
                    &&
                    msgvalue[i].data.title==res[j].title
                    &&
                    msgvalue[i].timestamp==res[j].datetimestamp
                ){
                    //console.log(msgvalue[j])
                    //console.log(res[i])                    
                    found=true
                }
            }
            if(found==false){
                total_validation=false;
                failed++
                //validated=i
                //console.log(msgvalue[i])
                //break
            }
        }

        if(total_validation==true){
            this.log.info("2] ALL EVENTS TEST PASSED!")
        }else{

            var red=""
            console.log("\x1b[31m 2] ALL EVENTS TEST FAILED! SOME EVENTS ARE MISSING OR NOT MATCHING \x1b[0m");
            
            this.log.info("validated events: "+(i-failed))
            this.log.info("failed: "+failed)
        }

        console.log(" ")
        console.log(" ")
        this.testEnded=true
    }
*/
    async on_test_finished(){
        this.log.info("##################")
        this.log.info("MY2SEC TEST ENDED")
        this.log.info("##################")
        this.log.info("Validating results:")        
    }


    
    import_json_events(number){
        if(
            !events_json.hasOwnProperty("buckets") ||
            !afk_json.hasOwnProperty("buckets") ||
            !start_stop_json.hasOwnProperty("buckets")
        ){
            throw new Error("Warning, file is not a valid events json")
        }
        var selected_working_key=""
        var selected_afk_key=""
        var selected_start_stop_key=""
        var selected_notshutdown_key=""
        Object.keys(events_json.buckets).forEach(k=>{
            if(k.includes("aw-watcher-working")){
                selected_working_key=k
            }
        })
        this.log.info("Extracting events of: "+selected_working_key+"...")
        var eventsArr=events_json.buckets[selected_working_key].events
        
        Object.keys(afk_json.buckets).forEach(k=>{
            if(k.includes("aw-watcher-afk")){
                selected_afk_key=k
            }
        })
        this.log.info("Extracting events of: "+selected_afk_key+"...")
        var afkArr=afk_json.buckets[selected_afk_key].events
        
        Object.keys(start_stop_json.buckets).forEach(k=>{
            if(k.includes("aw-watcher-start-stop")){
                selected_start_stop_key=k
            }
        })
        this.log.info("Extracting events of: "+selected_start_stop_key+"...")
        var startstopArr=start_stop_json.buckets[selected_start_stop_key].events
        
        Object.keys(notshutdown_json.buckets).forEach(k=>{
            if(k.includes("aw-watcher-notshutdown")){
                selected_notshutdown_key=k
            }
        })
        this.log.info("Extracting events of: "+selected_notshutdown_key+"...")
        var notshutdownArr=notshutdown_json.buckets[selected_notshutdown_key].events

        //SORT BY TIMESTAMP
        eventsArr=eventsArr.sort(function(x, y){
            return x.timestamp - y.timestamp;
        })
        afkArr=afkArr.sort(function(x, y){
            return x.timestamp - y.timestamp;
        })
        startstopArr=startstopArr.sort(function(x, y){
            return x.timestamp - y.timestamp;
        })
        notshutdownArr=notshutdownArr.sort(function(x, y){
            return x.timestamp - y.timestamp;
        })
        //SLICE ARRAY
        eventsArr=eventsArr.slice(0,number)
        afkArr=afkArr.slice(0,number)
        startstopArr=startstopArr.slice(0,number)
        notshutdownArr=notshutdownArr.slice(0,number)

        this.log.info("# Working Extraction results #")
        this.log.info("- Number of events: "+eventsArr.length)
        var eventsString=JSON.stringify(eventsArr)
        this.log.info("- String length: "+eventsString.length)
        this.log.info("# Afk Extraction results #")
        this.log.info("- Number of events: "+afkArr.length)
        var afkString=JSON.stringify(afkArr)
        this.log.info("- String length: "+afkString.length)
        this.log.info("# Start Stop Extraction results #")
        this.log.info("- Number of events: "+startstopArr.length)
        var startstopString=JSON.stringify(startstopArr)
        this.log.info("- String length: "+startstopString.length)
        this.log.info("# Notshutdown Extraction results #")
        this.log.info("- Number of events: "+notshutdownArr.length)
        var notshutdownString=JSON.stringify(notshutdownArr)
        this.log.info("- String length: "+notshutdownString.length)
        //console.log(eventsArr)
        eventsString=eventsString.replace(/\\/g,"\\\\");//BUGFIX	
        eventsString=eventsString.replace(/\"/g,"\\\"");//BUGFIX
        eventsString=eventsString.replace(/\'/g,"\\\'");//BUGFIX	
        return [eventsString,afkString,startstopString,notshutdownString];
    }


}


module.exports = My2secTester;