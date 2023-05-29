/**
 * Creates a **base client** to interact with **ActivityWatch API**.
 * It is **not protected**, meaning you can alter anything inside the database.
 * For this reason, it is suggested to use **ActivityWatchSafeClient** instead, which extends this class.
 * Visit the official ActivityWatch website for more information about the REST Api: https://docs.activitywatch.net/en/latest/api/rest.html
 */
class ActivityWatchClient{
	constructor(jsap){
		this.log=new GregLogs();
		this.aw_host=this.get_host_from_jsap(jsap)
        this.config={
            headers:{
                'Content-Type': 'application/json'
            }
        }
	}

    //-------INIT--------------------------------------
    //Configuration
    get_host_from_jsap(jsap){
        if(jsap==null || jsap==undefined){throw new Error("Jsap can't be null")}
        if(!jsap.hasOwnProperty("extended")){throw new Error("Invalid jsap: missing 'extended' field")}
        return jsap.extended.AwProducer.endpoints.AwApiRouter
    }



    //-------METHODS--------------------------------------
    /**
     * Queries AW db to get all the avaiable buckets.
     * @returns 
     */
    async get_all_buckets(){
        var path="/api/0/buckets/";
		var res = await axios.get(this.aw_host+path,this.config)
		//RETURN THE WATCHERS
        return res.data
    }

    async get_buckets_array(idArr){
        var out=[]
        for(var i in idArr){
            const bucket=await this.client.get_bucket(idArr[i])
            out.push(bucket)
        }
        return out
    }

    async get_bucket(watcher_id){
        if(watcher_id==null || watcher_id==undefined){throw new Error("Watcher_id cannot be null or undefined")}
        var path="/api/0/buckets/"+watcher_id;
		var res = await axios.get(this.aw_host+path,this.config)
		//RETURN THE WATCHERS
        return res.data
    }

    get_bucket_id(bucket){
        if(bucket==null || bucket==undefined){throw new Error("Bucket json cannot be null or undefined")}
        return bucket.id
    }

    /**
     * # WARNING: UNSAFE
     * @param {*} watcher_id 
     * @param {*} json 
     * @returns 
     */
    async create_bucket(watcher_id,json){
        if(watcher_id==null || watcher_id==undefined){throw new Error("Watcher_id cannot be null or undefined")}
        if(json==null || json==undefined){throw new Error("Json data cannot be null or undefined")}
        if(Object.keys(json).length==0){throw new Error("Json data cannot be empty")}
        var keys=Object.keys(json).join(" ")
        if(!keys.includes("client")){throw new Error("Event json missing 'client' field")}
        if(!keys.includes("type")){throw new Error("Event json missing 'type' field")}
        if(!keys.includes("hostname")){throw new Error("Event json missing 'hostname' field")}
        var path="/api/0/buckets/"+watcher_id;
        var res=axios.post(this.aw_host+path,json,this.config);
        return res.data
    }

    /**
     * # WARNING: UNSAFE
     * @param {*} watcher_id 
     */
    async delete_bucket(watcher_id){
        throw new Error("Why would you delete a bucket? You MAD for that bro")
    }

    //Manage events
    
    async get_all_events_by_watcher_id(watcher_id){
        if(watcher_id==null || watcher_id==undefined){throw new Error("Watcher_id cannot be null or undefined")}
        var path="/api/0/buckets/"+watcher_id+"/events";
		var res = await axios.get(this.aw_host+path,this.config)
        return res.data
    }
    /**
     * 
     * @param {*} watcher_id 
     * @param {*} start_time 
     * @param {*} end_time 
     * @returns jsonArray 
     */
    async get_timeinterval_events_by_watcher_id(watcher_id,start_time,end_time){
        if(watcher_id==null || watcher_id==undefined){throw new Error("Watcher_id cannot be null or undefined")}
        if(start_time==null || start_time==undefined || end_time==null || end_time==undefined){throw new Error("Start_time and end_time cannot be null or undefined")}
        var path="/api/0/buckets/"+watcher_id+"/events?end="+end_time+"&start="+start_time;
		path=path.replace(/:/g,"%3A"); //REPLACE : WITH %3A FOR A WELL FORMATTED REQUEST
		var res = await axios.get(this.aw_host+path,this.config)
        return res.data
    }
    /**
     * 
     * @param {*} watcher_id 
     * @param {*} json 
     * @returns axios_response.data
     */
    async create_event(watcher_id,json){
        if(watcher_id==null || watcher_id==undefined){throw new Error("Watcher_id cannot be null or undefined")}
        if(json==null || json==undefined){throw new Error("Json data cannot be null or undefined")}
        if(Object.keys(json).length==0){throw new Error("Json data cannot be empty")}
        var keys=Object.keys(json).join(" ")
        if(!keys.includes("data")){throw new Error("Event json missing 'data' field")}
        var path="/api/0/buckets/"+watcher_id+"/events";
        var res=axios.post(this.aw_host+path,json,this.config);
        return res.data
    }

    /**
     * # WARNING: UNSAFE
     * @param {*} watcher_id 
     * @param {*} event_id 
     * @returns jsonObj axios_response.data
     */
    async delete_event(watcher_id,event_id){
        if(watcher_id==null || watcher_id==undefined){throw new Error("Watcher_id cannot be null or undefined")}
        if(event_id==null || event_id==undefined){throw new Error("Event_id cannot be null or undefined")}
        var path="/api/0/buckets/"+watcher_id+"/events/"+event_id;
        var res=axios.delete(this.aw_host+path,{},this.config);
        return res.data
    }


    

}