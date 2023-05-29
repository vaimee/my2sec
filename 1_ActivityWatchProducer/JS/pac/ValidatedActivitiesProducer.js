class ValidatedActivitiesProducer extends Producer{
    constructor(jsap,userEmail){
        super(jsap,"ADD_VALIDATED_ACTIVITY")
        this.userEmail=userEmail;
        if(this.userEmail==null||this.userEmail==undefined){throw new Error("UserEmail cannot be null")}
    }

    async send_validated_activities_to_sepa(bindings){
        if(bindings==null||bindings==undefined){throw new Error("Bindings cannot be null")}
        for(var i in bindings){

            var formattedBinding=this.formatBinding(bindings[i])
            this.log.debug(formattedBinding)

            var syncresponse=await this.updateSepa(formattedBinding)
            //console.log("Add validated activity response: "+JSON.stringify(syncresponse))
        }	
        return true
    }

    formatBinding(binding){
        var title=binding["title"].replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBbindingsE
        title=title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
        var usergraph="http://www.vaimee.it/my2sec/"+this.userEmail;
        var res={
            usergraph:usergraph,
            title:title,
            event_type:binding.event_type,
            datetimestamp:binding.datetimestamp,
            app:binding.app,
            activity_type:binding.activity_type,
            task:binding.task,
            duration:binding.duration
        }
        return res
        //this.log.debug(res)
    }

}