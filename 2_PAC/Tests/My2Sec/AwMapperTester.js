var TestFactory=require('../../core/TestFactory.js');
var AwMapper=require('../../Apps/My2Sec/AwMapper.js');
var AwProducerTest=require('./AwProducerTest.js');
var AwMessagesProducer=require("../../Apps/My2Sec/AwMessagesProducer.js") 
var MongoDbMessagesProducer=require("../../core/Pattern/My2Sec/MongoDbMessagesProducer"); 
const MongoDbMessagesRemover = require('../../core/Pattern/My2Sec/MongoDbMessagesRemover.js');
const MongoProductionFinishedFlagProducer= require("../../core/Pattern/My2Sec/MongoProductionFinishedFlagProducer");
const MongoDbMessagesConsumer = require('../../core/Pattern/My2Sec/MongoDbMessagesConsumer.js');

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
            "http://www.vaimee.it/my2sec/messages/activitywatch/mongo",
            "http://vaimee.it/my2sec/events"
        ];
        var testFlags=[
            "http://www.vaimee.it/my2sec/awmongoproducerflag",
            "http://www.vaimee.it/my2sec/awmapperflag"
        ];
        //var loglevel=1;
        super(
            jsap,
            testGraphs,
            testFlags,
            modulesDefinition,
            {
                name:"http://www.vaimee.it/my2sec/awmapperflag", //end condition
                number:1
            },   
        );
        //this.log.loglevel=1;
        this.testEnded=false;
        this.generalCounter=0;
        //this.numberOfEvents=100;
        var email="defuser@vaimee.it"
        this.mongoProducer=new MongoDbMessagesProducer(jsap,email);
        this.mongoRemover=new MongoDbMessagesRemover(jsap)
        this.mongoFlagProducer=new MongoProductionFinishedFlagProducer(jsap,email)
        this.mongoMessagesConsumer=new MongoDbMessagesConsumer(jsap)
        this.mongoClient=this.mongoProducer.mongoClient;
        //this.awProducer= new AwMessagesProducer(jsap,"http://www.vaimee.it/my2sec/defuser@vaimee.it");
    }

    //@ OVERRIDE
    async test(){
        console.log(" ")
        console.log(" ")
        //console.clear();
        /*this.log.info("####################")
        this.log.info("My2sec Test started!")
        this.log.info("####################")*/
        //this.log.info("-----------------------------------------<"+this.log.wrapColor("blue","MY2SEC TEST STARTED")+">------------------------------------------")
        this.log.info(this.log.wrapColoredSection("cyan","[1/3] tester: PRODUCING MESSAGES"))

        const singleMessages=await this.fetch_json_messages()
        this.log.trace(singleMessages)
        const resp=this.multiplyMessages(singleMessages,1)
        const messages=resp.messages
        this.totalEvents=resp.totalEvents
        console.log(this.totalEvents)

        //throw new Error("MAO")
        //!START PERFORMANCE MEASURE
        this.startTime = process.hrtime();

        var res=await this.mongoProducer.send_messages_to_sepa_and_mongo(messages);
        console.log(res)


        this.log.info(this.log.wrapColoredSection("cyan","[2/3] mapper: MAPPING MESSAGES"))
        await this.mongoFlagProducer.updateSepa();
        
        //var file=await this.mongoClient.getFileByObjectId('6479c6a0574f73c894ddd44c')
        //console.log(file)

        //throw new Error("MAO")

    }
    multiplyMessages(singleMessages,multiplier){
        console.log("Multiplying messages")
        var temp={};
        for(var k in singleMessages){
            temp[k]=[]
        }

        for(var i=0; i<multiplier;i++){
            //console.log("Lap "+i)
            for(var k in singleMessages){
                temp[k]=temp[k].concat(singleMessages[k])
            }
        }

        var totalSize=0;
        for(var i in temp){
            totalSize=totalSize+temp[i].length
        }


        return {
            messages:temp,
            totalEvents:totalSize
        } 
    }
    async fetch_json_messages(){
        var stringArr=[];
        stringArr[0]=await this.readFile("./Tests/My2Sec/lucabug_23012023/working.txt")
        stringArr[1]=await this.readFile("./Tests/My2Sec/lucabug_23012023/afk.txt")
        stringArr[2]=await this.readFile("./Tests/My2Sec/lucabug_23012023/startstop.txt")
        stringArr[3]=await this.readFile("./Tests/My2Sec/lucabug_23012023/notshutdown.txt")
        var msgarr={};
        //for(var i in stringArr){
        msgarr["aw-watcher-working"]=JSON.parse(stringArr[0].replace(/\\/g,""))
        msgarr["aw-watcher-afk"]=JSON.parse(stringArr[1].replace(/\\/g,""))
        msgarr["aw-watcher-start-stop"]=JSON.parse(stringArr[2].replace(/\\/g,""))
        msgarr["aw-watcher-notshutdown"]=JSON.parse(stringArr[3].replace(/\\/g,""))
        //}
        return msgarr;
    }

    async on_test_finished(){
        console.log(" ")
        this.log.info(this.log.wrapColoredSection("cyan","[3/3] tester: VALIDATING RESULTS"))
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

        var testOutcome= await this.graph_is_empty("http://www.vaimee.it/my2sec/messages/activitywatch/mongo");
        if(!testOutcome){
            throw new Error("MESSAGE GRAPH IS NOT NOT EMPTY")
        }

        if(res.length==59){
            this.log.info(this.log.wrapColor("BgGreen","TEST PASSED!"))
            //this.log.info('\x1b[32mTEST PASSED! \x1b[0m');
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