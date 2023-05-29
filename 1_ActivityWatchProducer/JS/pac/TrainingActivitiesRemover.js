class TrainingActivitiesRemover extends Producer{
    constructor(jsap){
        super(jsap,"REMOVE_TRAINING_ACTIVITY")
        
    }

    async remove_training_activities_from_sepa(toRemove){
        if(toRemove==null||toRemove==undefined){throw new Error("Bindings cannot be null")}
        for(var i in toRemove){
            var binding={
                activity: toRemove[i].nodeid
            }
            this.log.debug(binding)
            //SEND MESSAGE
            await this.updateSepa(binding);
            //console.log("Remove training activity response: "+JSON.stringify(syncresponse))	
        }
        return true
    }
}