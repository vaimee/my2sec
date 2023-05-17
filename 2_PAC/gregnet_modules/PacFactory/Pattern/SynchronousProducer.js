var Producer=require('./Producer.js'); //Pac Factory
/*###########################################
|| NAME: PRODUCER
|| AUTHOR: Gregorio Monari
|| DATE: 18/1/2023
############################################*/
class SynchronousProducer extends Producer{
  constructor(jsap_file,updatename,flagname){
    super(jsap_file,updatename);
    //this.privateJsap=jsap_file;
    //this.updatename=updatename;
    this.flagname=flagname;
    this.genericFlagProducer= new Producer(jsap_file,"SET_SYNCHRONIZATION_FLAG");
    this.genericFlagProducer.log.loglevel=this.log.loglevel;
  }

  //TODO: split updateSepa and updateFlag in two separate functions
  async updateSepa(bindings,usergraph){
    console.log("WARNING: updateSepa is deprecated and will soon be removed.")
    var res=await super.updateSepa(bindings)
    console.log("sending flag: "+this.flagname)
    var flag_res=await this.genericFlagProducer.updateSepa({
        flag_type:this.flagname,
        usergraph:usergraph
      });
    return res;
  }


  onError(err){
    throw new Error(`Error from ${this.queryname} consumer: ${err}`)
  }

}

module.exports = SynchronousProducer;