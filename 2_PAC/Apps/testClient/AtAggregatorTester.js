var TestFactory=require('../../gregnet_modules/PacFactory/TestFactory.js');
var SynchronousConsumer=require('../../gregnet_modules/PacFactory/Pattern/SynchronousConsumer');
//var AwProducerTest=require('./AwProducerTest.js');
var AwMapper=require('../AwMapper.js');
var AtAggregator = require("../ActivityTypeAggregator/AtAggregator.js");
const AwMessagesProducer = require('../AwMessagesProducer.js');


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
        var trainactivitiesquery="ALL_USERS_TRAINING_ACTIVITIES";
        var data={};
        var trainactivities_flag="http://www.vaimee.it/my2sec/trainingactivitiesflag";
        this.awTrainingActivitiesConsumer=new SynchronousConsumer(jsap,trainactivitiesquery,data,trainactivities_flag,false);
        this.awTrainingActivitiesConsumer.log.loglevel=this.log.loglevel;
        console.log(this.awTrainingActivitiesConsumer.flagname)
        this.awTrainingActivitiesConsumer.em.on("newsyncflag",not=>{this.on_training_activities(not)}) //when the flag consumer emits a flag
        
    }

    

    //@ OVERRIDE
    async test(){
        console.log(" ")
        console.log(" ")
        this.awTrainingActivitiesConsumer.subscribeToSepa();
        this.log.info("####################")
        this.log.info("My2sec Test started!")
        this.log.info("####################")
        
        var users=[
            "http://www.vaimee.it/my2sec/defuser@vaimee.it",
            "http://www.vaimee.it/my2sec/gregorio.monari@vaimee.it"
        ]
        this.log.info("Producing events")
        //await this.awProducer.send_messages(users[0]);
        //await this.awProducer.send_messages(users[1]);
        //await this.awProducer.set_producer_flag(users[0])
        //await this.awProducer.set_producer_flag(users[1])
        try{
            await this.awMessagesProducer.send_message();
            await this.awMessagesProducer.set_flag();
        }catch(e){
            console.log(e.response.data.error_description)
        }



        /*
        //NOW WE WAIT FOR ACTIVITIES TO VALIDATE
        this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
            flag_type:"http://www.vaimee.it/my2sec/trainingactivitiesflag"
        },"on_training_activities")
        */
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