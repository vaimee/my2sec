const os = require('os');

class JsapConfigurationManager {
    constructor(path){
        this.jsapPath=path;
    }

    async getConfiguredJsap(){
        var jsap=await this.configureJsap();
        return jsap;
    }

    async configureJsap(){
        console.log("Configuration Manager: initializing jsap")
        var loopbackAddress= this.getLoopbackAddress();
        var jsapObj= await this.getJsap();
        //console.log(jsapObj.extended)
        Object.keys(jsapObj.extended.AwProducer.endpoints).forEach(k=>{
            var endpointUrl=jsapObj.extended.AwProducer.endpoints[k];
            if(endpointUrl.includes("localhost")){
                console.log("- modifying endpoint: "+k)
                endpointUrl=endpointUrl.replace("localhost",loopbackAddress);
                jsapObj.extended.AwProducer.endpoints[k]=endpointUrl;
            }else{
                if(endpointUrl.includes("127.0.0.1")){
                    console.log("- modifying endpoint: "+k)
                    endpointUrl=endpointUrl.replace("127.0.0.1",loopbackAddress);
                    jsapObj.extended.AwProducer.endpoints[k]=endpointUrl;
                }else{
                    if(endpointUrl.includes("[::1]")){
                        console.log("- modifying endpoint: "+k)
                        endpointUrl=endpointUrl.replace("[::1]",loopbackAddress);
                        jsapObj.extended.AwProducer.endpoints[k]=endpointUrl;
                    }
                }
            }
        })
        console.log(jsapObj.extended)
        return jsapObj;
    }


    async getJsap(){
        var file=await this.readFile(this.jsapPath);
        return JSON.parse(file);
    }

    getLoopbackAddress(){
        console.log("Detecting loopback address")
        if(!this._ipv6IsOn()){
            if(this._isDarwin()){
                console.log("- Running on darwin")
                return "127.0.0.1" //MAC
            }else{
                console.log("- Running on windows/linux")
                return "localhost" //WINDOWS
                //return "127.0.0.1"
            }
        }else{
            console.log("- Device is using IPV6")
            return "[::1]" //IPV6
        }
    }


    //----------------------------UTILITY---------------------------------
    _ipv6IsOn(){
        const networkInterfaces = os.networkInterfaces();
        // Loop through all available network interfaces
        Object.keys(networkInterfaces).forEach((iface) => {
          // Loop through all addresses of the current interface
          networkInterfaces[iface].forEach((address) => {
            // Check if the address is an IPv6 address
            if (address.family === 'IPv6' && address.address !== '::1') {
              // Use the IPv6 address instead of localhost
              //apiURL = `http://[${address.address}]:333/api`;
              return true;
            }
          });
        });
        return false;
    }

    _isDarwin(){
        if (process.platform == 'darwin'){
            return true;
        }else {
            return false;
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