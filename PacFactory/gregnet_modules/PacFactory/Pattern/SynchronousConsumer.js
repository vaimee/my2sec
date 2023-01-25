var Consumer=require('./Consumer.js'); //Pac Factory
const EventEmitter = require("events").EventEmitter
/*###########################################
|| NAME: Synchronous consumer
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
############################################*/
class SynchronousConsumer extends Consumer{
  constructor(jsap_file,queryname,sub_bindings,flagname,ignore_first_results){
    super(jsap_file,queryname,sub_bindings);
    this.flagname=flagname; //trigger flag
    this.cachedGraphs=[]; //internal cache
    this.ignore_first_results=ignore_first_results;
    this.em=new EventEmitter();
  }
  async subscribeToSepa(){
    this.subscribeAndNotify(this.queryname,this.sub_bindings,
        "onAddedResults","onFirstResults","onRemovedResults","onError"
        );
    this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
        flag_type:this.flagname
    },"onSyncFlag")
  }
  //EMIT SYNCH EVENT
  onSyncFlag(bind){
    this.log.debug("Flag received, user: "+bind.usergraph)
    this.em.emit("newsyncflag",bind);
    this.RESET_SYNCHRONIZATION_FLAG({flag:bind.flag})
  }

  //MANAGE NOTIFICATIONS
  onFirstResults(not){
    if(this.ignore_first_results){
        this.log.debug("Ignored first results");
    }else{
        this.log.trace("First results for "+this.queryname+" consumer: "+not);
        this.log.trace("Not ignoring first results, calling onAddedResults");
        this.onAddedResults(not);
    }
  }
  onAddedResults(binding){
    //this.log.trace("Adding results to cache");
    this.add_binding_to_cache(binding)
    //this.log.trace("Added results to cache for "+this.queryname+" consumer");
    //this.log.trace("Cached graph length: "+this.cachedGraphs[binding.usergraph].length)
    //this.log.trace(JSON.stringify(binding));
  }
  onRemovedResults(not){
    //this.log.trace("Removing results from cache");
    this.remove_binding_from_cache(not)
    //this.log.trace(JSON.stringify(not));  
  }

  //MANAGE CACHE
  get_cache_by_user(usergraph){
    console.log("Cache returned")
    return this.cachedGraphs[usergraph]
  }
  async add_binding_to_cache(binding){
    if(Object.keys(this.cachedGraphs).join(",").includes(binding.usergraph)){
      this.cachedGraphs[binding.usergraph].push(binding)
    }else{
      //create new graph cache
      this.cachedGraphs[binding.usergraph]=[]
      this.cachedGraphs[binding.usergraph].push(binding)
    }
    var tempLog=this.cachedGraphs[binding.usergraph].length
    this.log.trace("Cached update finished, graph length: "+tempLog+", cached graphs: "+Object.keys(this.cachedGraphs).length)

  }
  async remove_binding_from_cache(binding){
    //Dobbiamo tentare di rimuovere questo binding
    //console.log("Binding: ",binding)
    if(Object.keys(this.cachedGraphs).join(",").includes(binding.usergraph)){
      //ritorna true quando vuoi rimuovere l'item
        this.cachedGraphs[binding.usergraph] = this.cachedGraphs[binding.usergraph].filter(function(item) {
            //console.log(item)
            try{
                for(var k in binding){
                    //console.log(`binding[${k}]=${binding[k]}`)
                    if(item.hasOwnProperty(k)){
                        //console.log(`cache[${k}]=${item[k]}`)
                        if(binding[k]==item[k]){
                            //console.log("Match found!");
                        }else{
                            //console.log("Match not found")
                            //console.log("Not removed: ",item.timenode)
                            return true;
                        }
                    }else{
                        return true;
                    }
                };
            }catch(e){
                console.log(e);
                return true;
            }
            //console.log("Removed item: ",item)
            return false;
        });

        var tempLog=this.cachedGraphs[binding.usergraph].length
        if(this.cachedGraphs[binding.usergraph].length==0){
            delete this.cachedGraphs[binding.usergraph]
        }
        this.log.trace("Cache udpated, graph length: "+tempLog+", cached graphs: "+Object.keys(this.cachedGraphs).length)

    }else{
        this.log.warn("Wrong user, can't remove item from cache")
    }
  }

  //MANAGE ERRORS
  onError(err){
    throw new Error(`Error from ${this.queryname} consumer: ${err}`)
  }

}

module.exports = SynchronousConsumer;