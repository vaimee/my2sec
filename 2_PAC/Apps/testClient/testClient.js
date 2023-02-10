var PacFactory=require('../../gregnet_modules/PacFactory/PacFactory.js');
var AwMapper=require('../AwMapper.js');
require("./greg_events.json.js")
//require("../my2sec-jena_251122.jsap")
//require("./my2sec-jena_251122.jsap.js")
//require("../my2sec-FULL_271022.js")
class testClient extends PacFactory{

    constructor(){
      //TITLE
      console.log("║║ ###########################");
      console.log("║║ # App: testClient v0.1");
      console.log("║║ ###########################");
      super(jsap);
      this.testGraph="";
      this.i=0

      this.generalCounter=0;
      this.numberOfEvents=1000;

    }

    //============= START METHOD, CALL TO START THE APP ==========
    /*
    async start(){
        //console.log("SUBSCRIBING")
        //this.newSubRouter("ALL_USERS_EVENTS",{},"onNotification")
        //this.synchronization_flags_test()
        this.MAIN_TEST_1()
    }
    */

    


    async MAIN_TEST_1(){
        this.log.info("MAIN TEST #1 STARTING")
        this.log.info("cleaning graphs...")
        
        await this.delete_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
        await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
        await this.delete_graph("http://vaimee.it/my2sec/events")
        //RESET FLAGS
        var response=await this.SET_SYNCHRONIZATION_FLAG({
                flag_uri:"http://www.vaimee.it/my2sec/aw_producer_finished_flag",
                flag_value:"false"
            })
        response=await this.SET_SYNCHRONIZATION_FLAG({
                flag_uri:"http://www.vaimee.it/my2sec/aw_mapper_finished_flag",
                flag_value:"false"
            })
        //====================================================
        
        console.time("full-test")
        console.log("###########################################################")
        
        //START MAPPER
        this.log.info("----- 0] Starting mapper... ------")
        var awMapper= new AwMapper(jsap)
        await awMapper.start()

        
        //IMPORT EVENTS
        this.log.info("----- 1] Import events -----")
        console.time("import-events")
        var msgvalue=this.import_json_events(this.numberOfEvents)
        console.timeEnd("import-events")

        //UPDATE EVENTS
        this.log.info("----- 2] Update events -----")
        var data={
            message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it",
            source:"http://www.vaimee.it/sources/aw-watcher-working",
            msgtimestamp:new Date().toISOString(),
            msgvalue:msgvalue
        }
        //console.log(data)
        this.log.info("Sending message to SEPA")
        var response=await this.SEND_MESSAGE(data)
        this.log.info("SEND_MESSAGE response: "+JSON.stringify(response))
        //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")

        this.log.info("Sending Synch flag")
        var response=await this.SET_SYNCHRONIZATION_FLAG({
            flag_uri:"http://www.vaimee.it/my2sec/aw_producer_finished_flag",
            flag_value:"true"
        })
        //this.log.info("SET_SYNC_FLAG response: "+JSON.stringify(response))
        await this.log_graph("http://www.vaimee.it/my2sec/flags")

        
        this.newSubRouter("ALL_USERS_EVENTS",{},"on_new_mapper_event")
        
        this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
            flag_uri:"http://www.vaimee.it/my2sec/aw_mapper_finished_flag"
        },"on_test_finished")

        
        await this.delay(30000)
        if(this.generalCounter==0){
            throw new Error("Test failed, timeout exceeded")
        }
        
        
    }
    delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
    
    on_new_mapper_event(not){
        //console.log("MAO")
        this.generalCounter=this.generalCounter+1
        //console.log("Number of Events: "+this.generalCounter)
    }
    

    async on_test_finished(not){
        if(not.flag_value=="true"){
            console.log("###########################################################")
            this.log.info("MAIN TEST #1 ENDED")
            console.timeEnd("full-test")
            this.generalCounter=this.generalCounter+1
            this.log.info("MAPPED "+this.generalCounter+" events.")
            if(this.generalCounter!=this.numberOfEvents){
                this.log.error("NUMBER TEST FAILED: WRONG MAPPED EVENTS NUMBER")
            }else{
                this.log.info("$$$ NUMBER TEST PASSED! =)")
            }
            //===================================================
            //RESET FLAGS
            var response=await this.SET_SYNCHRONIZATION_FLAG({
                flag_uri:"http://www.vaimee.it/my2sec/aw_producer_finished_flag",
                flag_value:"false"
            })
            response=await this.SET_SYNCHRONIZATION_FLAG({
                flag_uri:"http://www.vaimee.it/my2sec/aw_mapper_finished_flag",
                flag_value:"false"
            })


            //CLEAR GRAPHS
            await this.delete_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
            //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")  
            await this.delete_graph("http://vaimee.it/my2sec/events")
            //await this.log_graph("http://vaimee.it/my2sec/events")           
            //throw new Error("TEST FINISHED!")
        }
    }

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

    async delete_graph(graphname){
        var deleteRes=await this.rawUpdate(`
        DELETE {
            GRAPH <${graphname}> {
                ?s ?p ?o
            }
        }WHERE{
            GRAPH <${graphname}> {
                ?s ?p ?o
            }            
        }
        `);       
        return deleteRes 
    }
    async log_graph(graph){
        var queryRes=await this.rawQuery('select * where {graph <'+graph+'> {?s ?p ?o} }');
        this.log.info("Queried Graph <"+graph+">, showing results: ");
        var bindings=this.extractResultsBindings(queryRes);
        console.table(bindings.slice(0,10))
    }






    //=================================================
    //TEST TESTS
    async onNotification(res){
        console.log(this.i)
        this.i++
        //console.log(JSON.stringify(res))
        //this.saveUpdateTemplate(JSON.stringify(res))
    }

    async synchronization_flags_test(){
        var res=await this.SET_SYNCHRONIZATION_FLAG({
            flag_uri:"http://www.vaimee.it/my2sec/aw_mapper_finished_flag",
            flag_value:"false"
        })
        console.log(JSON.stringify(res))
        var value=await this.query_sync_flag("http://www.vaimee.it/my2sec/aw_mapper_finished_flag");
        console.log("Flag value: "+value[0].flag_value.value)
    }

    async query_sync_flag(flag_uri){
        return new Promise(resolve=>{
            var sub = this["GET_SYNCHRONIZATION_FLAG"]({
                flag_uri: flag_uri
            });
            sub.on("subscription",console.log)
            sub.on("notification",not=>{
                //console.log(not)
                sub.unsubscribe();
                resolve(not.addedResults.results.bindings)
            })
        })

    }



    async test_jena(){
        var delGraph=`DELETE {
            GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it> {
                ?s ?p ?o
            } 
        }WHERE{
            GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it> {
                ?s ?p ?o
            }
        }`

        console.log("--------START TEST-------") 
        await this.rawUpdate(delGraph)

        //await this.TEST_INSERT_DATA()
        //await this.TEST_INSERT_DATA_2()
        const data={
            usergraph: "http://www.vaimee.it/my2sec/defuser@vaimee.it",
            event_type:"sw:windowEvent",
            datetimestamp:["2022-08-10T15:33:42.50","2022-08-10T16:33:42.50"],
            app:["chrome.exe","code.exe"],
            title:["youtube","main.js"],
            activity_type:["sw:researching","sw:development"],
            task:"WP2-IMPLEMENTAZIONE COMPONENTI",
            duration:[16.0,20.0]
        }
        var results= await this.ADD_EVENT(data)
        var queryRes=await this.rawQuery(`select * where {
            GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it> {
                ?s ?p ?o
            }
        }`);
        var bindings=this.extractResultsBindings(queryRes);
        console.table(bindings)   


        results= await this.REMOVE_EVENT(data)
        queryRes=await this.rawQuery(`select * where {
            GRAPH <http://www.vaimee.it/my2sec/defuser@vaimee.it> {
                ?s ?p ?o
            }
        }`);
        bindings=this.extractResultsBindings(queryRes);
        console.table(bindings)


        await this.rawUpdate(delGraph)
    }

    async test_4(){

        this.setTestGraph("added_results");
        await this.clearAllDb();
        await this.logAllDb();
        console.log("--------START TEST-------")   

        const data={
            usergraph: "http://www.vaimee.it/my2sec/gregorio.monari@vaimee.it",
            event_type:"sw:windowEvent",
            datetimestamp:["2022-08-10T15:33:42.50","2022-08-10T16:33:42.50"],
            app:["chrome.exe","code.exe"],
            title:["youtube","main.js"],
            activity_type:["sw:researching","sw:development"],
            task:"WP2-IMPLEMENTAZIONE COMPONENTI",
            duration:[16.0,20.0]
        }
        const data2={
            usergraph: "http://www.vaimee.it/my2sec/gregorio.monari@vaimee.it",
            event_type:"sw:windowEvent",
            datetimestamp:"2022-08-10T15:33:42.50",
            app:"DIOMAO",
            title:"youtube",
            activity_type:"sw:researching",
            task:"WP2-IMPLEMENTAZIONE COMPONENTI",
            duration:16.0
        }
        var results= await this.ADD_EVENT(data2)
        //var results= await this.ADD_EVENT(data)
        //console.log("SEPA UPDATED, RES: "+JSON.stringify(results));
        //await this.TEST_INSERT_DATA()
        await this.TEST_INSERT_DATA_2()
        await this.ADD_USER({
            username_literal:"gregor",
            usergraph:"http://www.vaimee.it/my2sec/gregorio.monari@vaimee.it"
        })
        
        var queryRes=await this.rawQuery('select * where {GRAPH <http://www.vaimee.it/my2sec/members> {?s ?p ?o}}');
        var bindings=this.extractResultsBindings(queryRes);
        console.table(bindings)   
        queryRes=await this.rawQuery('select * where {GRAPH <http://www.vaimee.it/my2sec/gregorio.monari@vaimee.it> {?s ?p ?o}}');
        bindings=this.extractResultsBindings(queryRes);
        console.table(bindings)   
        //await this.logAllDb();

        await this.clearAllDb();

    }

    async test_3(){
        this.setTestGraph("added_results");
        await this.clearTestGraph();
        await this.logTestGraph();
        console.log("--------START TEST-------")     

        var testUpdate=`
        WITH <http://www.vaimee.it/testing/${this.testingGraphName}>
        DELETE{
            ?oldbnode_1 <http://sepatest/hasValue> "mao" .
            ?oldbnode_2 <http://sepatest/hasValue> "maus" .
        }INSERT{
            _:bnode_1 <http://sepatest/hasValue> "mao" .
            _:bnode_2 <http://sepatest/hasValue> "maus" .
        }WHERE{
            OPTIONAL {
                ?oldbnode_1 <http://sepatest/hasValue> "mao" .
                ?oldbnode_2 <http://sepatest/hasValue> "maus" .
            }
        }
        `

        await this.rawUpdate(testUpdate);
        await this.rawUpdate(testUpdate);

        await this.logTestGraph();

        await this.clearTestGraph();
    }



    async test_2(){
        this.setTestGraph("added_results");
        await this.clearTestGraph();
        await this.logTestGraph();
        console.log("--------START TEST-------")

        //SUB TO GRAPH
        this.newSubRouter("ALL_GRAPH_DATA",{
            graph:"http://www.vaimee.it/testing/added_results",
        },"onAddedResults")

        const singleBindings={
            graph:"http://www.vaimee.it/testing/added_results",
            o:"example"
        }
        var results = await this.simpleUpdate(singleBindings);
        console.log(results)
        var results = await this.simpleUpdate(singleBindings);
        console.log(results)
        await this.clearTestGraph();
        
    }

    onAddedResults(res){
        console.log(res)
    }
    
    async test_1(){
        this.setTestGraph("multiple_bindings");
        await this.clearTestGraph();
        await this.logTestGraph();
        console.log("--------START TEST-------")

        //-----------------SINGLE BINDINGS--------------------
        const singleBindings={
            o:"example"
        }
        var results = await this.BINDINGS_TEST(singleBindings);
        console.log("SEPA UPDATED, RES: "+JSON.stringify(results));
        await this.logTestGraph()
        await this.clearTestGraph()

        //-----------------MULTIPLE BINDINGS------------------
        const multipleBindings={
            o: ["example_1","example_2","example_3"]
        }
        var results = await this.BINDINGS_TEST(multipleBindings);
        console.log("SEPA UPDATED, RES: "+JSON.stringify(results));
        await this.logTestGraph()
        await this.clearTestGraph()

        //-----------------MIXED BINDINGS (SINGLE AND MULTIPLE)------------------
        const mixedBindings={
            graph: "http://www.vaimee.it/testing/multiple_bindings",
            value: ["example_1","example_2","example_3"],
            color: ["red","green","blue"]
        }
        var results = await this.MIXED_BINDINGS(mixedBindings);
        console.log("SEPA UPDATED, RES: "+JSON.stringify(results));
        await this.logTestGraph()
        await this.clearTestGraph()


        //----------------MY2SEC ADD ACTIVITY WATCH EVENTS TEST--------------------
        const data={
            usergraph: "http://www.vaimee.it/testing/multiple_bindings",
            event_type:"sw:windowEvent",
            datetimestamp:["2022-08-10T15:33:42.50","2022-08-10T16:33:42.50"],
            app:["chrome.exe","code.exe"],
            title:["youtube","main.js"],
            activity_type:["sw:researching","sw:development"],
            task:"WP2-IMPLEMENTAZIONE COMPONENTI",
            duration:["16.0","20.0"]
        }
        results= await this.ADD_EVENT(data)
        console.log("SEPA UPDATED, RES: "+JSON.stringify(results));
        await this.logTestGraph()
        await this.clearTestGraph()

        console.log("---------END TEST--------")
    }




    //============================================== UTILITY FUNCTIONS ======================================================
    setTestGraph(name){
        this.testingGraphName=name;
    }

    async clearAllDb(){
        await this.rawUpdate("DELETE {?s ?p ?o} WHERE {?s ?p ?o}");
        this.log.info("Cleared ALL DB");
    }  

    async logAllDb(){
        var queryRes=await this.rawQuery('select * where {?s ?p ?o}');
        this.log.info("Queried ALL DB");
        var bindings=this.extractResultsBindings(queryRes);
        console.table(bindings)
    }


    async dropTestGraph(){
        await this.rawUpdate("CREATE GRAPH <http://www.vaimee.it/testing/"+this.testingGraphName+">");
        this.log.info("Dropped Graph: <http://www.vaimee.it/testing/"+this.testingGraphName+">");
      }
    async clearTestGraph(){
        await this.rawUpdate("DELETE {?s ?p ?o} WHERE {GRAPH <http://www.vaimee.it/testing/"+this.testingGraphName+"> {?s ?p ?o} }");
        this.log.info("Cleared Graph: <http://www.vaimee.it/testing/"+this.testingGraphName+">");
    }
    async logTestGraph(){
        var queryRes=await this.rawQuery('select * where {graph <http://www.vaimee.it/testing/'+this.testingGraphName+'> {?s ?p ?o} }');
        this.log.info("Queried Graph <http://www.vaimee.it/testing/"+this.testingGraphName+">, showing results: ");
        var bindings=this.extractResultsBindings(queryRes);
        //console.log(queryRes.results.bindings)
        console.table(bindings)
    }  

}

module.exports = testClient;