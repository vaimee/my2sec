var TestFactory=require('../../core/TestFactory.js');
var SynchronousConsumer=require('../../core/Pattern/SynchronousConsumer');
var SynchronousProducer=require('../../core/Pattern/SynchronousProducer'); //Pac Factory
const Producer = require('../../core/Pattern/Producer.js');


require("./greg_events.json.js")

class MultipleBindingsTester extends TestFactory{
    constructor(jsap,args){
        args=JSON.parse(args)
        var numberOfEvents=args.numberOfEvents
        var _loglevel=args._loglevel
        var updateName=args.updateName
        var removeName=args.removeName
        var queryName=args.queryName
        var testgraph=args.testgraph

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

        /*for(var i in removeBindings[singlekey]){
            var temp={}
            temp[singlekey]=removeBindings[singlekey][i]
            await this.eventsRemover.updateSepa(temp);
            temp={}
        }*/
        var queryJson=this.backupJsap.updates[this.removeName]
        if(queryJson.sparql.includes("activity")){
            var graph="http://vaimee.it/my2sec/activities"
            var binding_name="activity"
        }else{
            var graph="http://vaimee.it/my2sec/events"
            var binding_name="event"
        }
        await this.remove_items(graph,binding_name,itemsToRemove)

        var res=await this.rawQuery("SELECT ?g (COUNT(?s) AS ?ntriples) WHERE {GRAPH ?g { ?s ?p ?o }}GROUP BY ?g")
        res=this.extractResultsBindings(res)
        console.log(res)


        var testOutcome=true;
        if(!elength==this.numberOfEvents){
            this.log.error("Ricevuto un numero errato di oggetti")
            testOutcome=false;
        }

        this.log.info("Validating removed results")
        //console.log(Object.keys(this.testGraphs))
        for(var i in res){
            var nomegrafo=res[i].g;
            console.log(nomegrafo)
            for(var j in this.testGraphs){
                var grafotest=this.testGraphs[j];
                if(grafotest==nomegrafo){
                    this.log.error("Trovato grafo non  pulito")
                    testOutcome=false
                }
            }
        }

        console.log(testOutcome)

        //throw new Error("MAO")

        if(testOutcome){
            this.log.info('TEST PASSED!');
            //this.log.info('\x1b[32mTEST PASSED! \x1b[0m');
            return true;
        }else{
            this.log.info('TEST FAILED!');
            //this.log.info('\x1b[31mTEST FAILED! \x1b[0m');
            throw new Error("TEST FAILED!")
            //return false;
        }
        console.log("closing test...")
        this.testEnded=true
        //this.awTrainingEventsConsumer.exit();
    }


    async remove_items(graph,binding_name,itemsToRemove){
        var values=itemsToRemove.join("> <");

        //SPLIT REMOVE
        console.log("> Split remove")
        console.log("- Values length: "+values.length)
        console.log("- Graph total length: "+graph.length)
        console.log("- Binding length: "+binding_name.length)
        console.log("> TOTAL: "+(values.length+graph.length+binding_name.length)+" characters")



        var updateString=`
        PREFIX my2sec: <http://www.vaimee.it/ontology/my2sec#>
        DELETE {
            GRAPH <${graph}> {
                ?${binding_name} ?p ?o ;
                my2sec:hasTimeInterval ?d . 
                ?d ?p1 ?o1
            } 
        } WHERE { 
            GRAPH <${graph}> {
                ?${binding_name} ?p ?o ;
                my2sec:hasTimeInterval ?d .
                ?d ?p1 ?o1
            }
            VALUES ?${binding_name} { <${values}> }
        }
        `
        console.log(updateString)
        //throw new Error("MAO")
        await this.rawUpdate(updateString);
    }



}


module.exports = MultipleBindingsTester;