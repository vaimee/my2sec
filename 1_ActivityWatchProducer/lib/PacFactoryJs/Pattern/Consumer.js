//var PacFactory=require('../PacFactory.js'); //Pac Factory
/*###########################################
|| NAME: CONSUMER
|| AUTHOR: Gregorio Monari
|| DATE: 18/1/2023
############################################*/
class Consumer extends PacFactory{
  constructor(jsap_file,queryname,sub_bindings){
    super(jsap_file);
    this.queryname=queryname;
    this.queryText=jsap_file.queries[queryname].sparql
    //console.log(this.queryText)
    this.sub_bindings=sub_bindings;
    this.em=new SyncEvent()//EventEmitter();
  }
  async subscribeToSepa(){
    this.subscribeAndNotify(this.queryname,this.sub_bindings,
        "onAddedResults","onFirstResults","onRemovedResults","onError"
        );
  }

  /**
   * Use this method instead of "subscribe to Sepa" to query with a consumer instead of subscribing
   */
  async querySepa(override){
    var res;
    var queryname=this.queryname;
    var bindings=this.sub_bindings;
    if(override==null || override==undefined){
      res=await this.query(queryname,bindings);
    }else{
      this.log.debug("Executing override query")
      var query=this.bench.sparql(this.queryText,bindings)
      //this.log.info("QUERY SEPA:"+query)
      res=await this.basicSepaClient.query(query,override);
      //res=await this.query(queryname,bindings,override);
    }

    return this.extractResultsBindings(res);
  }

  onFirstResults(not){
    this.log.trace("First results for "+this.queryname+" consumer: "+JSON.stringify(not));
    this.em.emit("firstResults")//("newsyncflag",bind);
  }
  onAddedResults(not){

    this.log.trace("Added results for "+this.queryname+" consumer: "+JSON.stringify(not));
    this.em.emit("addedResults")
  }
  onRemovedResults(not){
    this.log.trace("Removed results for "+this.queryname+" consumer: "+JSON.stringify(not));
    this.em.emit("removedResults")
  }
  onError(err){
    throw new Error(`Error from ${this.queryname} consumer: ${err}`)
  }

}


class SyncEvent extends EventTarget{
  emit(eventName){
    this.dispatchEvent(new Event(eventName))
  }
}
//module.exports = Consumer;