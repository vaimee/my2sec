var TestFactory=require('../../gregnet_modules/PacFactory/TestFactory.js');
var AwProducerTest=require('./AwProducerTest.js');
var AwMapper=require('../AwMapper.js');
var AtAggregator = require("../ActivityTypeAggregator/AtAggregator.js");
var OpAdapter = require("../OpAdapter.js");
const OpConsumer = require('../OpConsumer.js');


class My2secTester extends TestFactory{
    constructor(jsap){
        //TITLE
        console.log("║║ ###########################");
        console.log("║║ # App: My2secTester v0.1");
        console.log("║║ ###########################");
        
        //INSERT HERE MODULES THAT NEED TO BE STARTED
        var modulesDefinition={
            "AwMapper":AwMapper,
            "AtAggregator":AtAggregator,
            "OpAdapter": OpAdapter,
            "OpConsumer": OpConsumer
        }
        //INSERT HERE GRAPHS AND FLAGS WHICH NEED TO BE CLEANED
        var testGraphs=[
            "http://www.vaimee.it/my2sec/messages/activitywatch",
            "http://vaimee.it/my2sec/events",
            "http://vaimee.it/my2sec/activities",
            "http://www.vaimee.it/projects#",
            "http://www.vaimee.it/my2sec/logtime"
        ];
        var testFlags=[
            "http://www.vaimee.it/my2sec/awproducerflag",
            "http://www.vaimee.it/my2sec/awmapperflag",
            "http://www.vaimee.it/my2sec/trainingactivitiesflag",
            "http://www.vaimee.it/my2sec/validatedactivitiesflag",
            "http://www.vaimee.it/my2sec/awactivitiesaggregatorflag",
            "http://www.vaimee.it/my2sec/testfinished"
        ];
        super(
            jsap,
            testGraphs,
            testFlags,
            modulesDefinition,
            "http://www.vaimee.it/my2sec/testfinished" //awactivitiesaggregatorflag" //end condition
        );
        this.testEnded=false;
        this.generalCounter=0;

        this.awProducer= new AwProducerTest(jsap);
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
        this.awProducer.send_messages("http://www.vaimee.it/my2sec/defuser@vaimee.it");
        //NOW WE WAIT FOR ACTIVITIES TO VALIDATE
        this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
            flag_type:"http://www.vaimee.it/my2sec/trainingactivitiesflag"
        },"on_training_activities")
        this.newSubRouter("ALL_LOG_TIMES",{},"on_log_times")
    }
    
    async on_training_activities(not){
        //GET RESULTS
        
        var prefixes=""
        Object.keys(jsap.namespaces).forEach(k=>{prefixes=prefixes+` PREFIX ${k}:<${jsap.namespaces[k]}>`})
        prefixes=prefixes.trim()
        //console.log(prefixes+" "+jsap.queries.ALL_USERS_EVENTS.sparql)
        var res=await this.rawQuery(prefixes+" "+jsap.queries.ALL_USERS_TRAINING_ACTIVITIES.sparql)
        res=this.extractResultsBindings(res)
        console.log(res)

        var category=""
        if(res[0].app=='Discord.exe'){
            category="my2sec:Meeting"
        }else if(res[0].app=="Code.exe"){
            category="my2sec:Developing"
        }else{
            throw new Error("Unknown category")
        }


        var validated={
            usergraph:res[0].user_graph,
            event_type:res[0].event_type,
            app: res[0].app,
            title: res[0].title,
            activity_type: category,
            task: "none",
            datetimestamp: res[0].datetimestamp,
            duration: res[0].duration
        }

        //console.log(validated)

        
        await this.ADD_VALIDATED_ACTIVITY(validated)
    
        var response=await this.SET_SYNCHRONIZATION_FLAG({
            flag_type:"http://www.vaimee.it/my2sec/validatedactivitiesflag",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it"
        })

    }


    async on_log_times(not){
        console.log(not)
        /*var response=await this.SET_SYNCHRONIZATION_FLAG({
            flag_type:"http://www.vaimee.it/my2sec/testfinished",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it"
        })*/
    }


    async on_test_finished(){
        this.log.info("##################")
        this.log.info("MY2SEC TEST ENDED")
        this.log.info("##################")
        this.log.info("Validating results:")
        var prefixes=""
        Object.keys(jsap.namespaces).forEach(k=>{prefixes=prefixes+` PREFIX ${k}:<${jsap.namespaces[k]}>`})
        prefixes=prefixes.trim()
        //console.log(prefixes+" "+jsap.queries.ALL_USERS_EVENTS.sparql)
        var res=await this.rawQuery(prefixes+" "+jsap.queries.ALL_USERS_ACTIVITIES.sparql)
        res=this.extractResultsBindings(res)
        console.log(res)             
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


}


module.exports = My2secTester;