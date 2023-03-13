var PacFactory=require('../../gregnet_modules/PacFactory/PacFactory.js'); //Pac Factory
require("./greg_events.json.js")
require("./aw-watcher-afk.json.js")
require("./aw-watcher-start-stop.json.js")
require("./aw-watcher-notshutdown.json.js")
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class AwProducerTest extends PacFactory{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ###########################");
    console.log("║║ # App: ActivityWatch producer v0.1");
    console.log("║║ ###########################");
    super(jsap_file);
    this.numberOfEvents=200;
  }

  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){
    await this.testSepaSource();//Test DataSource
    this.log.info("##### APP INITIALIZED ######")
    //console.log("===============================================================================")
  }

  async set_producer_flag(usergraph){
    var response=await this.SET_SYNCHRONIZATION_FLAG({
        flag_type:"http://www.vaimee.it/my2sec/awproducerflag",
        usergraph:usergraph
    })
    this.log.debug("PRODUCER FLAG SET, user: "+usergraph);
    ////this.log.info("SET_SYNC_FLAG response: "+JSON.stringify(response))
  }

  async send_messages(usergraph){
    //var msgarr=this.select_intervals();
    var msgarr=await this.generate_messages();
    //console.log(msgarr)
    //throw new Error("MAO")
    //this.log.info("----- 2] Update events -----")
    var response=await this.SEND_MESSAGE({
        message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
        usergraph:usergraph,
        source:"http://www.vaimee.it/sources/aw-watcher-working",
        msgtimestamp:new Date().toISOString(),
        msgvalue:msgarr[0]
    })
    //this.log.info("SEND_MESSAGE response: "+JSON.stringify(response))
    //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
    response=await this.SEND_MESSAGE({
        message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
        usergraph:usergraph,
        source:"http://www.vaimee.it/sources/aw-watcher-afk",
        msgtimestamp:new Date().toISOString(),
        msgvalue:msgarr[1]
    })
    //this.log.info("SEND_MESSAGE response: "+JSON.stringify(response))
    //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
    var response=await this.SEND_MESSAGE({
        message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
        usergraph:usergraph,
        source:"http://www.vaimee.it/sources/aw-watcher-start-stop",
        msgtimestamp:new Date().toISOString(),
        msgvalue:msgarr[2]
    })
    //this.log.info("SEND_MESSAGE response: "+JSON.stringify(response))
    //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
    response=await this.SEND_MESSAGE({
        message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
        usergraph:usergraph,
        source:"http://www.vaimee.it/sources/aw-watcher-notshutdown",
        msgtimestamp:new Date().toISOString(),
        msgvalue:msgarr[3]
    })
    this.log.info("Sent 4 messages, user: "+usergraph);
    //this.log.debug("SEPA Response: "+JSON.stringify(response))
    //await this.log_graph("http://www.vaimee.it/my2sec/messages/activitywatch")
  }

  select_intervals(){
    var msgarr=this.import_json_events(this.numberOfEvents)
    //console.log(msgarr[1])
    var intervals=this.extract_start_stop_intervals(msgarr[2])
    
    console.log("SELECTED INTERVAL:")
    var interval=intervals[intervals.length-2];
    console.log(interval)
    msgarr[2]=[];
    msgarr[2].push({
        id:77,
        timestamp:interval.start,
        duration:0,
        data:{"start-stop":"start"}
    })
    msgarr[2].push({
        id:78,
        timestamp:interval.stop,
        duration:0,
        data:{"start-stop":"stop"}
    })
    msgarr[2]=JSON.stringify(msgarr[2])
    //console.log(msgarr[2])
    //console.log(msgarr[0])
    //throw new Error("MAO")
    /*
    //console.log(intervals)
    var max=0;
    var max_i=0;
    for(var i=0; i<intervals.length;i++){
        console.log("-----INTERVAL #"+i+"-----")
        var interval=intervals[i]//SELECT INTERVAl
        console.log(interval)
        //console.log(interval)
        var workinginterval=msgarr[0].replace(/\\\\/g,"\\");//BUGFIX	
        workinginterval=workinginterval.replace(/\\\"/g,"\"");//BUGFIX
        workinginterval=workinginterval.replace(/\\\'/g,"\'");//BUGFIX	
        var workinginterval=this.extract_msg_interval(workinginterval,interval);
        var afkinterval=this.extract_msg_interval(msgarr[1],interval);
        var notshutinterval=this.extract_msg_interval(msgarr[3],interval);
    }
    //console.log(max)
    //console.log(max_i)

    var interval=intervals[intervals.length-2]//SELECT INTERVAl
    //4 no
    //6 con 21 eventi no
    console.log(interval)
    msgarr[0]=msgarr[0].replace(/\\\\/g,"\\");//BUGFIX	
    msgarr[0]=msgarr[0].replace(/\\\"/g,"\"");//BUGFIX
    msgarr[0]=msgarr[0].replace(/\\\'/g,"\'");//BUGFIX	
    for(var i=0;i<4;i++){
        console.log("----PARSING MESSAGE "+i+"-----")
        msgarr[i]=this.extract_msg_interval(msgarr[i],interval);
        //console.log(msgarr[i])
        msgarr[i]=JSON.stringify(msgarr[i]);
    }
    msgarr[0]=msgarr[0].replace(/\\/g,"\\\\");//BUGFIX	
    msgarr[0]=msgarr[0].replace(/\"/g,"\\\"");//BUGFIX
    msgarr[0]=msgarr[0].replace(/\'/g,"\\\'");//BUGFIX
    */
    return msgarr
  }


  extract_msg_interval(msg,interval){
    var msg=JSON.parse(msg)
    //console.log(msg)
    //throw new Error("MICIUS")
    var wi=-1;
    var wf=-1;
    //console.log("Examining "+msg.length+" events")
    var sa=new Date(interval.start)
    var st=new Date(interval.stop)
    //evento più vecchio alla fine del messaggio
    for(var i=msg.length-1; i>=0;i--){
        console.log("EV "+msg[i].timestamp)
        var wt=new Date(msg[i].timestamp)
        if(wt>sa && wt<st && wi==-1){
            console.log("FOUND START: "+msg[i].timestamp)
            wi=i;
        }
        if(wt>st && wf==-1){
            //if però quello prima è bigger...
            console.log("FOUND STOP: "+msg[i].timestamp)
            wf=i;
        }
    }
    if(wf==-1){
        //if
        console.log("FOUND LAST STOP: "+msg[0].timestamp)
        wf=0;
    }
    //throw new Error("MICIUS")
    return msg.slice(wf,wi+1);
  }

  extract_start_stop_intervals(msgarr_2){
    var startstop=JSON.parse(msgarr_2);
    startstop=startstop.reverse();
    //console.log(startstop)
    this.log.info("Finding intervals from "+startstop.length+" start-stop events...")
    var intervals=[]
    var stop=true;
    var ti;
    for(var i=0; i<startstop.length; i++){//stop events
        var ev_type=startstop[i].data["start-stop"];
        var ev_time=startstop[i].timestamp;
        if(stop){
            if(ev_type=="start"){
                ti=ev_time;
                stop=false;
            }else{
                console.log("ERROR")
            }   
        }else{
            if(ev_type=="stop"){
                var newInterval={
                    start:ti,
                    stop:ev_time
                }
                intervals.push(newInterval);
                stop=true;
            }else{
                console.log("ERROR")
            }
        }
    }
    //throw new Error("mao")
    return intervals;
  }
   

  import_json_events(number){
    var eventsArr=JSON.parse(json_events);
    var afkArr=JSON.parse(afk_json);
    var startstopArr=JSON.parse(startstop_json);
    var notshutdownArr=JSON.parse(notshutdown_json);
    
    
    //SORT BY TIMESTAMP
    eventsArr=eventsArr.sort(function(x, y){
        return x.timestamp - y.timestamp;
    })
    afkArr=afkArr.sort(function(x, y){
        return x.timestamp - y.timestamp;
    })
    startstopArr=startstopArr.sort(function(x, y){
        return x.timestamp - y.timestamp;
    })
    notshutdownArr=notshutdownArr.sort(function(x, y){
        return x.timestamp - y.timestamp;
    })
    //SLICE ARRAY
    eventsArr=eventsArr.slice(0,number)
    afkArr=afkArr.slice(0,number)
    startstopArr=startstopArr.slice(0,number)
    notshutdownArr=notshutdownArr.slice(0,number)

    this.log.info("# Working Extraction results #")
    this.log.info("- Number of events: "+eventsArr.length)
    var eventsString=JSON.stringify(eventsArr)
    this.log.info("- String length: "+eventsString.length)
    this.log.info("# Afk Extraction results #")
    this.log.info("- Number of events: "+afkArr.length)
    var afkString=JSON.stringify(afkArr)
    this.log.info("- String length: "+afkString.length)
    this.log.info("# Start Stop Extraction results #")
    this.log.info("- Number of events: "+startstopArr.length)
    var startstopString=JSON.stringify(startstopArr)
    this.log.info("- String length: "+startstopString.length)
    this.log.info("# Notshutdown Extraction results #")
    this.log.info("- Number of events: "+notshutdownArr.length)
    var notshutdownString=JSON.stringify(notshutdownArr)
    this.log.info("- String length: "+notshutdownString.length)
    //console.log(eventsArr)
    eventsString=eventsString.replace(/\\/g,"\\\\");//BUGFIX	
    eventsString=eventsString.replace(/\"/g,"\\\"");//BUGFIX
    eventsString=eventsString.replace(/\'/g,"\\\'");//BUGFIX	
    return [eventsString,afkString,startstopString,notshutdownString];    
  }

  import_json_events_OLD(number){
    if(
        !events_json.hasOwnProperty("buckets") ||
        !afk_json.hasOwnProperty("buckets") ||
        !start_stop_json.hasOwnProperty("buckets")
    ){
        throw new Error("Warning, file is not a valid events json")
    }
    var selected_working_key=""
    var selected_afk_key=""
    var selected_start_stop_key=""
    var selected_notshutdown_key=""
    Object.keys(events_json.buckets).forEach(k=>{
        if(k.includes("aw-watcher-working")){
            selected_working_key=k
        }
    })
    this.log.info("Extracting events of: "+selected_working_key+"...")
    var eventsArr=events_json.buckets[selected_working_key].events
    
    Object.keys(afk_json.buckets).forEach(k=>{
        if(k.includes("aw-watcher-afk")){
            selected_afk_key=k
        }
    })
    this.log.info("Extracting events of: "+selected_afk_key+"...")
    var afkArr=afk_json.buckets[selected_afk_key].events
    
    Object.keys(start_stop_json.buckets).forEach(k=>{
        if(k.includes("aw-watcher-start-stop")){
            selected_start_stop_key=k
        }
    })
    this.log.info("Extracting events of: "+selected_start_stop_key+"...")
    var startstopArr=start_stop_json.buckets[selected_start_stop_key].events
    
    Object.keys(notshutdown_json.buckets).forEach(k=>{
        if(k.includes("aw-watcher-notshutdown")){
            selected_notshutdown_key=k
        }
    })
    this.log.info("Extracting events of: "+selected_notshutdown_key+"...")
    var notshutdownArr=notshutdown_json.buckets[selected_notshutdown_key].events

    //SORT BY TIMESTAMP
    eventsArr=eventsArr.sort(function(x, y){
        return x.timestamp - y.timestamp;
    })
    afkArr=afkArr.sort(function(x, y){
        return x.timestamp - y.timestamp;
    })
    startstopArr=startstopArr.sort(function(x, y){
        return x.timestamp - y.timestamp;
    })
    notshutdownArr=notshutdownArr.sort(function(x, y){
        return x.timestamp - y.timestamp;
    })
    //SLICE ARRAY
    eventsArr=eventsArr.slice(0,number)
    afkArr=afkArr.slice(0,number)
    startstopArr=startstopArr.slice(0,number)
    notshutdownArr=notshutdownArr.slice(0,number)

    this.log.info("# Working Extraction results #")
    this.log.info("- Number of events: "+eventsArr.length)
    var eventsString=JSON.stringify(eventsArr)
    this.log.info("- String length: "+eventsString.length)
    this.log.info("# Afk Extraction results #")
    this.log.info("- Number of events: "+afkArr.length)
    var afkString=JSON.stringify(afkArr)
    this.log.info("- String length: "+afkString.length)
    this.log.info("# Start Stop Extraction results #")
    this.log.info("- Number of events: "+startstopArr.length)
    var startstopString=JSON.stringify(startstopArr)
    this.log.info("- String length: "+startstopString.length)
    this.log.info("# Notshutdown Extraction results #")
    this.log.info("- Number of events: "+notshutdownArr.length)
    var notshutdownString=JSON.stringify(notshutdownArr)
    this.log.info("- String length: "+notshutdownString.length)
    //console.log(eventsArr)
    eventsString=eventsString.replace(/\\/g,"\\\\");//BUGFIX	
    eventsString=eventsString.replace(/\"/g,"\\\"");//BUGFIX
    eventsString=eventsString.replace(/\'/g,"\\\'");//BUGFIX	
    return [eventsString,afkString,startstopString,notshutdownString];
  }



  async generate_messages(){
    var msgarr=await this.get_file_messages();
    msgarr=this.jsonParseMsg(msgarr)
    for(var i in msgarr){
        msgarr[i]=JSON.stringify(msgarr[i])
    }
    return msgarr
  }


  jsonParseMsg(stringArr){
    for(var i in stringArr){
        //console.log(stringArr[i])
        stringArr[i]=stringArr[i].replace(/\\/g,"");
        stringArr[i]=JSON.parse(stringArr[i])
        //console.log(stringArr[i])
    }
    //throw new Error("MAO")
    return stringArr
  }


  async get_file_messages(){
    var stringArr=[];
    stringArr[0]=await this.readFile("./Apps/testClient/lucabug_23012023/working.txt")
    stringArr[1]=await this.readFile("./Apps/testClient/lucabug_23012023/afk.txt")
    stringArr[2]=await this.readFile("./Apps/testClient/lucabug_23012023/startstop.txt")
    stringArr[3]=await this.readFile("./Apps/testClient/lucabug_23012023/notshutdown.txt")
    return stringArr;
  }

  generate_messages_OLD(){
    var msgarr=[];
    //WORKING
    msgarr[0]=[
        {
            id:2,
            timestamp:"2022-12-20T10:03:00.000000+00:00",
            duration:86.738,
            data:{
                "app":"Discord.exe",
                "title":"meeting-room-a | VAIMEE - Discord",
                "url":"None"
            }
        },
        {
            id:4,
            timestamp:"2022-12-20T10:10:00.000000+00:00",
            duration:86.738,
            data:{
                "app":"Discord.exe",
                "title":"meeting-room-a | VAIMEE - Discord",
                "url":"None"
            }
        },  
        {
            id:6,
            timestamp:"2022-12-20T10:12:00.000000+00:00",
            duration:86.738,
            data:{
                "app":"Code.exe",
                "title":"main.js",
                "url":"None"
            }
        },
        {
            id:8,
            timestamp:"2022-12-20T10:17:00.000000+00:00",
            duration:86.738,
            data:{
                "app":"Code.exe",
                "title":"main.js",
                "url":"None"
            }
        },        
    ]
    //AFK
    msgarr[1]=[]
    //START-STOP
    msgarr[2]=[
        {
            id:0,
            timestamp:"2022-12-20T10:00:00.000000+00:00",
            duration:0,
            data:{
                "start-stop":"start"
            }
        },  
        {
            id:9,
            timestamp:"2022-12-20T10:20:00.000000+00:00",
            duration:0,
            data:{
                "start-stop":"stop"
            }
        },               
    ]
    //NOTSHUTDOWN
    msgarr[3]=[
        {
            id:1,
            timestamp:"2022-12-20T10:01:00.000000+00:00",
            duration:0,
            data:{
                "not_shutdown":"T"
            }
        },
        {
            id:3,
            timestamp:"2022-12-20T10:06:00.000000+00:00",
            duration:0,
            data:{
                "not_shutdown":"T"
            }
        },
        {
            id:5,
            timestamp:"2022-12-20T10:11:00.000000+00:00",
            duration:0,
            data:{
                "not_shutdown":"T"
            }
        },
        {
            id:7,
            timestamp:"2022-12-20T10:16:00.000000+00:00",
            duration:0,
            data:{
                "not_shutdown":"T"
            }
        }                    
    ]

    for(var i=0; i<msgarr.length; i++){
        msgarr[i]=JSON.stringify(msgarr[i]);
    }
    msgarr[0]=msgarr[0].replace(/\\/g,"\\\\");//BUGFIX	
    msgarr[0]=msgarr[0].replace(/\"/g,"\\\"");//BUGFIX
    msgarr[0]=msgarr[0].replace(/\'/g,"\\\'");//BUGFIX	
    return msgarr;

  }


  readFile(filename){
    var fs = require('fs');
    return new Promise(resolve=>{
      fs.readFile(filename, 'utf8', function (err,data) {
        if (err) return console.log(err);
        //console.log('FILE SAVED');
        resolve(data)
      });
    })
  }


}//end of class 



module.exports = AwProducerTest;