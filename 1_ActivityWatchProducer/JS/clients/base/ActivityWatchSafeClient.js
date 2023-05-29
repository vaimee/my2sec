//Getters unaltered, setters permitted only for producer bucket
class ActivityWatchSafeClient extends ActivityWatchClient{
    constructor(jsap){
        super(jsap)
        this.producerId="aw-producer"
    }

    //TODO: test if create_bucket works, you should delete your current bucket
    /**
     * @override ActivityWatchClient.create_bucket
     */
    async create_bucket(){
        return await super.create_bucket(this.producerId,
        "{ \"client\": \"aw-producer\", \"type\": \"sepaconnector\", \"hostname\": \"unknown\"}")
    }

    /**
     * @override ActivityWatchClient.create_event
     */
    async create_event(json){
        //this.log.trace("create_event safe")
        return await super.create_event(this.producerId,json)
    }
    /**
     * @override ActivityWatchClient.delete_event
     */
    async delete_event(event_id){
        //this.log.trace("delete_event safe")
        return await super.delete_event(this.producerId,event_id)
    }

}   