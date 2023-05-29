class LogTimesConsumer extends CachedConsumer{
    constructor(jsap,userEmail){
        var queryName="USER_LOG_TIMES"
        var bindings={
            usergraph:"http://www.vaimee.it/my2sec/"+userEmail
        }
        super(jsap,queryName,bindings,false)

        this.emNaive= new CustomEventEmitter()

    }

    //@OVERRIDE
    onAddedResults(binding){
        //console.log("Added results")
        //this.log.trace("Adding results to cache");
        this.add_binding_to_cache(binding)
        //this.log.trace("Added results to cache for "+this.queryname+" consumer");
        //this.log.trace("Cached graph length: "+this.cachedGraphs[binding.usergraph].length)
        //this.log.trace(JSON.stringify(binding));
        this.em.emit("addedResultsToCache")

        this.emNaive.emit('addedResults', binding);
      }

    //@Override
    add_binding_to_cache(binding){
        //console.log(binding)
        if(!binding.hasOwnProperty("task_uri")){throw new Error("Invalid task, missing task_uri key")}
        if(!binding.hasOwnProperty("log_time")){throw new Error("Invalid task, missing log_time key")}
        if(!binding.hasOwnProperty("now")){throw new Error("Invalid task, missing now key")}
        if(binding["task_uri"]==null || binding["task_uri"]==undefined){throw new Error("Invalid task, missing bnode value")}
        if(binding["log_time"]==null || binding["log_time"]==undefined){throw new Error("Invalid task, missing project value")}
        if(binding["now"]==null || binding["now"]==undefined){throw new Error("Invalid task, missing taskid value")}
        var newBinding={
            task_uri:binding.task_uri,
            log_time:binding.log_time,
            now:binding.now
        }
        super.add_binding_to_cache(newBinding)
    }

    //@Override
    remove_binding_from_cache(binding){
        if(!binding.hasOwnProperty("task_uri")){throw new Error("Invalid task, missing task_uri key")}
        if(!binding.hasOwnProperty("log_time")){throw new Error("Invalid task, missing log_time key")}
        if(!binding.hasOwnProperty("now")){throw new Error("Invalid task, missing now key")}
        if(binding["task_uri"]==null || binding["task_uri"]==undefined){throw new Error("Invalid task, missing bnode value")}
        if(binding["log_time"]==null || binding["log_time"]==undefined){throw new Error("Invalid task, missing project value")}
        if(binding["now"]==null || binding["now"]==undefined){throw new Error("Invalid task, missing taskid value")}
        var newBinding={
            task_uri:binding.task_uri,
            log_time:binding.log_time,
            now:binding.now
        }
        super.remove_binding_from_cache(newBinding)
    }

}


class CustomEventEmitter {
    constructor() {
      this.listeners = {};
    }
  
    on(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
  
      this.listeners[event].push(callback);
    }
  
    emit(event, data) {
      const eventListeners = this.listeners[event];
  
      if (eventListeners) {
        eventListeners.forEach(listener => {
          listener(data);
        });
      }
    }
}
