const fs=require("fs")
class GregLogs{
    constructor() {
      this.config=this.getConfig();
      this.loglevel=this.getLogLevel();
      this.separator=this.getSeparator();
      this.colorMapCache=this.setColorsMapCache();
      //this.info("New Greglogs logger created!")
    }

    wrapColoredSection(color,text){
      if(color==undefined||color==null){return text}
      var left ="--------------------------------------------------------------<"
      var right=">--------------------------------------------------------------"
      return left+this.getColorMap("Bright")+this.getColorMap(color)+text+this.getColorMap("nocolor")+right
    }

    wrapColor(color,text){
      if(color==undefined||color==null){return text}
      return this.getColorMap(color)+text+this.getColorMap("nocolor")
    }

    getColorMap(color){
      return this.getColorsMapCache()[color]
    }

    getColorsMapCache(){
      return this.colorMapCache;
    }

    setColorsMapCache(){
      return {
        "nocolor":"\x1b[0m",
        "Bright":"\x1b[1m",
        "Dim":"\x1b[2m",
        "Underscore":"\x1b[4m",
        "Blink":"\x1b[5m",
        "Reverse":"\x1b[7m",
        "Hidden":"\x1b[8m",

        "black":"\x1b[30m",
        "red":"\x1b[31m",
        "green":"\x1b[32m",
        "yellow":"\x1b[33m",
        "blue":"\x1b[34m",
        "magenta":"\x1b[35m",
        "cyan":"\x1b[36m",
        "white":"\x1b[37m",
        "gray":"\x1b[90m",
        
        "BgBlack":"\x1b[40m",
        "BgRed":"\x1b[41m",
        "BgGreen":"\x1b[42m",
        "BgYellow":"\x1b[43m",
        "BgBlue":"\x1b[44m",
        "BgMagenta":"\x1b[45m",
        "BgCyan":"\x1b[46m",
        "BgWhite":"\x1b[47m",
        "BgGray":"\x1b[100m",
      }
    }

    getConfig(){
      var file=fs.readFileSync("./resources/logger_config.json");
      return JSON.parse(file)
    }

    getSeparator(){
      return this.config.separator
    }
  
    getLogLevel(){
      return this.config.logLevel
    }
  
    getDivLogger(){
      return this.config.divLogger
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

    //TODO: get loglevel from jsap and env
    //=========
    //[3] LOG
    //logLevel(level){
    //  this.loglevel=level;
    //}
    trace(text){
      if(this.loglevel<1){
        console.log(get_current_timestamp()+this.separator+"[trace] ",text);
      }      
    }
    debug(text){
      if(this.loglevel<2){
        console.log(get_current_timestamp()+this.separator+"[debug] ",text);
      }
    }
    info(text){
      //var string=this.info.caller.name
      if(this.loglevel<3){
        console.log(get_current_timestamp()+this.separator+"[info] ",text);
      }
    }
    warning(text){
      if(this.loglevel<4){
        console.log(get_current_timestamp()+this.separator+"[WARNING] ",text);
      }
    }
    error(text){
      console.log(get_current_timestamp()+this.separator+"["+this.wrapColor("red","ERROR")+"]"+
      this.getColorMap("red"),text,this.getColorMap("nocolor"));
    }
  }
  
  
  
  //----------------------
  //NAME: GET CURRENT TIME
  //DESCRIPTION: returns the current formatted time
  function get_current_timestamp(){
      const date=new Date();
      var string_timestamp=date.toISOString()
      string_timestamp=string_timestamp.split("T");
      //console.log(stringa)
      return string_timestamp[0]+" "+string_timestamp[1].slice(0,string_timestamp[1].length-1)
  }//get_current_timestamp()



  module.exports = GregLogs;