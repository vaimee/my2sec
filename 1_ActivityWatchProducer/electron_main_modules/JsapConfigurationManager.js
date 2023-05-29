const os = require('os');
const axios = require('axios');

class JsapConfigurationManager {
    constructor(path,logger){
        this.jsapPath=path;
        this.log=logger;
    }

    async getConfiguredJsap(){
        var jsap=await this.configureJsap();
        return jsap;
    }

    async configureJsap(){
        this.log.info("# JSAP CONFIGURATOR STARTED #")
        this.log.info("------------------------< DETECTING RUNTIME ENVIRONMENT >------------------------")
        if(this._isDarwin()){
            this.log.info("- Running environment: darwin")
        }else{
            this.log.info("- Running environment: windows/linux")
        }
        if(this._isDev()){
            this.log.info(`- Run mode: development (NODE_ENV=${process.env.NODE_ENV})`)
        }else{
            this.log.info(`- Run mode: production (NODE_ENV=${process.env.NODE_ENV})`)
        }
        this.log.info(" ")
        this.log.info("------------------------< GET LOOPBACK ADDRESS FOR AW API >------------------------")
        var loopbackAddress= await this.getLoopbackAddress();
        this.log.info(" ")
        this.log.info("------------------------< CONFIGURE JSAP >------------------------")
        var jsapObj= await this.getJsap();
        //console.log(jsapObj.extended)
        Object.keys(jsapObj.extended.AwProducer.endpoints).forEach(k=>{
            var endpointUrl=jsapObj.extended.AwProducer.endpoints[k];
            if(endpointUrl.includes("localhost")){
                this.log.info("- modifying endpoint: "+k)
                endpointUrl=endpointUrl.replace("localhost",loopbackAddress);
                jsapObj.extended.AwProducer.endpoints[k]=endpointUrl;
            }else{
                if(endpointUrl.includes("127.0.0.1")){
                    this.log.info("- modifying endpoint: "+k)
                    endpointUrl=endpointUrl.replace("127.0.0.1",loopbackAddress);
                    jsapObj.extended.AwProducer.endpoints[k]=endpointUrl;
                }else{
                    if(endpointUrl.includes("[::1]")){
                        this.log.info("- modifying endpoint: "+k)
                        endpointUrl=endpointUrl.replace("[::1]",loopbackAddress);
                        jsapObj.extended.AwProducer.endpoints[k]=endpointUrl;
                    }
                }
            }
        })
        this.log.info(jsapObj.extended)
        return jsapObj;
    }


    async getJsap(){
        var file=await this.readFile(this.jsapPath);
        return JSON.parse(file);
    }

    _isDarwin(){
        //CHECK SYSTEM
        if (process.platform == 'darwin'){
            return true;
        }else {
            return false;
        }
    }

    async getLoopbackAddress(){
        //TEST DATASOURCES
        var loopbacks=["localhost","127.0.0.1","[::1]"]
        var workingLoopbackAddress="";
        var loopbacksToTest=loopbacks.length;
        var errorCount=0;
        for(var i in loopbacks){
            var currHost= loopbacks[i]
            //[1] LOCALHOST
            try{
                this.log.info("===============================")
                this.log.info(`** Request ${i}: ${currHost} **`)
                const config = {
                    headers:{
                        'Content-Type': 'application/json',
                        'Connection': 'close'
                    }
                  };
                var res= await axios.get(`http://${currHost}:5600/api/0/buckets/`,config)
                this.log.info("Response status: "+res.status)
                this.log.info("Response DATA: "+JSON.stringify(res.data))
                workingLoopbackAddress=currHost
            }catch(e){
                this.log.error(e.cause)
                //Increment error counter. If it reaches the size of looparr, throw error
                errorCount++;
                this.log.info(`Failed ${errorCount}/${loopbacksToTest} requests`)
            }finally{
                this.log.info(`Request to ${currHost} executed`)
            }
        }

        if(errorCount==loopbacksToTest){
            throw new Error("ActivityWatch Api is UNREACHABLE: this error is probably caused by the ActivityWatch application being off. Please activate the application or, if it is not installed, download it.")
        }

        return workingLoopbackAddress
    }

    _isDev(){
        //this.log.info(process.env.NODE_ENV)
        try{
            var mode=process.env.NODE_ENV;
            //if(process.env.NODE_ENV != null || !process.env.NODE_ENV || process.env.NODE_ENV != "dev"){
            if(!mode){
                return false
            }else{
                if(mode.includes("dev")){
                    return true
                }else{
                    return false
                }            
            }
        }catch(e){
            console.log(e)
            return false
        }

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

module.exports=JsapConfigurationManager;