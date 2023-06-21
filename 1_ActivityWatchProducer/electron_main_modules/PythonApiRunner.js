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
    
      var cwd=path.resolve(relativePath);
      this.log.info("Pyexecutable path: "+cwd)

      this.pyProcess=spawn("./API_my2sec",[],{
        cwd:cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8'
      });
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

    async start_dev(){
      var pythonName="python"
      const isPy3=await this.is_python_3()
      if(isPy3){
        pythonName="python3"
        this.log.info("Launching dev python api with python3")
      }else{
        this.log.info("Launching dev python api with standard python (not python3)")
      }
      var executablePath="./PY/my2sec/main";
      var cwd=path.resolve(executablePath);
      try{
        this.log.info("Spawning python: "+cwd)
        this.pyProcess=spawn(pythonName,["API_my2sec.py"],{
          cwd:cwd,
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf-8'
        });
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
        this.log.info("** started python api")
      }catch(e){
        console.log(e)
        //console.log("TRYING WITH PYTHON 3")
        //console.log("Spawning python3: "+cwd)
        //this.pyProcess=spawn("python3",["API_my2sec.py"],{cwd});    
        //this.log.info("** started python api")   
      }

 
    }

    /**
     * Detects the current installed version of Python.
     * Returns true if Python must be launched with the command python3
     */
    is_python_3(){
      return new Promise(resolve=>{
        const pyProcess=spawn("python3",["-c","print('hello')"]);
          pyProcess.stdout.on("data",(data)=>{
            //console.log(data)
          })
          //on new error
          pyProcess.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
            resolve(false)
          });
          //on app close
          pyProcess.stdout.on("close", (code)=>{
            console.log("Test python app exited with code: "+code)
            resolve(true)
          })   
      })
    }

}
module.exports=PythonApiRunner;