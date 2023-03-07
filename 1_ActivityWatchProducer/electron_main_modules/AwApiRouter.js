const http = require('http');
const express = require('express');

class AwApiRouter {
    constructor(host,port,router_port){
      this.routerPort=router_port;
        this.awHost=host;
        this.awPort=port;
        this.awApiRouter = express();
        this.awApiRouter.use(express.json()); 
        this.setup();    
    }

    setup(){
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
            console.log('aw api is listening on port 1340');
        });

    }

    test_datasource(){
        console.log("Preflight: testing ActivityWatch connection")
        //var host_name="127.0.0.1";
        //var http_port=5600;
        var host_name=this.awHost;
        var http_port=this.awPort;
        //console.log(host_name+":"+http_port)
        var reqpath="/api/0/buckets/"
        //console.log("sending get request")
        //var response=await get(host_name,http_port,reqpath);
        this.get(host_name,http_port,reqpath).then((data)=>{
          console.log(data)
          console.log("DATASOURCE: OK!\n")    
        });
        //console.log(String(response))
    }

    //HTTP CLIENT
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