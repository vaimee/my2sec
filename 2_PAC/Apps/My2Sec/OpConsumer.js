var PacFactory=require('../../core/PacFactory.js'); //Pac Factory
var OpClient=require('../../core/clients/OpenProjectClient.js');
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class OpConsumer extends PacFactory{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################");
    console.log("║║ # App: OpenProject consumer v0.1");
    console.log("║║ ###########################");
    super(jsap_file);
    this.cache=[];
    this.opClient=new OpClient(jsap_file.extended.OpenProjectClientConfiguration);
  }
  

  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){
    await this.testSepaSource();//Test DataSource
    this.subscribeAndNotify("ALL_OP_TASKS",{},
      "add_binding_to_cache","add_binding_to_cache","remove_binding_from_cache","onError"
      );

    //this.newSubRouter("ALL_OP_TASKS",{},"on_new_task")
    this.newSubRouter("ALL_LOG_TIMES",{},"add_log_time")
    this.log.info("##### APP INITIALIZED ######")
    //console.log("===============================================================================")
  }

  onError(e){
    console.log(e)
  }
  //Questa funzione deve contattare OpenProject e aggiungere lo spent time alla task corretta.
  /*
  binding={
    
  }
  */
  wait(t){
    return new Promise(resolve=>{
      setTimeout(() => {
        console.log("Delayed for "+t+" seconds.");
        resolve("OK")
      },t)
    })
  }
  /*async on_new_task(binding){
    this.cache.push(binding);
  }*/
  
  async add_log_time(_LOG_TIME){
    var _TASK;
    //console.log(binding)
    var task_uri=_LOG_TIME.task_uri;
    console.log("Log time for task: "+task_uri)
    var found=false;
    for(var task of this.cache){
      if(task.bnode==task_uri){
        found=true;
        _TASK=task;
        break;
      }
    }
    if(found){
      await this.opClient.update_wp(_TASK,_LOG_TIME)
      /*var response=await this.SET_SYNCHRONIZATION_FLAG({
            flag_type:"http://www.vaimee.it/my2sec/testfinished",
            usergraph:"http://www.vaimee.it/my2sec/defuser@vaimee.it"
      })*/
    }else{
      throw new Error("task not found")
    }

  }


  //UTILITY
  add_binding_to_cache(binding){
    if(!this.cache_has_item(binding)){
      //this.log.debug("Porcodio")
      this.cache.push(binding)
    }else{
      this.log.debug("item already exists, skipping push to cache")
    }
    this.log.trace("Cache update finished, cache size: "+this.cache.length)
  }

  get_cache(){
    return this.cache
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
    console.log("Removing Binding: ",binding)
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
        this.log.debug("Cache udpated, graph length: "+temp)

  }




}//end of class 



module.exports = OpConsumer;