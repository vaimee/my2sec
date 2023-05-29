//var Consumer=require('./Consumer.js'); //Pac Factory
//const EventEmitter = require("events").EventEmitter
/*###########################################
|| NAME: Synchronous consumer
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
############################################*/
class CachedConsumer extends Consumer{
    constructor(jsap_file,queryname,sub_bindings,ignore_first_results){
      super(jsap_file,queryname,sub_bindings);
      this.cache=[]; //internal cache
      this.ignore_first_results=ignore_first_results;
      //this.counter=0;
      //this.em1=new SyncEvent()//EventEmitter();
    }
  
    //MANAGE NOTIFICATIONS
    onFirstResults(not){
      if(this.ignore_first_results){
          this.log.debug("Ignored first results");
      }else{
          this.log.trace("First results for "+this.queryname+" consumer: ");
          this.log.trace(not)
          this.log.trace("Not ignoring first results, calling onAddedResults");
          this.onAddedResults(not);
      }
    }
    onAddedResults(binding){
      //console.log("Added results")
      //this.log.trace("Adding results to cache");
      
      this.add_binding_to_cache(binding)
      
      //this.log.trace("Added results to cache for "+this.queryname+" consumer");
      //this.log.trace("Cached graph length: "+this.cachedGraphs[binding.usergraph].length)
      //this.log.trace(JSON.stringify(binding));
      this.em.emit("addedResultsToCache")
    }
    onRemovedResults(not){
      //this.log.trace("Removing results from cache");
      this.remove_binding_from_cache(not)
      //this.log.trace(JSON.stringify(not));  
      this.em.emit("removedResultsFromCache")
    }
  
    //MANAGE CACHE
    get_cache(){
        return this.cache
    }
    clean_cache(){
        this.cache=[];
        this.log.trace("cleaned cache")
    }
    get_cache_by_user(usergraph){
      throw new Error("Cannot get cache by user from CachedConsumer. Use SynchronousConsumer instead")
    }
    add_binding_to_cache(binding){
        if(!this.cache_has_item(binding)){
          //this.log.debug("Porcodio")
          this.cache.push(binding)
        }else{
          this.log.debug("item already exists, skipping push to cache")
        }
        this.log.trace("Cache update finished, cache size: "+this.cache.length)
    }


    cache_has_item(binding){
      var cache=this.get_cache();
      var out=false;

      for(var i=0; i<cache.length; i++){
        var el=cache[i]
        //this.log.debug(el)
        var found=true;
        for(var k in binding){
            //console.log("Evaluating property: "+k)
            if(!el.hasOwnProperty(k)){
              found=false;
            }else{
              //console.log("Found property: "+k)
              //console.log("Comparing el: "+el[k]+" with binding: "+binding[k])
              if(el[k]!=binding[k]){
                found=false;
              }
            }
        }
        if(found){
          
          out=true
        }
      }

      if(out){
        this.log.trace("Item already exists in cache, skipping push")
      }else{
        this.log.trace("Item does not exist")
      }
      return out
    }


    remove_binding_from_cache(binding){
      //Dobbiamo tentare di rimuovere questo binding
      //console.log("Binding: ",binding)
        //ritorna true quando vuoi rimuovere l'item
        this.cache = this.cache.filter(function(item) {
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
  
          var temp=this.cache.length
          this.log.trace("Cache udpated, graph length: "+temp)
  
    }
  
    //MANAGE ERRORS
    onError(err){
      throw new Error(`Error from ${this.queryname} consumer: ${err}`)
    }
  
  }
  

  
  //module.exports = SynchronousConsumer;