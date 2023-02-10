//var PacFactory=require('../PacFactory.js'); //Pac Factory
/*###########################################
|| NAME: PRODUCER
|| AUTHOR: Gregorio Monari
|| DATE: 18/1/2023
############################################*/
class Producer extends PacFactory{
  constructor(jsap_file,updatename){
    super(jsap_file);
    this.privateJsap=jsap_file;
    this.updatename=updatename;
    this.update_bindings={};//deprecated? non la trovo mai usata
  }

  async updateSepa(bindings){
    
    try{
      var failed=false;
      var forcedBindings=this.privateJsap.updates[this.updatename].forcedBindings;   
      
      if(Object.keys(forcedBindings).length==Object.keys(bindings).length){
        Object.keys(forcedBindings).forEach(fk=>{
          if(!bindings.hasOwnProperty(fk)){
            failed=true;
          }
        })
      }else{
        failed=true;
      }
    }catch(e){console.log(e)}

    if(failed){
        this.log.error("Bindings mismatch in update: "+this.updatename+", showing logs:")
        console.log("bindings: "+Object.keys(bindings).join(" - "))
        console.log("forcedBindings: "+Object.keys(forcedBindings).join(" - "))
        throw new Error(`Bindings mismatch`)
    }else{
      this.log.trace("bindings ok")
    }

    var res=await this[this.updatename](bindings)
    return res;
  }


  onError(err){
    throw new Error(`Error from ${this.queryname} consumer: ${err}`)
  }

}

//module.exports = Producer;