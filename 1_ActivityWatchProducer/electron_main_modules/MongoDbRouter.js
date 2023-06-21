const express = require('express');
const MongoDbClient = require("./MongoDbClient")

class MongoDbRouter{
    constructor(uri,database,collection,port){
        this.mongoClient=new MongoDbClient(uri,database,collection)
        this.port=port;
        this.router = express();
        this.router.use(express.json({
            limit: '20mb'
        })); 
        
        this.setup();
    }

    setup(){
        this.router.get('/mongodb/api', (request, response) => { //listen to all requests
            console.log(`----<received mongodb GET request>----`)
            response.json("{\'status\':\'Hello from MongoDbApi!\'}");
        });
        
        this.router.post('/mongodb/api/insert', async (request,response)=>{
            console.log(`----<received mongodb request>----`)
            try{
                var res=await this.mongoClient.insertFile(request.body)
                console.log(res)
                response.json(res);  
            }catch(e){
                response.status(500).json(e)
            }
  
        });
        this.router.post('/mongodb/api/insertMany', async (request,response)=>{
            console.log(`----<received mongodb request>----`)
            try{
                var res=await this.mongoClient.insertManyFiles(request.body)
                console.log(res)
                response.json(res);  
            }catch(e){
                response.status(500).json(e)
            }
        });
        this.router.post('/mongodb/api/find', async (request,response)=>{
            console.log(`----<received mongodb request>----`)
            var file=await this.getFile(request.body)
            response.json(file);    
        });
        this.router.post('/mongodb/api/delete', async (request,response)=>{
            console.log(`----<received mongodb request>----`)
            console.log("to be implemented")
            response.json("{\'status\':\'TO BE IMPLEMENTED\'}");    
        });
    }

    start(){
        //LISTEN TO REQUESTS
        this.router.listen(this.port, () => {
            console.log(`mongodb api is listening on port ${this.port}`);
        });
    }



}

module.exports=MongoDbRouter;