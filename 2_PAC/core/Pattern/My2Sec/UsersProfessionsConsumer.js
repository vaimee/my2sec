var CachedConsumer=require('../CachedConsumer'); //Pac Factory
class UsersProfessionsConsumer extends CachedConsumer{
    constructor(jsap,profession_uri){
        super(jsap,"OVERRIDE_ALL_USERS_PROFESSIONS",{})
    }

    async start(){
        this.subscribeToSepa()
    }

    async test(){
        //var res=await this.querySepa();
        //this.log.debug(res)
        this.subscribeToSepa()
    }

    get_graphs_by_usergraph(usergraph){
        var binding=this.get_cache().get(usergraph)
        return {
            "events_graph":binding.get("events_graph"),
            "activities_graph":binding.get("activities_graph"),
            "profession_type":binding.get("profession_type"),
            "awmapperFlag":binding.get("awmapperFlag"),
            "trainingActivitiesFlag":binding.get("trainingActivitiesFlag"),
            "validatedActivitiesFlag":binding.get("validatedActivitiesFlag")
        }
    }

    add_binding_to_cache(binding){
        //console.log(binding)
        if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(!this.get_cache().has(binding.usergraph)){
            const bindingMap=new Map();
            bindingMap.set("events_graph",binding.events_graph);
            bindingMap.set("activities_graph",binding.activities_graph)
            bindingMap.set("profession_type",binding.profession_type)
            bindingMap.set("awmapperFlag",binding.awmapperFlag)
            bindingMap.set("trainingActivitiesFlag",binding.trainingActivitiesFlag)
            bindingMap.set("validatedActivitiesFlag",binding.validatedActivitiesFlag)
            this.get_cache().set(binding.usergraph,bindingMap)
        }else{
            this.log.debug("Skipping binding, key already exists");
            return;
        }
        this.log.trace(this.get_cache())
    }
    remove_binding_from_cache(binding){
        if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(this.get_cache().has(binding.usergraph)){
            this.get_cache().delete(binding.usergraph)
        }else{
            this.log.debug("Skipping binding, key does not exist");
            return;
        }
        this.log.trace(this.get_cache())
    }

}

module.exports = UsersProfessionsConsumer;