class ProducerBucketClient extends ActivityWatchSafeClient{
    constructor(jsap){
        super(jsap)
    }

    //Producer Events Getters
    async get_last_start(){
        var res=await this.get_producer_event_value_by_data_key("last_start")
        return res
    }
    async get_last_update(){
        var res=await this.get_producer_event_value_by_data_key("last_update")
        return res
    }
    async get_last_stop(){
        var res=await this.get_producer_event_value_by_data_key("last_stop")
        return res
    }
    async get_scanned_time(){
        var res=await this.get_producer_event_value_by_data_key("scanned_time")
        return res 
    }

    //Producer events setters
    async set_last_start(value){
        var res=await this.set_producer_event("last_start",value)
        return res
    }
    async set_last_update(value){
        var res=await this.set_producer_event("last_update",value)
        return res
    }
    async set_last_stop(value){
        var res=await this.set_producer_event("last_stop",value)
        return res
    }
    async set_scanned_time(value){
        var res=await this.set_producer_event("scanned_time",value)
        return res 
    }


    //------------------------------------GETTERS-----------------------------------
    async get_all_producer_events(){
        var eventsArr=await this.get_all_events_by_watcher_id(this.producerId)
        return eventsArr
    }
    async get_producer_event_value_by_data_key(key){
        var eventsArr=await this.get_all_events_by_watcher_id(this.producerId)
        const re= new RegExp(key);
        for(var i in eventsArr){
            var data=eventsArr[i].data
            var keys=Object.keys(data).join(" ").trim();
            //console.log(keys)
            var res= re.test(keys)
            //console.log(res)
            if(res){
                //console.log(data[key])
                return data[key]
            }
        }
        return null
    }
    async get_producer_event_json_by_data_key(key){
        var eventsArr=await this.get_all_events_by_watcher_id(this.producerId)
        const re= new RegExp(key);
        for(var i in eventsArr){
            var data=eventsArr[i].data
            var keys=Object.keys(data).join(" ").trim();
            //console.log(keys)
            var res= re.test(keys)
            //console.log(res)
            if(res){
                //console.log(data[key])
                return eventsArr[i]
            }
        }
        this.log.trace("No event found, returning null")
        return null
    }


    //------------------------------------SETTERS-----------------------------------

    async set_producer_event(key,value){
        if(value==null||value==undefined){throw new Error("Producer Event cannot have undefined values")}
        await this.delete_producer_event(key)
        await this.create_producer_event(key,value)
        this.log.debug("Updated event: "+key+", value: "+value)
    }
    async create_producer_event(key,value){
        var timestamp=this.get_current_timestamp()
        var json={
            "timestamp":timestamp,
            "duration":0,
            "data":{}
        }
        json.data[key]=value;
        var res=await this.create_event(json)
        this.log.trace("Created event: "+key+", value: "+value)
        this.log.trace(json)
        return res
    }

    async delete_producer_event(key){
        var eventJson=await this.get_producer_event_json_by_data_key(key)
        if(eventJson!=null){
            var res=await this.delete_event(eventJson["id"])
            this.log.trace("Deleted event: "+key+", id: "+eventJson["id"])
            return true
        }
        this.log.trace("No event matching '"+key+"' to delete, skipping")
        return false
    }

    async create_producer_bucket(){
        this.create_bucket()
    }

    //Utility
    get_current_timestamp(){
        const date=new Date();
        var string_timestamp=date.toISOString()
        return string_timestamp
    }//get_current_timestamp()
}