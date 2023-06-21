const MongoDbClient=require("../../clients/MongoDbClient.js")
const Producer=require("../Producer")

class MongoDbMessagesRemover extends Producer{
    constructor(jsap){
        super(jsap,"DELETE_MESSAGE")
        
        const config=this.getMongoDbClientConfigurationFromJsap()
        this.mongoClient=new MongoDbClient(config.uri,config.database,config.collection);
    }

    getMongoDbClientConfigurationFromJsap(){
        return jsap.extended.MongoDbClientConfiguration
    }

    async updateSepaAndMongo(binding,id){

        var res=await this.mongoClient.deleteFileByObjectId(id)
        var sepaRes=await this.updateSepa(binding)
        return sepaRes;

    }

}

module.exports=MongoDbMessagesRemover