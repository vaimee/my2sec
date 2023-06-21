const SynchronousConsumer = require("../SynchronousConsumer");

class AwTrainingEventsConsumer extends SynchronousConsumer{
    constructor(jsap,_events_graph,_awmapperFlag){
        super(jsap,"ALL_USERS_TRAINING_EVENTS",{
            events_graph:_events_graph
          },_awmapperFlag,false)
    }



    get_cache_by_user(usergraph){
        var eventsMap=this.get_cache().get(usergraph)
        var bindings=[]
        for(const uri of eventsMap.keys()){
            var currEventMap=eventsMap.get(uri)
            bindings.push({
                "nodeid":uri,
                "user_graph":currEventMap.get("usergraph"),
                "event_type":currEventMap.get("event_type"),
                "app":currEventMap.get("app"),
                "title":currEventMap.get("title"),
                "datetimestamp":currEventMap.get("datetimestamp"),
                "duration":currEventMap.get("duration"),
                "task":currEventMap.get("task")
            })
        }
        return bindings
    }

    add_binding_to_cache(binding){
        //if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(!this.get_cache().has(binding.usergraph)){
            const eventsMap=new Map();
            this.get_cache().set(binding.usergraph,eventsMap)
        }
        
        //?nodeid ?usergraph ?event_type ?app ?title ?datetimestamp ?duration ?task
        var userCache=this.get_cache().get(binding.usergraph)
        if(!userCache.has(binding.nodeid)){
            var event=new Map();
            event.set("usergraph",binding.usergraph)
            event.set("event_type",binding.event_type)
            event.set("app",binding.app)
            event.set("title",binding.title)
            event.set("datetimestamp",binding.datetimestamp)
            event.set("duration",binding.duration)
            event.set("task",binding.task)
            userCache.set(binding.nodeid,event)
        }
        this.log.trace(this.get_cache())
    }
    remove_binding_from_cache(binding){
        //if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(this.get_cache().has(binding.usergraph)){
            var userCache=this.get_cache().get(binding.usergraph)
            userCache.delete(binding.nodeid)
        }else{
            this.log.debug("Skipping binding, key does not exist");
            return;
        }
        this.log.trace(this.get_cache())
    }



}


module.exports=AwTrainingEventsConsumer