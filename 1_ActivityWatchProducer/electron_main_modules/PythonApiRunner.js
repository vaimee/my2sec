const { spawn } = require('child_process');
const path = require('path');
//const isDev = require('electron-is-dev');

class PythonApiRunner{
    constructor(logger){
        this.pyProcess;
        this.log=logger;
    }

    start(){
        //this.pyProcess=spawn("python",[this.pathToExecutable]);
        //var relativePath="./PY/install"
        try{
          var mode=process.env.NODE_ENV;
          //if(process.env.NODE_ENV != null || !process.env.NODE_ENV || process.env.NODE_ENV != "dev"){
          if(!mode){
            this.log.info("STARTING PYTHON API IN PRODUCTION MODE")
            this.start_production()
          }else{
              if(mode.includes("dev")){
                this.log.info("STARTING PYTHON API IN DEV MODE")
                this.start_dev()
              }else{
                this.log.info("STARTING PYTHON API IN PRODUCTION MODE")
                this.start_production()
              }            
          }
      }catch(e){
          console.log(e)
          return false
      }
         
    }

    start_production(){
      var relativePath="";
      if (process.platform == 'darwin'){
        relativePath="./Content/Resources/app/PY/install"
      }else{
        relativePath="./resources/app/PY/install"
      }
    
      //var relativePath="./PY/my2sec/main"
      var cwd=path.resolve(relativePath);
      this.log.info("Pyexecutable path: "+cwd)

      this.pyProcess=spawn("./API_my2sec",[],{cwd});
      //this.pyProcess=spawn("python",["./API_my2sec.py"],{cwd});
      this.log.info("** started python api")
      //on new data chunk
      this.pyProcess.stdout.on("data",(data)=>{
          console.log(data)
      })
      //on new error
      this.pyProcess.stderr.on('data', (data) => {
        this.log.error(`stderr: ${data}`);
      });
      //on app close
      this.pyProcess.stdout.on("close", (code)=>{
        this.log.info("App exited with code: "+code)
      })   
    }

    start_dev(){
      var executablePath="./PY/my2sec/main";
      var cwd=path.resolve(executablePath);
      try{
        
        this.log.info("Spawning python: "+cwd)
        this.pyProcess=spawn("python",["API_my2sec.py"],{
          cwd:cwd,
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf-8'
        });
        this.log.info("** started python api")
      }catch(e){
        console.log(e)
        //console.log("TRYING WITH PYTHON 3")
        //console.log("Spawning python3: "+cwd)
        //this.pyProcess=spawn("python3",["API_my2sec.py"],{cwd});    
        //this.log.info("** started python api")   
      }

      //console.log("started python api")
      //on new data chunk
      this.pyProcess.stdout.on("data",(data)=>{
          this.log.info(data)
      })
      //on new error
      this.pyProcess.stderr.on('data', (data) => {
        this.log.error(`stderr: ${data}`);
      });
      //on app close
      this.pyProcess.stdout.on("close", (code)=>{
        this.log.info("App exited with code: "+code)
      })   
    }

}
module.exports=PythonApiRunner;