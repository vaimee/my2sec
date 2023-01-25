var TestFactory=require('../../gregnet_modules/PacFactory/TestFactory.js');
var SynchronousConsumer=require('../../gregnet_modules/PacFactory/Pattern/SynchronousConsumer');
var Producer=require('../../gregnet_modules/PacFactory/Pattern/Producer');
var AwProducerTest=require('./AwProducerTest.js');
var AwMapper=require('../AwMapper.js');
var AtAggregator = require("../ActivityTypeAggregator/AtAggregator.js");
var OpAdapter=require('../OpAdapter.js');
const { spawn } = require('child_process');

class My2secTester extends TestFactory{
    constructor(jsap){
        //TITLE
        console.log("║║ ###########################");
        console.log("║║ # App: My2secTester v0.1.1");
        console.log("║║ ###########################");
        
        //INSERT HERE MODULES THAT NEED TO BE STARTED
        var modulesDefinition={
            "AwMapper":AwMapper,
            "AtAggregator":AtAggregator,
            //"OpAdapter":OpAdapter
        }
        //INSERT HERE GRAPHS AND FLAGS WHICH NEED TO BE CLEANED
        var testGraphs=[
            "http://www.vaimee.it/my2sec/messages/activitywatch",
            "http://vaimee.it/my2sec/events",
            "http://vaimee.it/my2sec/activities",
            "http://www.vaimee.it/projects#",
            "http://www.vaimee.it/my2sec/logtime",
            "http://www.vaimee.it/my2sec/flags"
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
            {
                name:"http://www.vaimee.it/my2sec/testfinished", //end condition
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
        

        this.newSubRouter("ALL_LOG_TIMES",{},"on_log_time")
        this.opAdapter=new OpAdapter(jsap)
        this.flagProducer=new Producer(jsap,"SET_SYNCHRONIZATION_FLAG")

        //var rootFolder="/usr/src/mymaven/Projects/VaimeeTools/tools/target"
        //var args=["exec","-it","dev_maven_1",'-jar',rootFolder+"/tools-0.0.1-SNAPSHOT.jar","-jsap",rootFolder+"/tool.taskai.localhost.jsap"]
        try{
            //this.start_taskai('docker',args)
        }catch(e){
            console.log(e)
        }
       this.logTimesReceived=0;
        //TASKAI

    }

    //java -jar ./target/tools-0.0.1-SNAPSHOT.jar -jsap ./target/tool.taskai.jsap
    async start_taskai(app,args){
        return new Promise(resolve=>{         
            const child = spawn(app, args);

            child.stdout.on('data', (data) => {
                console.log(`${data}`);
            });
    
            child.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
              
            child.on('error', (error) => {
                console.error(`error: ${error.message}`);
                //throw new Error("TEST ERROR"+data)
            });
              
            child.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                var res;
                if(code==0){
                    res=true;
                }else{
                    res=false
                }
                resolve(res)
            });
        })
    }

    

    //@ OVERRIDE
    async test(){
        console.log(" ")
        console.log(" ")
        this.awTrainingActivitiesConsumer.subscribeToSepa();
        this.log.info("####################")
        this.log.info("My2sec Test started!")
        this.log.info("####################")
        this.log.info("Getting tasks...")
        await this.opAdapter.start()
        await this.produce();
    }

    async produce(){
        var users=[
            "http://www.vaimee.it/my2sec/defuser@vaimee.it",
            "http://www.vaimee.it/my2sec/gregorio.monari@vaimee.it"
        ]
        this.log.info("Producing events")
        await this.awProducer.send_messages(users[0]);
        //await this.awProducer.send_messages(users[1]);
        await this.awProducer.set_producer_flag(users[0])
        //await this.awProducer.set_producer_flag(users[1])
    }
    
    async on_training_activities(flagbind){
        console.log("Received training activities")
        //GET RESULTS
        var activities=this.awTrainingActivitiesConsumer.get_cache_by_user(flagbind.usergraph)
        console.log(activities)

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


    async on_log_time(binding){
        this.logTimesReceived++
        console.log("LogTimes RECEIVED!")
        console.log(binding);
        console.log(this.logTimesReceived)
        if(this.logTimesReceived==1){
            //send flag
            this.flagProducer.updateSepa({
                flag_type:"http://www.vaimee.it/my2sec/testfinished",
                usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it"
            })
        }//else{

        //    await this.produce();

        //}
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
        //GRAPHS LENGTH

        var res=await this.rawQuery("SELECT ?g (COUNT(?s) AS ?ntriples) WHERE {GRAPH ?g { ?s ?p ?o }}GROUP BY ?g")
        res=this.extractResultsBindings(res)
        console.log(res)
    }



}


module.exports = My2secTester;