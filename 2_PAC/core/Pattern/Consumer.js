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


  getConsumerQueryName(){
    return this.queryname
  }
  getConsumerBindings(){
    return this.sub_bindings
  }

  //TODO:WARNING, WORKS ONLY WITH MODIFIED JSAP CLASS (configs need to accept sparql11protocol)
  //@OVERRIDE
  async querySepa(){
    const queryName=this.getConsumerQueryName()
    const bindings=this.getConsumerBindings()
    var res=await this[queryName].query(bindings)
    res=this.extractResultsBindings(res)
    return res
  }
  async querySepaWithBindings(override_bindings){
    const queryName=this.getConsumerQueryName()
    const bindings=override_bindings;
    var res=await this[queryName].query(bindings)
    res=this.extractResultsBindings(res)
    return res  
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