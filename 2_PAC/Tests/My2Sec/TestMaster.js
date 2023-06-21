var GregLogs = require("../../utils/GregLogs.js")
const { spawn } = require('child_process');
class TestMaster{
    constructor(jsap,args){
        this.args=args;
        this._TEST_JSAP=jsap;
        this.log=new GregLogs()
        this.reportString=this.get_title();
        this.verbose=false;
        this.modulesloglevel=1
        if(this.args.length>0 && this.args[0].trim()=="-v"){
            this.verbose=true;
            if(this.args.length>1){
                this.modulesloglevel=parseInt(this.args[1].trim())
            }
        }
        
    }

    async startMaster(){
        //console.clear()
        console.log(this.reportString)
        //console.log(this.args)
        //this.print_title();
        //MULTIPLE BINDINGS TEST
        var multipleBindingsConfig=[
            {
                numberOfEvents:1,
                updateName:"ADD_TRAINING_EVENT",
                removeName:"REMOVE_TRAINING_EVENT",
                queryName:"ALL_USERS_TRAINING_EVENTS",
                testgraph:"http://vaimee.it/my2sec/events"    
            },
            {
                numberOfEvents:1,
                updateName:"ADD_ACTIVITY",
                removeName:"REMOVE_ACTIVITY",
                queryName:"ALL_USERS_ACTIVITIES",
                testgraph:"http://vaimee.it/my2sec/activities"    
            }
        ]
        var sizes=[1,10,100,1000]
        for(var size of sizes){
            for(var i in multipleBindingsConfig){
                multipleBindingsConfig[i].numberOfEvents=size;
                /*var res=await this.start_child_test(
                    "MultipleBindingsTester",
                    multipleBindingsConfig[i],
                    "./my2sec_4-4-2023.jsap"
                    );
                this.validateTest("MultipleBindings, updateName: "+multipleBindingsConfig[i].updateName+", size: "+multipleBindingsConfig[i].numberOfEvents,res)
                    */
            }
        }


        //var res=await this.start_child_test("AwMapperTester",{},"./my2sec_4-4-2023.jsap");
        //this.validateTest("AwMapperTester",res)

        var res=await this.start_child_test("AtAggregatorTester",{},"./my2sec_4-4-2023.jsap");
        this.validateTest("AtAggregatorTester",res)

        //var res=await this.start_child_test("OpAdapterTester",{});
        //this.validateTest("OpAdapterTester",res)

        //END OF TEST
        console.log("TEST COMPLETE, test master closing")
        process.exit()
    }
    validateTest(name,valid){
        if(valid){
            if(!this.verbose){
                console.clear();
                //this.print_title()
                this.reportString=this.reportString+`\n${name}: \x1b[32mTEST PASSED! \x1b[0m`
                console.log(this.reportString)
            }else{
                this.log.info(`${name}: \x1b[32mTEST PASSED! \x1b[0m`);
            }
        }else{
            this.log.info(`${name}: \x1b[31mTEST FAILED! \x1b[0m`);
            throw new Error("Test master: test failed")
        }
    }
    get_title(){
        var arr=[
            "#################################",
            "# TESTMASTER - full my2sec test #",
            "#################################"
        ]
        return arr.join("\n")

    }
    
    /*async testMultipleBindings(number,updateName,queryName,testgraph){
        const MultipleBindingsTester = require('./MultipleBindingsTester');
        return new Promise(resolve=>{
            var multipleBindingsTester= new MultipleBindingsTester(this._TEST_JSAP,number,this.modulesloglevel,updateName,queryName,testgraph);
            multipleBindingsTester.start();
            multipleBindingsTester.finishedEm.on("finished",res=>{
                multipleBindingsTester.exit()
                resolve(res)
            })
        })
    }*/



    async start_child_test(app,json_arg,jsap_path){
        json_arg=JSON.stringify(json_arg)
        return new Promise(resolve=>{         
            const child = spawn('node', ['runPacApp',app,'-jsap',jsap_path,json_arg]);

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

}


module.exports = TestMaster;