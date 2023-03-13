var PacFactory=require('../PacFactory.js'); //Pac Factory
/*###########################################
|| NAME: CONSUMER
|| AUTHOR: Gregorio Monari
|| DATE: 18/1/2023
############################################*/
class Consumer extends PacFactory{
  constructor(jsap_file,queryname,sub_bindings){
    super(jsap_file);
    this.queryname=queryname;
    this.sub_bindings=sub_bindings;
  }
  async subscribeToSepa(){
    this.subscribeAndNotify(this.queryname,this.sub_bindings,
        "onAddedResults","onFirstResults","onRemovedResults","onError"
        );
  }

  onFirstResults(not){
    this.log.trace("First results for "+this.queryname+" consumer: "+JSON.stringify(not));
  }
  onAddedResults(not){
    this.log.trace("Added results for "+this.queryname+" consumer: "+JSON.stringify(not));
  }
  onRemovedResults(not){
    this.log.trace("Removed results for "+this.queryname+" consumer: "+JSON.stringify(not));
  }
  onError(err){
    throw new Error(`Error from ${this.queryname} consumer: ${err}`)
  }

}

module.exports = Consumer;