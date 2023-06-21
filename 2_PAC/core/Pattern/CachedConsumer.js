var Consumer= require("./Consumer")

class CachedConsumer extends Consumer{
    constructor(jsap_file,queryname,sub_bindings,ignore_first_results){
        super(jsap_file,queryname,sub_bindings,ignore_first_results);
        this.cache=new Map(); //internal cache
    }

    //@OVERRIDE
    //MANAGE NOTIFICATIONS
    onFirstResults(not){
        this.onAddedResults(not);
    }
    onAddedResults(binding){
        this.add_binding_to_cache(binding)
    //this.em.emit("addedResultsToCache")
    }
    onRemovedResults(binding){
        this.remove_binding_from_cache(binding)
    //this.em.emit("removedResultsFromCache")
    }


    get_cache(){
        return this.cache;
    }
    wipe_cache(){
        this.cache.clear()
    }

    /**
     * Generic methods, uses usergraph as basic hashmap key. 
     * I suggest override
     * @param {*} binding 
     */
    add_binding_to_cache(binding){
        if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(this.get_cache().has(binding.usergraph)){
            this.log.debug("Skipping binding, key already exists");
            return;
        }else{
            this.get_cache().set(binding.usergraph,binding)
        }
        this.log.trace(this.get_cache())
    }
    remove_binding_from_cache(binding){
        if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(!this.get_cache().has(binding.usergraph)){
            this.log.debug("Skipping binding, key does not exist");
            return;
        }else{
            this.get_cache().delete(binding.usergraph)
        }
        this.log.trace(this.get_cache())
    }

}

module.exports = CachedConsumer;