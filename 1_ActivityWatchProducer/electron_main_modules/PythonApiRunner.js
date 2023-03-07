const { spawn } = require('child_process');
class PythonApiRunner{
    constructor(path){
        this.pathToExecutable=path
        this.pyProcess;
    }

    start(){
        this.pyProcess=spawn("python",[this.pathToExecutable]);
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

}
module.exports=PythonApiRunner;