var TestFactory=require('../../core/TestFactory.js');
var SynchronousConsumer=require('../../core/Pattern/SynchronousConsumer');
var AwProducerTest=require('./AwProducerTest.js');
var AwMapper=require('../../Apps/My2Sec/AwMapper.js');



class TaskAiTester extends TestFactory{
    constructor(jsap){
        //TITLE
        console.log("║║ ###########################");
        console.log("║║ # App: TaskAiTester v0.1");
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
            {
                name:"http://www.vaimee.it/my2sec/awactivitiesaggregatorflag", //end condition
                number: 1
            }
        );
        this.testEnded=false;
        this.generalCounter=0;
        this.log.loglevel=1;
        this.awProducer= new AwProducerTest(jsap);
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
        await this.awProducer.send_messages(users[0]);
        //await this.awProducer.send_messages(users[1]);
        await this.awProducer.set_producer_flag(users[0])
        //await this.awProducer.set_producer_flag(users[1])


        /*
        //NOW WE WAIT FOR ACTIVITIES TO VALIDATE
        this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
            flag_type:"http://www.vaimee.it/my2sec/trainingactivitiesflag"
        },"on_training_activities")
        */
    }
    
    async on_training_activities(flagbind){
        console.log("Received training activities")
        //GET RESULTS
        var activities=this.awTrainingActivitiesConsumer.get_cache_by_user(flagbind.usergraph)
        console.log(activities)
        /*
        var prefixes=""
        Object.keys(jsap.namespaces).forEach(k=>{prefixes=prefixes+` PREFIX ${k}:<${jsap.namespaces[k]}>`})
        prefixes=prefixes.trim()
        //console.log(prefixes+" "+jsap.queries.ALL_USERS_EVENTS.sparql)
        var res=await this.rawQuery(prefixes+" "+jsap.queries.ALL_USERS_TRAINING_ACTIVITIES.sparql)
        res=this.extractResultsBindings(res)
        console.log(res)
        */

        var category=""
        if(activities[0].app=='Discord.exe'){
            category="my2sec:Meeting"
        }else if(activities[0].app=="Code.exe"){
            category="my2sec:Developing"
        }else{
            throw new Error("Unknown category")
        }


        var validated={
            usergraph:flagbind.usergraph,
            event_type:activities[0].event_type,
            app: activities[0].app,
            title: activities[0].title,
            activity_type: category,
            task: "none",
            datetimestamp: activities[0].datetimestamp,
            duration: activities[0].duration
        }

        //console.log(validated)

        
        await this.ADD_VALIDATED_ACTIVITY(validated)
    
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
        console.log(res)             
    }



}


module.exports = TaskAiTester;