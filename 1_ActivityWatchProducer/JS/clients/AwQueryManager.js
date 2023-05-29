class AwQueryManager{
    constructor(jsap){
        this.log=new GregLogs()
        this.client= new ActivityWatchSafeClient(jsap);
        this.producerBucketClient= new ProducerBucketClient(jsap)
        this.whitelist=[
            "aw-watcher-afk",
            "aw-watcher-notshutdown",
            "aw-watcher-start-stop",
            "aw-watcher-working"
        ]
    }

    //Tests
    async test_datasource(){
        try{
            await this.client.get_all_buckets()
            return true
        }catch(e){
            this.log.error(e)
            return false
        }
    }
    async test_general(){
        var testRes=await this.test_datasource()
        if(!testRes){throw new Error("Datasource test Failed!")}

        var testProducer=await this.producer_bucket_exists();
        if(!testProducer){throw new Error("Producer bucket not found")}
        //res=await this.client.get_all_buckets()
        //console.log(res)
        var bucketsObj=await this.get_useful_buckets()
        this.log.debug(bucketsObj)

        var stop_time="2023-05-22T12:00:00Z"
        var start_time="2023-05-01T12:00:00Z"
        var eventsObj= await this.get_useful_events(bucketsObj,start_time,stop_time)
        this.log.debug(eventsObj)
        
    }

    //------------------MAIN QUERY--------------------
    async get_aw_messages(){
        //Get buckets and time interval
        var bucketsJson= await this.get_useful_buckets();
        var startTime=await this.producerBucketClient.get_last_update();
        var stopTime=await this.producerBucketClient.get_last_stop();
        this.log.debug("Start Time: "+startTime)
        this.log.debug("Stop Time: "+stopTime)

        //TODO: CONTROLLA SE FUNZIONA SENZA IL PRIMO START TIME
        var events={};
        if(startTime!=null){
            //TODO: TEST BUGFIX
            //!BUGFIX: TAKE NOW IF STOPTIME IS NULL 
            if(stopTime==null){
                stopTime=new Date().toISOString();
            }
            //Adjust interval
            startTime=new Date(startTime);
            startTime.setSeconds(startTime.getSeconds()-10)
            startTime=startTime.toISOString();
            stopTime=new Date(stopTime);
            stopTime.setSeconds(stopTime.getSeconds()+10)
            stopTime=stopTime.toISOString();
            //Get timeinterval events
            events= await this.get_useful_events(bucketsJson,startTime,stopTime);
        }else{
            //Get all events
            events= await this.get_all_useful_events(bucketsJson);
        }

        //Preprocess events before sending to SEPA
        var rawEvents={}
        for(var key in events){
            rawEvents[key]=JSON.stringify(events[key])
            rawEvents[key]=rawEvents[key].replace(/\\/g,"\\\\");//BUGFIX
			rawEvents[key]=rawEvents[key].replace(/\"/g,"\\\"");//BUGFIX
			rawEvents[key]=rawEvents[key].replace(/\'/g,"\\\'");//BUGFIX	            
			this.log.trace(rawEvents)
		}

        return rawEvents
    }



    async producer_bucket_exists(){
        try{
            await this.client.get_bucket("aw-producer")
            return true
        }catch(e){
            if(e.response.status==404){
                return false
            }else{
                throw new Error(e)
            }
        }
    }

    //TODO: POSTPROCESSING FOR SEPA (DOPPIA SBARRA)
    async get_useful_events(bucketsObj,start_time,stop_time){
        var whitelist=this.whitelist;
        var res={}
        for(var i in whitelist){
            var watcher_id=this.client.get_bucket_id(bucketsObj[whitelist[i]])
            var data=await this.client.get_timeinterval_events_by_watcher_id(watcher_id,start_time,stop_time)
            res[whitelist[i]]=data
        }
        //START STOP BUCKET CANNOT BE EMPTY
        if(res["aw-watcher-working"].length==0){throw new Error("Working events bucket cannot be empty")}
        if(res["aw-watcher-start-stop"].length==0){throw new Error("Start stop bucket cannot be empty")}
        return res
    }

    async get_all_useful_events(bucketsObj){
        var whitelist=this.whitelist;
        var res={}
        for(var i in whitelist){
            var watcher_id=this.client.get_bucket_id(bucketsObj[whitelist[i]])
            var data=await this.client.get_all_events_by_watcher_id(watcher_id)
            res[whitelist[i]]=data
        }
        //START STOP BUCKET CANNOT BE EMPTY
        if(res["aw-watcher-start-stop"].length==0){throw new Error("Start stop bucket cannot be empty")}
        return res
    }

    //TODO: CREATE PRODUCER BUCKET
    async get_useful_buckets(){
        var whitelist=this.whitelist;
        var buckets=await this.client.get_all_buckets()
        var res={}
        for(var i in buckets){
            var identifier= this.client.get_bucket_id(buckets[i])
            for(var j in whitelist){
                if(identifier.includes(whitelist[j])){
                    res[whitelist[j]]=buckets[i]
                    break;
                }
            }
        }
        if(res.length<whitelist.length){throw new Error("Missing bucket from useful buckets")}
        return res;
    }

}