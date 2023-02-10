class Greglogs{
    constructor() {
      this.loglevel=0;
      //this.info("New Greglogs logger created!")
    }
    //=========
    //[3] LOG
    //logLevel(level){
    //  this.loglevel=level;
    //}
    trace(text){
      if(this.loglevel<1){
        console.log(get_current_timestamp()+" [trace] "+text);
      }      
    }
    debug(text){
      if(this.loglevel<2){
        console.log(get_current_timestamp()+" [debug] "+text);
      }
    }
    info(text){
      //var string=this.info.caller.name
      if(this.loglevel<3){
        console.log(get_current_timestamp()+" [info] "+text);
      }
    }
    warning(text){
      if(this.loglevel<4){
        console.log(get_current_timestamp()+" [WARNING] "+text);
      }
    }
    error(text){
      console.log(get_current_timestamp()+" [ERROR] "+text);
    }
  }
  
  
  
  //----------------------
  //NAME: GET CURRENT TIME
  //DESCRIPTION: returns the current formatted time
  function get_current_timestamp(){
      const date=new Date();
      var string_timestamp=date.toISOString()
      //console.log(stringa)
      return string_timestamp
  }//get_current_timestamp()



  //module.exports = GregLogs;