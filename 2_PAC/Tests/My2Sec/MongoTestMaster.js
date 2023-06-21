var GregLogs = require("../../utils/GregLogs.js")
const { spawn } = require('child_process');
class MongoTestMaster{
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
        
        const multipliers=[1,2,5,10,50,100,1000,10000,100000]
        var iterations=5
        var counter=0;
        var totalTests=multipliers.length*iterations
        for(var i in multipliers){
            for(var j=0; j<iterations; j++){
                var currMult=multipliers[i].toString()
                var res=await this.start_child_test("MongoDbMessagesTester",["-m",currMult],"./resources/my2sec_26-5-2023.jsap");
                this.validateTest("MongoDbMessagesTester",res,counter+1,totalTests)
                counter++
            }
        }


        //var res=await this.start_child_test("OpAdapterTester",{});
        //this.validateTest("OpAdapterTester",res)

        //END OF TEST
        console.log("TEST COMPLETE, test master closing")
        process.exit()
    }
    validateTest(name,valid,testNumber,maxTests){
        if(valid){
            if(!this.verbose){
                console.clear();
                //this.print_title()
                this.reportString=this.reportString+`\n${name}: \x1b[32mTEST ${testNumber}/${maxTests} PASSED! \x1b[0m`
                console.log(this.reportString)
            }else{
                this.log.info(`${name}: \x1b[32mTEST ${testNumber}/${maxTests} PASSED! \x1b[0m`);
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



    async start_child_test(app,args,jsap_path){
        return new Promise(resolve=>{         
            const child = spawn('node', ['runPacApp',app,'-jsap',jsap_path,...args]);

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


module.exports = MongoTestMaster;