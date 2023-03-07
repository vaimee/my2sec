const { MongoClient } = require('mongodb')


class MongoDbClient{
    constructor(uri,database,collection){
        this.uri=uri;
        this.database=database;
        this.collection=collection; //one user has one collection, the name is the usergraph
    }

    async insertFile(file){
        let client;
        try{
            client = new MongoClient(this.uri);
            const database = client.db(this.database);
            const collection = database.collection(this.collection);
            const result = await collection.insertOne(file);
            //console.log(file);
            return result;           
        }catch(e){
            console.log(e);
        }finally{
            await client.close();
        }        
    }

    async getFile(query,options){
        let client;
        try{
            client = new MongoClient(this.uri);
            const database = client.db(this.database);
            const collection = database.collection(this.collection);
            if(!options) options={};
            const file = await collection.findOne(query, options);
            //console.log(file);
            return file;           
        }catch(e){
            console.log(e);
        }finally{
            await client.close();
        }
    }



}


const config={
    user:"root",
    password:"Gregnet-99",
    url:"localhost",
    port:"27017",
    database:"local",
    collection:"startup_log"
}


var uri="mongodb://root:Gregnet-99@localhost:27017/"
var database="local"
var collection="startup_log"
var client=new MongoDbClient(uri,database,collection);
var file=client.getFile({
    _id:"1aa11f35b6bf-1676558141161"
});