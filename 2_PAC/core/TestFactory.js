var PacFactory=require('./PacFactory.js');
const EventEmitter = require("events").EventEmitter
//const testClient = require('../../Apps/testClient/testClient');

class TestFactory extends PacFactory{

    constructor(jsap,test_graphs,test_flags,modulesDefinition,endFlag){
        super(jsap)
        //console.log("LOGLEVEL: "+loglevel)
        this.modulesDefinition=modulesDefinition;
        this.modules=[];
        this.testGraphs=test_graphs;
        this.testFlags=test_flags;
        this.endFlag=endFlag;
        this.nEndFlags=0;
        this.finishedEm=new EventEmitter();
        
    }

    async graph_is_empty(graphname){
        var res=await this.rawQuery("SELECT ?g (COUNT(?s) AS ?ntriples) WHERE {GRAPH ?g { ?s ?p ?o }}GROUP BY ?g")
        res=this.extractResultsBindings(res)
        console.log(res)
        for(var i in res){
            var nomegrafo=res[i].g;
            console.log(nomegrafo)
            if(graphname==nomegrafo){
                this.log.error("Trovato grafo non  pulito")
                return false
            }
        }
        return true
    }

    async start(){
        //Start monitoring FULL TEST TIME
        console.time("full-test")
        //Prepare for test: clean graphs and reset flags
        console.log("LOGLEVEL: "+this.log.loglevel)
        var ilog=this.log.loglevel;
        this.log.loglevel=3
        this.log.info("Cleaning graphs:")
        for(var i in this.testGraphs){
            this.log.info(this.testGraphs[i])
        }
        //console.log("DIO")
        await this.clean_graphs()
        //console.log("DIO")
        this.log.info("Resetting flags:")
        await this.reset_flags()
        //EXECUTE TEST
        this.log.loglevel=ilog
        this.log.info("Environment reset successfull")
        //END CONDITION
        console.log(this.endFlag)
        if(typeof this.endFlag === 'string'){
            console.log("is string")
            this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
                flag_type:this.endFlag
            },"on_last_flag")
        }else{
            console.log("is array")
            this.nEndFlags=this.endFlag.number
            this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
                flag_type:this.endFlag.name
            },"on_last_and_flag")             
            
            
        }

        console.log(this.log.loglevel)
        try{
            await this.deploy_modules()
            await this.test()
            
        }catch(e){
            console.log(e)
        }
        
    
    }

    async on_last_and_flag(not){
        this.nEndFlags--
        if(this.nEndFlags==0){
            var testresult=await this.on_test_finished(not)
            //Clean graphs even if execution fails, to ensure that the test is completely clean
            var ilog=this.log.loglevel;
            this.log.loglevel=3
            this.log.info("Cleaning graphs:")
            for(var i in this.testGraphs){
                this.log.info(this.testGraphs[i])
            }
            await this.clean_graphs()
            this.log.info("Resetting flags:")
            await this.reset_flags()
            this.log.loglevel=ilog
            this.log.info("Environment reset successfull")
            console.timeEnd("full-test")
            this.stop_modules()
            this.finishedEm.emit("finished",testresult)
            process.exit()
        }else{
            console.log("end flags left: "+this.nEndFlags)
        }
    }


    async on_last_flag(not){
        var testresult=await this.on_test_finished(not)
        //Clean graphs even if execution fails, to ensure that the test is completely clean
        var ilog=this.log.loglevel;
        this.log.loglevel=3
        this.log.info("Cleaning graphs:")
        for(var i in this.testGraphs){
            this.log.info(this.testGraphs[i])
        }
        await this.clean_graphs()
        this.log.info("Resetting flags:")
        await this.reset_flags()
        this.log.loglevel=ilog
        this.log.info("Environment reset successfull")
        console.timeEnd("full-test")
        this.stop_modules()
        this.finishedEm.emit("finished",testresult)
        process.exit()
    }

    async on_test_finished(not){
        console.log("FINISHED!")
    }

    async test(){
        console.log("La micia è bellissima")
        throw new Error("MAO")
    }
    async deploy_modules(){
        this.log.info("Deploying modules..., loglevel: "+this.log.loglevel)
        try{
            for(var modName in this.modulesDefinition){
                var ModBuilder=this.modulesDefinition[modName]
                //console.log(modName)
                this.modules[modName]=new ModBuilder(jsap)
                this.modules[modName].log.loglevel=this.log.loglevel 
                await this.modules[modName].start()
            }
        }catch(e){
            console.log(e)
        }
    }
    stop_modules(){
        this.log.info("Stopping modules...")
        try{
            for(var modName in this.modules){
                console.log(modName)
                this.modules[modName].exit()
                //console.log(stopped)
            }
        }catch(e){
            console.log(e)
        }

    }


    //Log graphs
    async log_graph(graph){
        if(this.log.loglevel==0){
            var queryRes=await this.rawQuery('select * where {graph <'+graph+'> {?s ?p ?o} }');
            this.log.info("Queried Graph <"+graph+">, showing results: ");
            var bindings=this.extractResultsBindings(queryRes);
            console.table(bindings.slice(0,10))
        }
    }

    //Flags management, used for synchronous execution
    async reset_flags(){
        await this.delete_graph("http://www.vaimee.it/my2sec/flags")
        /*
        for(var i in this.testFlags){
            await this.reset_flag(this.testFlags[i])
        }
        */
        await this.log_graph("http://www.vaimee.it/my2sec/flags")        
    }


    async reset_flag_OLD(flagname){
        
        var response=await this.RESET_SYNCHRONIZATION_FLAG({
            flag_uri:flagname,
            flag_value:"false"
        })
        return response
    }



    //Graphs management
    async clean_graphs(){
        for(var i in this.testGraphs){
            await this.delete_graph(this.testGraphs[i])
        }
    }

    async delete_graph(graphname){
        //console.log("Deleting graph: "+graphname)
        try{
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
        }catch(e){}
        
        //console.log("DIO")       
        return deleteRes 
    }

    //=================
    delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
    readFile(filename){
        var fs = require('fs');
        return new Promise(resolve=>{
          fs.readFile(filename, 'utf8', function (err,data) {
            if (err) return console.log(err);
            //console.log('FILE SAVED');
            resolve(data)
          });
        })
    }

}

module.exports = TestFactory;