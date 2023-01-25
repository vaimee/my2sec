var TestFactory=require('../../gregnet_modules/PacFactory/TestFactory.js');
var SynchronousConsumer=require('../../gregnet_modules/PacFactory/Pattern/SynchronousConsumer');
var SynchronousProducer=require('../../gregnet_modules/PacFactory/Pattern/SynchronousProducer'); //Pac Factory
const Producer = require('../../gregnet_modules/PacFactory/Pattern/Producer.js');


require("./greg_events.json.js")

class MultipleBindingsTester extends TestFactory{
    constructor(jsap,numberOfEvents,_loglevel,updateName,removeName,queryName,testgraph){
        //TITLE
        console.log("App: MultipleBindingsTester v0.1");
        console.log("###########################");
        
        //INSERT HERE MODULES THAT NEED TO BE STARTED
        var modulesDefinition={}
        //INSERT HERE GRAPHS AND FLAGS WHICH NEED TO BE CLEANED
        var testGraphs=[
            testgraph
        ];
        var testFlags=[
            "http://www.vaimee.it/my2sec/testfinishedflag",
            "http://www.vaimee.it/my2sec/productionfinishedflag"
        ];
        super(
            jsap,
            testGraphs,
            testFlags,
            modulesDefinition,
            {
                name:"http://www.vaimee.it/my2sec/testfinishedflag", //end condition
                number:1
            }    
        );
        this.updateName=updateName||"ADD_TRAINING_EVENT";
        this.removeName=removeName||"REMOVE_TRAINING_EVENT";
        this.queryName=queryName||"ALL_USERS_TRAINING_EVENTS";
        this.backupJsap=jsap;
        this.log.loglevel=_loglevel||0;
        this.testEnded=false;
        this.generalCounter=0;
        this.numberOfEvents=numberOfEvents || 10;
        this.eventsProducer= new SynchronousProducer(jsap,this.updateName,"http://www.vaimee.it/my2sec/productionfinishedflag");
        this.eventsRemover = new Producer(jsap,this.removeName)
        this.testFinishedNotifier = new Producer(jsap,"SET_SYNCHRONIZATION_FLAG")


        //Configure awTrainingEventsConsumer and flag remover
        try{
            var eventsquery=this.queryName;//"ALL_USERS_TRAINING_EVENTS";
            var data={};
            var flag="http://www.vaimee.it/my2sec/productionfinishedflag";
            this.awTrainingEventsConsumer=new SynchronousConsumer(jsap,eventsquery,data,flag,false);
            this.awTrainingEventsConsumer.log.loglevel=this.log.loglevel;
            this.awTrainingEventsConsumer.em.on("newsyncflag",not=>{
                //this.on_test_finished(not)
                this.testFinishedNotifier.updateSepa({
                    flag_type: "http://www.vaimee.it/my2sec/testfinishedflag",
                    usergraph:not.usergraph
                })
            }) //when the flag consumer emits a flag
        }catch(e){
            console.log(e)
        }

    }

    //@ OVERRIDE
    async test(){
        //console.log(" ")
        //console.log(" ")
        //console.clear();
        this.awTrainingEventsConsumer.subscribeToSepa();
        this.log.info("####################")
        this.log.info("My2sec Test started!")
        this.log.info("####################")
        
        var users=[
            "http://www.vaimee.it/my2sec/defuser@vaimee.it",
            "http://www.vaimee.it/my2sec/gregorio.monari@vaimee.it"
        ]
        this.log.info("[1] Producing items")

        var defaultBindings=this.getUpdateBindings(this.updateName);
        var multipleBindings={}
        Object.keys(defaultBindings).forEach(k=>{
                multipleBindings[k]=[]
        })
        for(var i=0; i<this.numberOfEvents;i++){
            Object.keys(defaultBindings).forEach(k=>{
                multipleBindings[k][i]=defaultBindings[k];
            })
        }
        //console.log(multipleBindings)
        //throw new Error("MAO")
        //console.log(multipleBindings)
        this.eventsProducer.updateSepa(multipleBindings,defaultBindings.usergraph)
        //wait this.awProducer.send_messages(users[0]);
        //await this.awProducer.send_messages(users[1]);
        //await this.awProducer.set_producer_flag(users[0])
        //await this.awProducer.set_producer_flag(users[1])
        //this.newSubRouter("ALL_USERS_EVENTS",{},"on_new_mapper_event")
    }

    getUpdateBindings(queryname){
        console.log("Getting bindings for: "+queryname)
        var forcedBindings=this.backupJsap.updates[queryname].forcedBindings;
        console.log("BEFORE")
        console.log(forcedBindings)
        var out={};
        /*Object.keys(forcedBindings).forEach(k=>{
            out[k]=forcedBindings[k].value
        })*/
        for(var k in forcedBindings){
            out[k]=forcedBindings[k].value
        }
        console.log("AFTER")
        console.log(forcedBindings)
        console.log(out)
        return out
    }
    

    async on_test_finished(flagbind){
        this.log.info("##################")
        this.log.info("MY2SEC TEST ENDED")
        this.log.info("##################")
        this.log.info("Results:")
        //console.log(flagbind)
        //GET RESULTS
        var items=this.awTrainingEventsConsumer.get_cache_by_user(flagbind.usergraph)
        //console.log(events)
        //console.log(res.length)
        
        //TEST 1: NUMBERS
        //this.generalCounter=this.generalCounter+1
        const elength=items.length
        this.log.info("Received "+elength+"/"+this.numberOfEvents+" events.")


        console.log("REMOVING EVENTS")
        var itemsToRemove=[]
        for(var i=0; i<elength; i++){
            itemsToRemove.push(items[i].nodeid)
        }

        var defbinds=this.getUpdateBindings(this.removeName);
        console.log(defbinds)
        var singlekey=""
        if(Object.keys(defbinds).length==1){
            Object.keys(defbinds).forEach(k=>{
                singlekey=k;
            })
        }
        var removeBindings={};
        removeBindings[singlekey]=itemsToRemove;
        await this.eventsRemover.updateSepa(removeBindings);



        if(elength==this.numberOfEvents){
            this.log.info('TEST PASSED!');
            //this.log.info('\x1b[32mTEST PASSED! \x1b[0m');
            return true;
        }else{
            this.log.info('TEST FAILED!');
            //this.log.info('\x1b[31mTEST FAILED! \x1b[0m');
            return false;
        }
        console.log("closing test...")
        this.testEnded=true
        //this.awTrainingEventsConsumer.exit();
    }

}


module.exports = MultipleBindingsTester;