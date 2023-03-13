const { spawn } = require('child_process');
const path = require('path');
class PythonApiRunner{
    constructor(path){
        this.pyProcess;
    }

    start(){
        //this.pyProcess=spawn("python",[this.pathToExecutable]);
        //var relativePath="./PY/install"

        var relativePath="";
        if (process.platform == 'darwin'){
          relativePath="./Content/Resources/app/PY/install"
        }else{
          relativePath="./resources/app/PY/install"
        }
        

        //var relativePath="./PY/my2sec/main"
        var cwd=path.resolve(relativePath);
        console.log(cwd)

        

        this.pyProcess=spawn("./API_my2sec",[],{cwd});
        //this.pyProcess=spawn("python",["./API_my2sec.py"],{cwd});
        console.log("started python api")
        //on new data chunk
        this.pyProcess.stdout.on("data",(data)=>{
            console.log(data)
        })
        //on new error
        this.pyProcess.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });
        //on app close
        this.pyProcess.stdout.on("close", (code)=>{
            console.log("App exited with code: "+code)
        })   
         
    }

    start_dev(){

    }

}
module.exports=PythonApiRunner;