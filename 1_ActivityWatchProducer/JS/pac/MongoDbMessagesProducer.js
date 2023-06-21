class MongoDbMessagesProducer extends Producer{
    constructor(jsap,userEmail){
        super(jsap,"SEND_MESSAGE")
        this.userEmail=userEmail;
        if(this.userEmail==null||this.userEmail==undefined){throw new Error("UserEmail cannot be null")}
        this.mongoClient=new MongoDbClient(jsap);
    }


    async updateMultipleSepaAndMongo(bindings){
        const mongoFilesArr=this.formatMongoArr(bindings)

        const res=await this.mongoClient.insertManyFiles(mongoFilesArr);
        console.log(res)
        const mongoIdsOrderedArr=this.formatIdsArr(res)
        console.log(mongoIdsOrderedArr)
        //throw new Error("MAO")

        const sepaBindingsArr=this.formatBindingsArr(bindings,mongoIdsOrderedArr)

        for(var i in sepaBindingsArr){
            this.log.trace(sepaBindingsArr[i])
            await this.updateSepa(sepaBindingsArr[i]);
        }

        return res;

    }
    formatIdsArr(insertRes){
        var insertedCount=insertRes.insertedCount;
        var idsArr=insertRes.insertedIds;
        var out=[];
        for(var i=0;i<insertedCount;i++){
            out[i]=idsArr[i.toString()].toString("hex")
        }
        return out
    }
    formatBindingsArr(bindings,mongoArr){
        if(bindings.length!=mongoArr.length){throw new Error("Bindings mismatch with mongo ids arr")}
        var out=[]
        for(var i in bindings){
            var newBinding={
                message_graph: bindings[i].message_graph,
                usergraph: bindings[i].usergraph,
                source: bindings[i].source,
                msgtimestamp: bindings[i].msgtimestamp,
                msgvalue: mongoArr[i]
            }
            out.push(newBinding)
            
        }
        return out
    }
    formatMongoArr(bindings){
        var out=[]
        for(var i in bindings){
            out.push({value:bindings[i].msgvalue})
        }
        return out
    }

    async send_messages_to_sepa_and_mongo(rawEvents){
        var messageGraph= "http://www.vaimee.it/my2sec/messages/activitywatch/mongo";
        var userGraph="http://www.vaimee.it/my2sec/"+this.userEmail;
        var bindings=[]
        for(var k in rawEvents){
            var timestamp=this.get_current_timestamp()
            var msgValue=rawEvents[k];
            //Construct Binding
            var binding={
                message_graph: messageGraph,
                usergraph: userGraph,
                source: "http://www.vaimee.it/sources/"+k,
                msgtimestamp: timestamp,
                msgvalue: msgValue
            }
            //this.log.debug(binding)
            bindings.push(binding)
        }
        await this.updateMultipleSepaAndMongo(bindings);
        return true
    }

    get_current_timestamp(){
        const date=new Date();
        var string_timestamp=date.toISOString()
        return string_timestamp
    }//get_current_timestamp()

}
