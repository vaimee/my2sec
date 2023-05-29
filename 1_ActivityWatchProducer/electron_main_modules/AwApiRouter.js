const http = require('http');
const express = require('express');
const axios = require('axios')

class AwApiRouter {
    constructor(host,port,router_port,logger){
      this.log=logger;
      this.routerPort=router_port;
        this.awHost=host;
        this.awPort=port;
        this.awApiRouter = express();
        this.awApiRouter.use(express.json()); 
        //this.setup();
        this.axiosSetup()    
    }

    async axiosSetup(){

      const rootUrl="http://"+this.awHost+":"+this.awPort

      const config = {
        headers:{
            'Content-Type': 'application/json',
            'Connection': 'close'
        }
      };

      //Define Get Router
      this.awApiRouter.get('/api/*', (request, response) => { //listen to all requests
        console.log(`received AW api GET request: ${request.originalUrl}`)
        axios.get(rootUrl+request.originalUrl,config)
          .then(function (res) {
            // handle success
            console.log(res.data);
            response.status(res.status).json(res.data);
          })
          .catch(function (error) {
            // handle error
            console.log(error);
            if(error.hasOwnProperty("response")){
              response.status(error.response.status).json(error.response.data);
            }else{
              response.status(500).json(error);
            }
            
          })
          .finally(function () {
            console.log("Served api GET request")
          });
      });

      this.awApiRouter.post('/api/*', (request,response)=>{
        console.log(`received AW api POST request: ${request.originalUrl}`)
        
        axios.post(rootUrl+request.originalUrl,request.body,config)
          .then(function (res) {
            // handle success
            console.log(res.data);
            response.status(res.status).json(res.data);
          })
          .catch(function (error) {
            // handle error
            console.log(error);
            response.status(error.response.status).json(error.response.data);
          })
          .finally(function () {
            console.log("Served api POST request")
          });

      });

      this.awApiRouter.delete('/api/*', (request,response)=>{
        console.log(`received AW api DELETE request: ${request.originalUrl}`)
        
        axios.delete(rootUrl+request.originalUrl,request.body,config)
          .then(function (res) {
            // handle success
            console.log(res.data);
            response.status(res.status).json(res.data);
          })
          .catch(function (error) {
            // handle error
            console.log(error);
            response.status(error.response.status).json(error.response.data);
          })
          .finally(function () {
            console.log("Served api DELETE request")
          });

      });
    }

    //!OUTDATED
    setup_OLD(){
        this.awApiRouter.get('/api/*', (request, response) => { //listen to all requests
            console.log(`received AW buckets api request: ${request.originalUrl}`)
            //console.log(get_time()+` [info] received AW API request: (${request.path})`);
            
            //CREATE HTTP REQUEST FOR THE API
            //var host_name="localhost";
            //var http_port=5600;
            var host_name=this.awHost;
            var http_port=this.awPort;
            var reqpath=request.originalUrl;
            //var response=await get(host_name,http_port,reqpath);
            this.get(host_name,http_port,reqpath).then((data)=>{
                console.log(data)
                response.json(JSON.parse(data));
            });
        
        });
        
        this.awApiRouter.post('/api/*', (request,response)=>{
          //CREATE HTTP REQUEST FOR THE API
          //var host_name="localhost";
          //var http_port=5600;
          var host_name=this.awHost;
          var http_port=this.awPort;
          var reqpath=request.originalUrl;
          const reqdata=JSON.stringify(request.body);
          //var response=await get(host_name,http_port,reqpath);
          this.post(host_name,http_port,reqpath,reqdata).then((data)=>{
            console.log(data)
            response.json(JSON.parse(data));    
          });
        });
        
        this.awApiRouter.delete('/api/*', (request,response)=>{
          //const data=request.body;
          //consoleLog(0,"performing DELETE request to "+request.path)
          //CREATE HTTP REQUEST FOR THE API
          //var host_name="localhost";
          //var http_port=5600;
          var host_name=this.awHost;
          var http_port=this.awPort;
          var reqpath=request.originalUrl;
          //var response=await get(host_name,http_port,reqpath);
          this.http_delete(host_name,http_port,reqpath).then((data)=>{
            console.log(data)
            response.json(JSON.parse(data));    
          });
        });        
    }

    start(){
        this.test_datasource()
        //LISTEN TO REQUESTS
        this.awApiRouter.listen(this.routerPort, () => {
            this.log.info('aw api is listening on port 1340');
        });

    }

    test_datasource(){
        this.log.info("Preflight: testing ActivityWatch connection")
        const url="http://"+this.awHost+":"+this.routerPort+"/api/0/buckets/";
        const testconfig = {
          headers:{
              'Content-Type': 'application/json'
          }
        }
        //console.log("sending get request")
        //var response=await get(host_name,http_port,reqpath);
        axios.get(url,testconfig)
          .then(function (res) {
            // handle success
            console.log("SUCCESS: "+res.status);
            //response.status(res.status).json(res.data);
          })
          .catch(function (error) {
            // handle error
            console.log("ACTIVITY WATCH API IS OFFLINE");
            throw new Error(error)
            //response.status(error.response.status).json(error.response.data);
          })
          .finally(function () {
            console.log("Served api GET request")
          });


    }

    //!OUDATED HTTP CLIENTS
    http_delete(host_name,http_port,reqpath){
        //CREATE HTTP REQUEST FOR THE API
        const options = {
            hostname: host_name,
            port: http_port,
            path: reqpath, //`${request.path}`, //forward the path to the api
            method: 'DELETE',
            headers: {
                  'Content-Type': 'application/json',
                  'Connection': 'close',
              },
        }; 
      
        return new Promise(resolve=>{
          const req = http.request(options, res => {
              //console.log(`forwarded request to ${options.path}, statusCode: ${res.statusCode}`);
              res.on('data', d => {
                  resolve(d)
              });
          });
          req.setHeader("Connection","close");
          //CATCH ERRORS
          req.on('error', error => {
              console.error(error);
          });
          req.end();    
        })
        
      }
      
    post(host_name,http_port,reqpath,data){
        //CREATE HTTP REQUEST FOR THE API
        const options = {
            hostname: host_name,
            port: http_port,
            path: reqpath, //`${request.path}`, //forward the path to the api
            method: 'POST',
            headers: {
                  'Content-Type': 'application/json',
                  'Connection': 'close',
              },
        }; 
      
        return new Promise(resolve=>{
          const req = http.request(options, res => {
            res.on('data', d => {
              resolve(d);
            });
          });
          //CATCH ERRORS
          req.on('error', error => {
              console.error(error);
          });
          req.write(data);
          req.end();    
        })
        
      }
      
    get(host_name,http_port,reqpath){
        //CREATE HTTP REQUEST FOR THE API
        const options = {
            hostname: host_name,
            port: http_port,
            path: reqpath, //`${request.path}`, //forward the path to the api
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Connection': 'close',
            },
        }; 
      
        return new Promise(resolve=>{
          const req = http.request(options, res => {
              //console.log(`forwarded request to ${options.path}, statusCode: ${res.statusCode}`);
              var str='';
              res.on('data', d => {
                  str=str+d;
              });
      
              res.on('end', ()=>{
                  resolve(str)
              })
      
          });
      
          req.setHeader("Connection","close");
          //CATCH ERRORS
          req.on('error', error => {
              console.error(error);
          });
          req.end();    
        })
        
      }
    
}


module.exports = AwApiRouter;