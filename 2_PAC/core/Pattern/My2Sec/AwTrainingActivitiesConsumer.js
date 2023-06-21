const SynchronousConsumer = require("../SynchronousConsumer");

class AwTrainingActivitiesConsumer extends SynchronousConsumer{
    constructor(jsap,_activities_graph,_trainingActivitiesFlag){
        super(jsap,"ALL_USERS_TRAINING_ACTIVITIES",{
            activities_graph:_activities_graph
          },_trainingActivitiesFlag,false)
    }


    get_cache_by_user(usergraph){
        var activitiesMap=this.get_cache().get(usergraph)
        var bindings=[]
        for(const uri of activitiesMap.keys()){
            var currActivityMap=activitiesMap.get(uri)
            bindings.push({
                "nodeid":uri,
                "user_graph":currActivityMap.get("usergraph"),
                "event_type":currActivityMap.get("event_type"),
                "activity_type":currActivityMap.get("activity_type"),
                "app":currActivityMap.get("app"),
                "title":currActivityMap.get("title"),
                "datetimestamp":currActivityMap.get("datetimestamp"),
                "duration":currActivityMap.get("duration"),
                "task":currActivityMap.get("task")
            })
        }
        return bindings
    }

    add_binding_to_cache(binding){
        console.log(binding)
        //if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(!this.get_cache().has(binding.usergraph)){
            const activitiesMap=new Map();
            this.get_cache().set(binding.usergraph,activitiesMap)
        }
        
        //
        var userCache=this.get_cache().get(binding.usergraph)
        if(!userCache.has(binding.nodeid)){
            var activity=new Map();
            activity.set("usergraph",binding.usergraph)
            activity.set("event_type",binding.event_type)
            activity.set("app",binding.app)
            activity.set("activity_type",binding.activity_type),
            activity.set("title",binding.title)
            activity.set("datetimestamp",binding.datetimestamp)
            activity.set("duration",binding.duration)
            activity.set("task",binding.task)
            userCache.set(binding.nodeid,activity)
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


module.exports= AwTrainingActivitiesConsumer