console.log("-> Loaded external script: greglogs.js")
//CREATE DATE OBJECT
+ new Date();
//LOG LEVELS
var environment_log_level=process.env.LOG_LEVEL
if ((environment_log_level == 0) || (environment_log_level == 1) || (environment_log_level == 2)) {
    console.log("loading environment variable: LOG_LEVEL= "+environment_log_level)
    var log_level=environment_log_level;
}else{
    console.log("LOG_LEVEL env variable not found, default level: 0")
    var log_level=0; //debug=0, essential=1, error/warning=2
}



//FUNZIONE CHIAMABILE DALL'ESTERNO
exports.consoleLog = function(level,argument){
    if (level>=log_level){

        if(level==0){
            console.log(get_time()+" [DEBUG] "+argument)
        }else{
            if(level==1){
                console.log(get_time()+" [INFO ] "+argument)
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