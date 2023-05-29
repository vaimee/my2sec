class GregLogs{
  constructor() {
    this.loglevel=this.getLogLevel();
    this.separator=this.getSeparator();
    //this.info("New Greglogs logger created!")
    var divLoggerConfig=this.getDivLogger();
    this.divLoggerEnabled=divLoggerConfig.enabled;
    this.divLoggerLogLevel=divLoggerConfig.logLevel;
    if(this.divLoggerEnabled){
      this.element=document.getElementById(divLoggerConfig.elementId);
      this.overrideDivLoggerEnable(false)
      this.trace("GregLogs: DivLogger Enabled")
      this.overrideDivLoggerEnable(true)
    }

    
  }

  overrideDivLoggerEnable(enable){
    this.divLoggerEnabled=enable
  }

  getSeparator(){
    return __GREGLOGS_LOGGER_CONFIG__.separator
  }

  getLogLevel(){
    return __GREGLOGS_LOGGER_CONFIG__.logLevel
  }

  getDivLogger(){
    return __GREGLOGS_LOGGER_CONFIG__.divLogger
  }

  trace_table(text){
    if(this.loglevel<1){
      console.table(text);
    }      
  }    
  debug_table(text){
    if(this.loglevel<2){
      console.table(text);
    }      
  }    
  info_table(text){
    if(this.loglevel<3){
      console.table(text);
    }      
  }


  //=========
  //[3] LOG
  //logLevel(level){
  //  this.loglevel=level;
  //}
  trace(text){
    if(this.loglevel<1){
      console.log(get_current_timestamp()+this.separator+"[trace] ",text);
    }      
    if(this.divLoggerEnabled){
      if(this.divLoggerLogLevel<1){
        this.element.innerHTML=this.element.innerHTML+get_current_timestamp()+this.separator+"[trace] "+text+"<br>";
      }      
    }      
  }
  debug(text){
    if(this.loglevel<2){
      console.log(get_current_timestamp()+this.separator+"[debug] ",text);
    }
    if(this.divLoggerEnabled){
      if(this.divLoggerLogLevel<2){
        this.element.innerHTML=this.element.innerHTML+get_current_timestamp()+this.separator+"[debug] "+text+"<br>";
      }      
    }  
  }
  info(text){
    //var string=this.info.caller.name
    if(this.loglevel<3){
      console.log(get_current_timestamp()+this.separator+"[info] ",text);
    }
    if(this.divLoggerEnabled){
      if(this.divLoggerLogLevel<3){
        this.element.innerHTML=this.element.innerHTML+get_current_timestamp()+this.separator+"[info] "+text+"<br>";
      }      
    }  
  }
  warning(text){
    if(this.loglevel<4){
      console.log(get_current_timestamp()+this.separator+"[WARNING] ",text);
    }
    if(this.divLoggerEnabled){
      if(this.divLoggerLogLevel<4){
        this.element.innerHTML=this.element.innerHTML+get_current_timestamp()+this.separator+"[WARNING] "+text+"<br>";
      }      
    }  
  }
  error(text){
    console.log(get_current_timestamp()+this.separator+"[ERROR] ",text);
    if(this.divLoggerEnabled){
      if(this.divLoggerLogLevel<4){
        this.element.innerHTML=this.element.innerHTML+get_current_timestamp()+this.separator+"[ERROR] "+text+"<br>";
      }      
    }  
  }
}



//----------------------
//NAME: GET CURRENT TIME
//DESCRIPTION: returns the current formatted time
function get_current_timestamp(){
    const date=new Date();
    var string_timestamp=date.toISOString()
    var stArr=string_timestamp.split("T");
    string_timestamp=stArr.join(" ");
    //console.log(stringa)
    return string_timestamp
}//get_current_timestamp()

function getTimestampChris() {
	date = new Date();
	return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};



//module.exports = GregLogs;