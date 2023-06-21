const { MongoClient } = require('mongodb')


class MongoDbClient{
    constructor(uri,database,collection){
        this.uri=uri;
        this.database=database;
        this.collection=collection; //one user has one collection, the name is the usergraph
    }

    async deleteFileByObjectId(id){
        if(!id){throw new Error("Id cannot be null")}
        let client;
        try{
            client = new MongoClient(this.uri);
            const database = client.db(this.database);
            const collection = database.collection(this.collection);
            //const id = '6479c6a0574f73c894ddd44c';
            const idObj=new ObjectId(id);
            const query = { _id: idObj };
            const res = await collection.deleteOne(query);//findOne(query, {});
            //console.log(file);
            return res;           
        }catch(e){
            console.log(e);
        }finally{
            await client.close();
        }     

    }

    async insertManyFiles(fileArr){
        if(!fileArr){throw new Error("FileArr cannot be null")}
        let client;
        try{
            client = new MongoClient(this.uri);
            const database = client.db(this.database);
            const collection = database.collection(this.collection);
            const result = await collection.insertMany(fileArr);
            //console.log(file);
            return result;           
        }catch(e){
            console.log(e);
        }finally{
            await client.close();
        }    
    }

    async insertFile(file){
        if(!file){throw new Error("File cannot be null")}
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

    async getFileByObjectId(id){
        let client;
        try{
            client = new MongoClient(this.uri);
            const database = client.db(this.database);
            const collection = database.collection(this.collection);
            //const id = '6479c6a0574f73c894ddd44c';
            const idObj=new ObjectId(id);
            const query = { _id: idObj };
            const file = await collection.findOne(query, {});
            //console.log(file);
            return file;           
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


module.exports=MongoDbClient;