class TrainingActivitiesRemover extends Producer{
    constructor(jsap,_activities_graph){
        super(jsap,"REMOVE_TRAINING_ACTIVITY")
        this._activities_graph=_activities_graph
    }

    async remove_training_activities_from_sepa(toRemove){
        if(toRemove==null||toRemove==undefined){throw new Error("Bindings cannot be null")}
        for(var i in toRemove){
            var binding={
                activities_graph:this._activities_graph,
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