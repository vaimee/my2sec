var CachedConsumer= require("./CachedConsumer")
const EventEmitter = require("events").EventEmitter
/*###########################################
|| NAME: Synchronous consumer
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
############################################*/
class SynchronousConsumer extends CachedConsumer{
  constructor(jsap_file,queryname,sub_bindings,flagname,ignore_first_results){
    super(jsap_file,queryname,sub_bindings,ignore_first_results);
    this.flagname=flagname; //trigger flag
    this.em=new EventEmitter();
  }

  //@OVERRIDE
  async subscribeToSepa(){
    this.subscribeAndNotify(this.queryname,this.sub_bindings,
        "onAddedResults","onFirstResults","onRemovedResults","onError",
        this.ignore_first_results
        );
    this.newSubRouter("GET_SYNCHRONIZATION_FLAG",{
        flag_type:this.flagname
      },"onSyncFlag",this.ignore_first_results)
  }

  //EMIT SYNCH EVENT
  getFlagEmitter(){
    return this.em
  }
  onSyncFlag(bind){
    this.log.debug("Flag "+this.flagname+" received, user: "+bind.usergraph)
    this.em.emit("newsyncflag",bind);
    this.RESET_SYNCHRONIZATION_FLAG({flag:bind.flag})
  }

  //override add binding to cache and remove binding from cache

}

module.exports = SynchronousConsumer;