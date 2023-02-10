var TestFactory=require('../../gregnet_modules/PacFactory/TestFactory.js');
var AwMapper=require('../AwMapper.js');
var AwProducerTest=require('./AwProducerTest.js');
var AwMessagesProducer=require("../AwMessagesProducer.js") 

require("./greg_events.json.js")

class AwMapperTester extends TestFactory{
    constructor(jsap){
        //TITLE
        console.log("App: AwMapperTester v0.1");
        console.log("###########################");
        
        
        //INSERT HERE MODULES THAT NEED TO BE STARTED
        var modulesDefinition={
            "AwMapper":AwMapper
        }
        //INSERT HERE GRAPHS AND FLAGS WHICH NEED TO BE CLEANED
        var testGraphs=[
            "http://www.vaimee.it/my2sec/messages/activitywatch",
            "http://vaimee.it/my2sec/events"
        ];
        var testFlags=[
            "http://www.vaimee.it/my2sec/awproducerflag",
            "http://www.vaimee.it/my2sec/awmapperflag"
        ];
        var loglevel=1;
        super(
            jsap,
            testGraphs,
            testFlags,
            modulesDefinition,
            {
                name:"http://www.vaimee.it/my2sec/awmapperflag", //end condition
                number:1
            },   
            loglevel
        );
        //this.log.loglevel=1;
        this.testEnded=false;
        this.generalCounter=0;
        //this.numberOfEvents=100;
        this.awProducer=new AwProducerTest(jsap);
        //this.awProducer= new AwMessagesProducer(jsap,"http://www.vaimee.it/my2sec/defuser@vaimee.it");
    }

    //@ OVERRIDE
    async test(){
        console.log(" ")
        console.log(" ")
        //console.clear();
        this.log.info("####################")
        this.log.info("My2sec Test started!")
        this.log.info("####################")
       
        //await this.awProducer.send_message();
        //await this.awProducer.set_flag();


        var users=[
            "http://www.vaimee.it/my2sec/defuser@vaimee.it",
            "http://www.vaimee.it/my2sec/gregorio.monari@vaimee.it"
        ]
        this.log.info("Producing events")
        await this.awProducer.send_messages(users[0]);
        //await this.awProducer.send_messages(users[1]);
        await this.awProducer.set_producer_flag(users[0])
        //await this.awProducer.set_producer_flag(users[1])
        //this.newSubRouter("ALL_USERS_EVENTS",{},"on_new_mapper_event")
        

    }
    

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
        var res=await this.rawQuery(prefixes+" "+jsap.queries.ALL_USERS_TRAINING_EVENTS.sparql)
        //console.log(res)
        res=this.extractResultsBindings(res)
        
        res=res.sort(function(x, y){
            return x.datetimestamp - y.datetimestamp;
        })
        //console.log(res)
        //console.log(res.length)
        
        //TEST 1: NUMBERS
        //this.generalCounter=this.generalCounter+1
        
        this.log.info("MAPPED "+res.length+" events.")

        var testOutcome= await this.graph_is_empty("http://www.vaimee.it/my2sec/messages/activitywatch");
        if(!testOutcome){
            throw new Error("MESSAGE GRAPH IS NOT NOT EMPTY")
        }

        if(res.length==59){
            this.log.info('\x1b[32mTEST PASSED! \x1b[0m');
        }else{
            this.log.info('\x1b[31mTEST FAILED! \x1b[0m');
            throw new Error("TEST FAILED!")
        }

        /*
        if(res.length!=this.numberOfEvents){
            this.log.error(" 1] NUMBER TEST FAILED: WRONG MAPPED EVENTS NUMBER")
        }else{
            this.log.info("1] NUMBER TEST PASSED! =)")
        }



        //TEST 2: EVENTS MATCHING
        var msgvalue=this.import_json_events(this.numberOfEvents)
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
        */
        this.testEnded=true
    }




    /*
    import_json_events(number){
        if(!events_json.hasOwnProperty("buckets")){
            throw new Error("Warning, file is not a valid events json")
        }
        var selected_key=""
        Object.keys(events_json.buckets).forEach(k=>{
            if(k.includes("aw-watcher-working")){
                selected_key=k
            }
        })
        this.log.info("Extracting events of: "+selected_key+"...")
        var eventsArr=events_json.buckets[selected_key].events
        
        //SORT BY TIMESTAMP
        eventsArr=eventsArr.sort(function(x, y){
            return x.timestamp - y.timestamp;
        })
        //SLICE ARRAY
        eventsArr=eventsArr.slice(0,number)

        this.log.info("# Extraction results #")
        this.log.info("- Number of events: "+eventsArr.length)
        var eventsString=JSON.stringify(eventsArr)
        this.log.info("- String length: "+eventsString.length)
        //console.log(eventsArr)
        eventsString=eventsString.replace(/\\/g,"\\\\");//BUGFIX	
        eventsString=eventsString.replace(/\"/g,"\\\"");//BUGFIX
        eventsString=eventsString.replace(/\'/g,"\\\'");//BUGFIX	
        return eventsString
    }
    */

}


module.exports = AwMapperTester;