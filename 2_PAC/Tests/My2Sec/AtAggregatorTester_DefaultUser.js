var TestFactory=require('../../core/TestFactory.js');
var SynchronousConsumer=require('../../core/Pattern/SynchronousConsumer');
var AwTrainingActivitiesConsumer=require("../../core/Pattern/My2Sec/AwTrainingActivitiesConsumer")
//var AwProducerTest=require('./AwProducerTest.js');
var AwMapper=require('../../Apps/My2Sec/AwMapper.js');
var AtAggregator = require("../../Apps/My2Sec/ActivityTypeAggregator/AtAggregator.js");
const AwMessagesProducer = require('../../Apps/My2Sec/AwMessagesProducer.js');

var MongoDbMessagesProducer=require("../../core/Pattern/My2Sec/MongoDbMessagesProducer"); 
const MongoDbMessagesRemover = require('../../core/Pattern/My2Sec/MongoDbMessagesRemover.js');
const MongoProductionFinishedFlagProducer= require("../../core/Pattern/My2Sec/MongoProductionFinishedFlagProducer");
const MongoDbMessagesConsumer = require('../../core/Pattern/My2Sec/MongoDbMessagesConsumer.js');

class AtAggregatorTester extends TestFactory{
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
            "http://www.vaimee.it/my2sec/messages/activitywatch/mongo",
            "http://vaimee.it/my2sec/events",
            "http://vaimee.it/my2sec/activities"
        ];
        var testFlags=[
            "http://www.vaimee.it/my2sec/awmongoproducerflag",
            "http://www.vaimee.it/my2sec/awmapperflag",
            "http://www.vaimee.it/my2sec/trainingactivitiesflag",
            "http://www.vaimee.it/my2sec/validatedactivitiesflag",
            "http://www.vaimee.it/my2sec/awactivitiesaggregatorflag",
        ];
        var modules_initial_loglevel=1
        super(
            jsap,
            testGraphs,
            testFlags,
            modulesDefinition,
            {
                name:"http://www.vaimee.it/my2sec/awactivitiesaggregatorflag", //end condition
                number: 1
            },
            modules_initial_loglevel
        );
        this.testEnded=false;
        this.generalCounter=0;
        //this.log.loglevel=1;
        this.awMessagesProducer= new AwMessagesProducer(jsap,"http://www.vaimee.it/my2sec/defuser@vaimee.it")//new AwProducerTest(jsap);
        //Configure awTrainingActivitiesConsumer and flag remover
        var _activities_graph="http://vaimee.it/my2sec/activities"
        var _trainingActivitiesFlag="http://www.vaimee.it/my2sec/trainingactivitiesflag";
        this.awTrainingActivitiesConsumer=new AwTrainingActivitiesConsumer(jsap,_activities_graph,_trainingActivitiesFlag)//new SynchronousConsumer(jsap,trainactivitiesquery,data,trainactivities_flag,false);
        console.log(this.awTrainingActivitiesConsumer.flagname)
        this.awTrainingActivitiesConsumer.em.on("newsyncflag",not=>{this.on_training_activities(not)}) //when the flag consumer emits a flag
        

        var email="defuser@vaimee.it"
        this.mongoProducer=new MongoDbMessagesProducer(jsap,email);
        this.mongoRemover=new MongoDbMessagesRemover(jsap)
        this.mongoFlagProducer=new MongoProductionFinishedFlagProducer(jsap,email)
        this.mongoMessagesConsumer=new MongoDbMessagesConsumer(jsap)
        this.mongoClient=this.mongoProducer.mongoClient;


    }

    

    //@ OVERRIDE
    async test(){
        console.log(" ")
        console.log(" ")
        this.awTrainingActivitiesConsumer.subscribeToSepa();
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

    
    
    async on_training_activities(flagbind){
        //GET RESULTS
        var activities=this.awTrainingActivitiesConsumer.get_cache_by_user(flagbind.usergraph)
        console.log("(AtAggregatorTester) Received "+activities.length+" training activities")
        /*
        var prefixes=""
        Object.keys(jsap.namespaces).forEach(k=>{prefixes=prefixes+` PREFIX ${k}:<${jsap.namespaces[k]}>`})
        prefixes=prefixes.trim()
        //console.log(prefixes+" "+jsap.queries.ALL_USERS_EVENTS.sparql)
        var res=await this.rawQuery(prefixes+" "+jsap.queries.ALL_USERS_TRAINING_ACTIVITIES.sparql)
        res=this.extractResultsBindings(res)
        console.log(res)
        */

        for(var i in activities){
            var category=""
            switch (activities[i].app) {
                case "Eclipse":
                    category="my2sec:Developing"
                    break;
                case "Discord.exe":
                    category="my2sec:Meeting"
                    break;
                case "Code.exe":
                    category="my2sec:Developing"
                    break;
                case "Safari":
                    category="my2sec:Researching"
                    break;
                
                //greg
                case "notepad.exe":
                    category="my2sec:Developing"
                    break;
                case "chrome.exe":
                    category="my2sec:Developing"
                    break;
                case "powershell.exe":
                    category="my2sec:Developing"
                    break;
            
                default:
                    throw new Error("Error, unknown category")
            }
    
            var validated={
                usergraph:flagbind.usergraph,
                event_type:activities[i].event_type,
                app: activities[i].app,
                title: activities[i].title,
                activity_type: category,
                task: "none",
                datetimestamp: activities[i].datetimestamp,
                duration: activities[i].duration
            }
    
            //console.log(validated)
    
            await this.ADD_VALIDATED_ACTIVITY(validated)

            validated={};
        }
        
        
        var activitiesresponse=await this.SET_SYNCHRONIZATION_FLAG({
            flag_type:"http://www.vaimee.it/my2sec/validatedactivitiesflag",
            usergraph:flagbind.usergraph
        })

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
        //console.log(res)         
        
        if(res.length==0){
            throw new Error("TEST FAILED")
        }





        //var testOutcome=true;
        this.log.info("Validating removed results")
        //console.log(Object.keys(this.testGraphs))
        var res=await this.graph_is_empty("http://vaimee.it/my2sec/events")
        if(!res){
            throw new Error("TRAINING EVENTS NOT REMOVED")
        }

        res=await this.validatedActivity_is_empty()
        if(!res){
            throw new Error("VALIDATED ACTIVITIES NOT REMOVED")
        }
        this.log.info("All tests passed")
    }



    async validatedActivity_is_empty(){
        var prefixes="PREFIX my2sec: <http://www.vaimee.it/ontology/my2sec#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>"
        var res=await this.rawQuery(prefixes+" SELECT * WHERE {GRAPH <http://vaimee.it/my2sec/activities> { ?s rdf:type my2sec:ValidatedActivity }}")
        res=this.extractResultsBindings(res)
        console.log(res)
        if(res.length!=0){
            return false
        }
        return true
    }

}


module.exports = AtAggregatorTester;