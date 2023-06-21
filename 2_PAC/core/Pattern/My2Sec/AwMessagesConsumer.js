const SynchronousConsumer = require("../SynchronousConsumer");

class AwMessagesConsumer extends SynchronousConsumer{
    constructor(jsap){
        super(jsap,"ALL_USERS_MESSAGES",{
            message_graph: "http://www.vaimee.it/my2sec/messages/activitywatch/mongo"
          },"http://www.vaimee.it/my2sec/awmongoproducerflag",false)
    }

    get_cache_by_user(usergraph){
        var messagesMap=this.get_cache().get(usergraph)
        
        var bindings=[]
        for(const uri of messagesMap.keys()){
            console.log(uri)
            var currMessageMap=messagesMap.get(uri)
            bindings.push({
                "usergraph":usergraph,
                "source":currMessageMap.get("source"),
                "msgtimestamp":currMessageMap.get("msgtimestamp"),
                "msgvalue":currMessageMap.get("msgvalue")
            })
        }
        this.log.trace(bindings)
        return bindings
    }

    add_binding_to_cache(binding){
        if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(!this.get_cache().has(binding.usergraph)){
            const bindingMap=new Map();
            this.get_cache().set(binding.usergraph,bindingMap)
        }
        
        var userCache=this.get_cache().get(binding.usergraph)
        if(!userCache.has(binding.b)){
            var message=new Map();
            message.set("source",binding.source)
            message.set("msgtimestamp",binding.msgtimestamp)
            message.set("msgvalue",binding.msgvalue)
            userCache.set(binding.b,message)
        }
        this.log.trace(this.get_cache())
    }
    remove_binding_from_cache(binding){
        if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(this.get_cache().has(binding.usergraph)){
            var userCache=this.get_cache().get(binding.usergraph)
            userCache.delete(binding.b)
        }else{
            this.log.debug("Skipping binding, key does not exist");
            return;
        }
        this.log.trace(this.get_cache())
    }


}

module.exports=AwMessagesConsumer
