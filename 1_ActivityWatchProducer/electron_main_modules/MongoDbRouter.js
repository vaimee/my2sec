const express = require('express');
const MongoDbClient = require("./MongoDbClient")

class MongoDbRouter extends MongoDbClient{
    constructor(uri,database,collection,port){
        super(uri,database,collection)
        this.port=port;
        this.router = express();
        this.router.use(express.json()); 
        this.setup();
    }

    setup(){
        this.router.get('/mongodb/api', (request, response) => { //listen to all requests
            console.log(`----<received mongodb GET request>----`)
            response.json("hello from MongoDbApi!");
        });
        
        this.router.post('/mongodb/api/insert', async (request,response)=>{
            console.log(`----<received mongodb request>----`)
            await this.insertFile(request.body)
            response.json("OK");    
        });
        this.router.post('/mongodb/api/find', async (request,response)=>{
            console.log(`----<received mongodb request>----`)
            var file=await this.getFile(request.body)
            response.json(file);    
        });
        this.router.post('/mongodb/api/delete', async (request,response)=>{
            console.log(`----<received mongodb request>----`)
            console.log("to be implemented")
            response.json("TO BE IMPLEMENTED");    
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