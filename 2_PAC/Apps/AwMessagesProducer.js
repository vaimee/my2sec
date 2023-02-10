var Producer=require('../gregnet_modules/PacFactory/Pattern/Producer'); //Pac Factory
var GregLogs = require("../gregnet_modules/GregLogs.js")
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class AwMessagesProducer{
  constructor(jsap_file,user){
    //TITLE
    console.log("####################################");
    console.log("# App: ActivityType Aggregator v0.1");
    console.log("####################################");
    this.log = new GregLogs();
    this.log.loglevel=0;
    this.usergraph=user;
    this.eventsProducer=new Producer(jsap_file,"SEND_MESSAGE");
    this.flagProducer= new Producer(jsap_file,"SET_SYNCHRONIZATION_FLAG");
    this.eventsProducer.log.loglevel=this.log.loglevel;
  }


  async send_message(){
    this.log.info("Getting events...");
    var msgArr=await this.getAwEventsMessages()
    //console.log(msgArr)
    //throw new Error("MAO")
    this.log.info("Sending events...");
    for(var i in msgArr){
      await this.eventsProducer.updateSepa(msgArr[i]);
    }
    this.log.info("Operation finished");
  }

  /*
  {\"id\":88816,
   \"timestamp\":\"2023-01-23T17:12:15.521000+00:00\",
   \"duration\":1.417,
   \"data\":{
      \"app\":\"Safari\",
      \"title\":\"Task: http://www.vaimee... (#152) | My2sec | OpenProject\",
      \"url\":\"None\"
    }
  }
  */
  async set_flag(){
    this.flagProducer.updateSepa({
      flag_type:"http://www.vaimee.it/my2sec/awproducerflag",
      usergraph:this.usergraph
    })
  }

  
  async getAwEventsMessages(){
    var messages=await this.getAwEventsJson();
    var dataArr=[];
    dataArr[0]={
      message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
      usergraph:this.usergraph,
      source:"http://www.vaimee.it/sources/aw-watcher-working",
      msgtimestamp:new Date().toISOString(),
      msgvalue:messages[0]
    }
    dataArr[1]={
      message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
      usergraph:this.usergraph,
      source:"http://www.vaimee.it/sources/aw-watcher-afk",
      msgtimestamp:new Date().toISOString(),
      msgvalue:messages[1]
    }
    dataArr[2]={
      message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
      usergraph:this.usergraph,
      source:"http://www.vaimee.it/sources/aw-watcher-start-stop",
      msgtimestamp:new Date().toISOString(),
      msgvalue:messages[2]
    }
    dataArr[3]={
      message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
      usergraph:this.usergraph,
      source:"http://www.vaimee.it/sources/aw-watcher-notshutdown",
      msgtimestamp:new Date().toISOString(),
      msgvalue:messages[3]
    }
    console.log(dataArr)
    return dataArr
  }

  async getAwEventsJson(){
    var messages=[];
    messages[0]=await this.readFile("./Apps/testClient/gregbug_27012023/working.txt")
    messages[0]=messages[0].replace(/\'/g,"\\\'");
    messages[1]=await this.readFile("./Apps/testClient/gregbug_27012023/afk.txt")
    console.log(messages[1])
    messages[2]=await this.readFile("./Apps/testClient/gregbug_27012023/startstop.txt")
    messages[3]=await this.readFile("./Apps/testClient/gregbug_27012023/notshutdown.txt")

    return messages;
  }



  getAwEventsMessage_OLD(){
    var message=JSON.stringify(this.getAwEventsJson());
    var data={
      message_graph:"http://www.vaimee.it/my2sec/messages/activitywatch",
      usergraph:this.usergraph,
      source:"http://www.vaimee.it/sources/aw-watcher-working",
      msgtimestamp:new Date().toISOString(),
      msgvalue:message
    }
    return data
  }

  getAwEventsJson_OLD(){
    return [
      {
        id:1,
        timestamp:"2023-01-23T17:11:43.530000+00:00",
        duration:0.09,
        data:{
          app:"Safari",
          title:"‎dld.arces.unibo.it:8078/projects/your-scrum-project/work_packages",
          url:"None"
        }
      },
      {
        id:2,
        timestamp:"2023-01-23T17:11:40.036000+00:00",
        duration:3.494,
        data:{
          app:"Safari",
          title:"Panoramica",
          url:"None"
        }
      },
      {
        id:3,
        timestamp:"2023-01-23T17:11:39.906000+00:00",
        duration:0.165,
        data:{
          app:"Safari",
          title:"‎dld.arces.unibo.it:8078/projects/2?jump=",
          url:"None"
        }
      },
      {
        id:4,
        timestamp:"2023-01-23T17:11:31.423000+00:00",
        duration:8.483,
        data:{
          app:"Safari",
          title:"OpenProject",
          url:"None"
        }
      },
      {
        id:5,
        timestamp:"2023-01-23T17:11:31.423000+00:00",
        duration:0,
        data:{
          app:"Safari",
          title:"OpenProject",
          url:"None"
        }
      },
      {
        id:6,
        timestamp:"2023-01-23T17:11:31.382000+00:00",
        duration:0,
        data:{
          app:"Safari",
          title:"OpenProject",
          url:"None"
        }
      },
      {
        id:7,
        timestamp:"2023-01-23T17:11:31.272000+00:00",
        duration:0.11,
        data:{
          app:"Safari",
          title:"‎dld.arces.unibo.it:8078/?first_time_user=true",
          url:"None"
        }
      },
      {
        id:8,
        timestamp:"2023-01-23T17:10:16.571000+00:00",
        duration:74.08,
        data:{
          app:"Safari",
          title:"Panoramica",
          url:"None"
        }
      }
    ]
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



module.exports= AwMessagesProducer;




/*
//TRIPLA 1
?b_7 rdf:type my2sec:TrainingEvent ;
my2sec:hasMember <http://www.vaimee.it/my2sec/defuser@vaimee.it>;
rdf:type my2sec:windowEvent; my2sec:nameApp 'Safari';
my2sec:titleFile '‎dld.arces.unibo.it:8078/projects/your-scrum-project/work_packages';
time:inXSDDateTimeStamp '2023-01-23T17:11:43.530000+00:00';
my2sec:hasActivityType my2sec:none;
my2sec:taskTitle 'none';
my2sec:hasTimeInterval ?timenode_7 .
?timenode_7 rdf:type time:Duration;
time:unitType time:unitSecond ;
time:numericDuration 0.09 .

//TRIPLA 2
?b_8 rdf:type my2sec:TrainingEvent ;
my2sec:hasMember <http://www.vaimee.it/my2sec/defuser@vaimee.it>; 
rdf:type my2sec:windowEvent; 
my2sec:nameApp 'Safari'; 
my2sec:titleFile 'Panoramica'; 
time:inXSDDateTimeStamp '2023-01-23T17:11:40.036000+00:00'; 
my2sec:hasActivityType my2sec:none; 
my2sec:taskTitle 'none'; 
my2sec:hasTimeInterval ?timenode_8 . 
?timenode_8 rdf:type time:Duration; 
time:unitType time:unitSecond ; 
time:numericDuration 3.494 . 

//TRIPLA 3 -> BUG
?b_9 rdf:type my2sec:TrainingEvent ; 
my2sec:hasMember <http://www.vaimee.it/my2sec/defuser@vaimee.it>; 
rdf:type my2sec:windowEvent; 
my2sec:nameApp 'Safari'; 
my2sec:titleFile '‎dld.arces.unibo.it:8078/projects/2?jump=';
_9 time:inXSDDateTimeStamp '2023-01-23T17:11:39.906000+00:00'; 
my2sec:hasActivityType my2sec:none; 
my2sec:taskTitle 'none'; 
my2sec:hasTimeInterval ?timenode_9 . 
?timenode_9 rdf:type time:Duration; 
time:unitType time:unitSecond ; 
time:numericDuration 0.165 . 

//TRIPLA 4
?b_10 rdf:type my2sec:TrainingEvent ; 
my2sec:hasMember <http://www.vaimee.it/my2sec/defuser@vaimee.it>; 
rdf:type my2sec:windowEvent; 
my2sec:nameApp 'Safari'; 
my2sec:titleFile 'OpenProject'; 
time:inXSDDateTimeStamp '2023-01-23T17:11:31.423000+00:00'; 
my2sec:hasActivityType my2sec:none; 
my2sec:taskTitle 'none'; 
my2sec:hasTimeInterval ?timenode_10 . 
?timenode_10 rdf:type time:Duration; 
time:unitType time:unitSecond ; 
time:numericDuration 8.483 .

//TRIPLA 5
?b_11 rdf:type my2sec:TrainingEvent ; 
my2sec:hasMember <http://www.vaimee.it/my2sec/defuser@vaimee.it>; 
rdf:type my2sec:windowEvent; 
my2sec:nameApp 'Safari'; 
my2sec:titleFile 'OpenProject'; 
time:inXSDDateTimeStamp '2023-01-23T17:11:31.423000+00:00'; 
my2sec:hasActivityType my2sec:none; 
my2sec:taskTitle 'none'; 
my2sec:hasTimeInterval ?timenode_11 . 
?timenode_11 rdf:type time:Duration; 
time:unitType time:unitSecond ; 
time:numericDuration 0 . 

//TRIPLA 6
?b_12 rdf:type my2sec:TrainingEvent ;
my2sec:hasMember <http://www.vaimee.it/my2sec/defuser@vaimee.it>; 
rdf:type my2sec:windowEvent; 
my2sec:nameApp 'Safari'; 
my2sec:titleFile 'OpenProject'; 
time:inXSDDateTimeStamp '2023-01-23T17:11:31.382000+00:00';
my2sec:hasActivityType my2sec:none; 
my2sec:taskTitle 'none'; 
my2sec:hasTimeInterval ?timenode_12 . 
?timenode_12 rdf:type time:Duration; 
time:unitType time:unitSecond ; 
time:numericDuration 0 . 

//TRIPLA 7 -> BUG
?b_13 rdf:type my2sec:TrainingEvent ;
my2sec:hasMember <http://www.vaimee.it/my2sec/defuser@vaimee.it>;
rdf:type my2sec:windowEvent; 
my2sec:nameApp 'Safari';
my2sec:titleFile '‎dld.arces.unibo.it:8078/?first_time_user=true';
_13 time:inXSDDateTimeStamp '2023-01-23T17:11:31.272000+00:00'; 
my2sec:hasActivityType my2sec:none; 
my2sec:taskTitle 'none'; 
my2sec:hasTimeInterval ?timenode_13 . 
?timenode_13 rdf:type time:Duration; 
time:unitType time:unitSecond ; 
time:numericDuration 0.11 . 

//TRIPLA 8
?b_14 rdf:type my2sec:TrainingEvent ;
my2sec:hasMember <http://www.vaimee.it/my2sec/defuser@vaimee.it>;
rdf:type my2sec:windowEvent; 
my2sec:nameApp 'Safari'; 
my2sec:titleFile 'Panoramica'; 
time:inXSDDateTimeStamp '2023-01-23T17:10:16.571000+00:00'; 
my2sec:hasActivityType my2sec:none; 
my2sec:taskTitle 'none'; 
my2sec:hasTimeInterval ?timenode_14 . 
?timenode_14 rdf:type time:Duration; 
time:unitType time:unitSecond ; 
time:numericDuration 74.08 .


*/