var TestFactory=require('../../core/TestFactory.js');
var MongoDbMessagesProducer=require("../../core/Pattern/My2Sec/MongoDbMessagesProducer"); 
const MongoDbMessagesRemover = require('../../core/Pattern/My2Sec/MongoDbMessagesRemover.js');
const MongoProductionFinishedFlagProducer= require("../../core/Pattern/My2Sec/MongoProductionFinishedFlagProducer");
const MongoDbMessagesConsumer = require('../../core/Pattern/My2Sec/MongoDbMessagesConsumer.js');

require("./greg_events.json.js")

class MongoDbMessagesTester extends TestFactory{
    constructor(jsap,args){
        
        //TITLE
        console.log("App: MongoDbProducerTester v0.1");
        console.log("###########################");
        
        
        //INSERT HERE MODULES THAT NEED TO BE STARTED
        var modulesDefinition={
            
        }
        //INSERT HERE GRAPHS AND FLAGS WHICH NEED TO BE CLEANED
        var testGraphs=[
            "http://www.vaimee.it/my2sec/messages/activitywatch/mongo",
        ];
        var testFlags=[
            "http://www.vaimee.it/my2sec/awmongoproducerflag"
        ];
        //var loglevel=1;
        super(
            jsap,
            testGraphs,
            testFlags,
            modulesDefinition,
            {
                name:"http://www.vaimee.it/my2sec/awmongoproducerflag", //end condition
                number:1
            },   
        );

        console.log(args)
        this.multiplier=1;
        if(args[0]=="-m"){
            this.multiplier=parseInt(args[1])
            
        }
        this.iteration=0
        if(args[2]=="-i"){
            this.iteration=parseInt(args[3])
            
        }
        console.log("Multiplier: "+this.multiplier)
        //this.log.loglevel=1;
        this.testEnded=false;
        this.generalCounter=0;
        //this.testJsap=jsap;
        //this.numberOfEvents=100;
        var email="defuser@vaimee.it"
        this.mongoProducer=new MongoDbMessagesProducer(jsap,email);
        this.mongoRemover=new MongoDbMessagesRemover(jsap)
        this.mongoFlagProducer=new MongoProductionFinishedFlagProducer(jsap,email)
        this.mongoMessagesConsumer=new MongoDbMessagesConsumer(jsap)
        this.mongoClient=this.mongoProducer.mongoClient;
        this.startTime;
        this.endTime;
        this.totalEvents=0;
    }

    //@ OVERRIDE
    async test(){
        console.log(" ")
        this.log.info(this.log.wrapColoredSection("cyan","[1/3] tester: PRODUCING MESSAGES"))

        this.mongoMessagesConsumer.subscribeToSepa();

        const singleMessages=await this.fetch_json_messages()
        this.log.trace(singleMessages)
        const resp=this.multiplyMessages(singleMessages,this.multiplier)
        const messages=resp.messages
        this.totalEvents=resp.totalEvents
        console.log(this.totalEvents)

        //throw new Error("MAO")
        //!START PERFORMANCE MEASURE
        this.startTime = process.hrtime();

        var res=await this.mongoProducer.send_messages_to_sepa_and_mongo(messages);
        console.log(res)
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
        this.stopTime=process.hrtime(this.startTime);
        const executionTimeMs=this.stopTime[1]/1e6; //ns / 10^6 = ms

        //console.log("SEND TIME: "+executionTimeMs+"ms")

        console.log(" ")
        this.log.info(this.log.wrapColoredSection("cyan","[2/3] tester: VALIDATING RESULTS"))
        this.log.info("Validating results:")


        console.log("Fetching cache")
        var cache=this.mongoMessagesConsumer.get_cache();
        //console.log(cache)
        if(!cache.has("http://www.vaimee.it/my2sec/defuser@vaimee.it")){
            this.log.error(this.log.wrapColor("red","TEST FAILED!"));
            throw new Error("Cache missing user entry")
        }
        var userCache=cache.get("http://www.vaimee.it/my2sec/defuser@vaimee.it")

        if(userCache.size!=4){
            this.log.error(this.log.wrapColor("red","TEST FAILED!"));
            throw new Error("Wrong number of messages")
        }



        //REMOVING MESSAGES
        console.log("Fetching consumer cache")
        var cache=this.mongoMessagesConsumer.get_cache();
        this.log.debug(cache)
        var userCache=cache.get("http://www.vaimee.it/my2sec/defuser@vaimee.it")
        //console.log(userCache)
        for (let [uuid, value] of  userCache.entries()) {
            var object_id=value.get("msgvalue");
            const binding={
                message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch/mongo",
                message:uuid
            }
            await this.mongoRemover.updateSepaAndMongo(binding,object_id)
        }
        

        this.log.info(this.log.wrapColor("BgGreen","TEST PASSED!"))
        this.log.info(this.log.wrapColor("BgGreen","Updated "+this.totalEvents+" events in "+executionTimeMs+"ms"))
            //this.log.info('\x1b[32mTEST PASSED! \x1b[0m');

        this.saveTestResults(
            "./test_results.json",
            "MongoDbMessagesTest",
            "ms",
            this.multiplier,
            this.totalEvents,
            executionTimeMs,
            this.iteration
        )


        this.testEnded=true
    }

    async saveTestResults(file,name,unit,multiplier,totalEvents,exeTime,iteration){
        console.log("Saving test results")
        var json;
        try{
            var fileobj=this.read(file)
            json=JSON.parse(fileobj)
        }catch(e){
            json={
                "name":name,
                "unit":unit,
                "results":{}
            }
        }

        var multiplierStr=multiplier.toString()
        if(!json.results.hasOwnProperty(multiplierStr)){
            json.results[multiplierStr]={
                "totalEvents":totalEvents,
                "data":[]
            }
        }
        json.results[multiplierStr].data.push(exeTime)
        this.write(file,JSON.stringify(json))
    }

    write(path,data){
        const fs=require("fs")
        fs.writeFileSync(path,data);
        return true
    }

    read(path){
        const fs=require("fs")
        const data = fs.readFileSync(path,
            { encoding: 'utf8', flag: 'r' });
        return data
    }


}


module.exports = MongoDbMessagesTester;