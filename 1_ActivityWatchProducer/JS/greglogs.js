//CREATE DATE OBJECT
+ new Date();
//LOG LEVELS
var log_level=0; //debug=0, essential=1, error/warning=2


class GregLogs{
    constructor() {
      this.loglevel=0;
      //this.info("New Greglogs logger created!")
    }
    //=========
    //[3] LOG
    //logLevel(level){
    //  this.loglevel=level;
    //}

    //TABLES
    trace_table(table){
      if(this.loglevel<1){
        console.table(table);
      }      
    }
    debug_table(table){
      if(this.loglevel<2){
        console.table(table);
      }   
    }
    info_table(table){
      if(this.loglevel<3){
        console.table(table);
      }   
    }

    //TEXT
    trace(text){
      if(this.loglevel<1){
        console.log(this.get_current_timestamp()+" | [trace] "+text);
      }
    }
    debug(text){
      if(this.loglevel<2){
        console.log(this.get_current_timestamp()+" | [debug] "+text);
      }
    }
    info(text){
      if(this.loglevel<3){
        console.log(this.get_current_timestamp()+" | [info] "+text);
      }
    }
    warning(text){
      if(this.loglevel<4){
        console.log(this.get_current_timestamp()+" | [warning] "+text);
      }
    }
    error(text){
      console.log(this.get_current_timestamp()+" | [error] "+text);
    }

    //----------------------
    //NAME: GET CURRENT TIME
    //DESCRIPTION: returns the current formatted time
    get_current_timestamp(){
        const date=new Date();
        var string_timestamp=date.toISOString()
        //console.log(stringa)
        return string_timestamp
    }//get_current_timestamp()
}

log = new GregLogs(0)






//============================================

function consoleLog(level,argument){
    if (level>=log_level){

        if(level==0){
            console.log(get_time()+" [DEBUG] "+argument)
        }else{
            if(level==1){
                console.log(get_time()+" [INFO] "+argument)
            }else{
                console.log(get_time()+" [WARNING] "+argument)
            }
        }

        
    }
}

function get_time(){
    var UTC=2;
    var t_seconds=Math.floor(Date.now() / 1000);
    var t_days=(t_seconds/(3600*24));

    var float_h=(t_days-Math.floor(t_days))*24;
    var hours=Math.floor(float_h);
    var utc_hours=hours+UTC;

    var float_m=(float_h-hours)*60;
    var minutes=Math.floor(float_m);

    var float_s=(float_m-minutes)*60;
    var seconds=Math.floor(float_s);
    
    var timestring=utc_hours+":"+minutes+":"+seconds
    //console.log(timestring)
    return timestring
}