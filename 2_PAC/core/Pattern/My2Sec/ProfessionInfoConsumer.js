var CachedConsumer=require('../CachedConsumer'); //Pac Factory
class ProfessionInfoConsumer extends CachedConsumer{
    constructor(jsap,profession_uri){
        super(jsap,"OVERRIDE_PROFESSION_INFO",{
            uuid:profession_uri
        })
    }

    async start(){
        this.subscribeToSepa()
    }

    async test(){
        //var res=await this.querySepa();
        var res=await this.querySepa();
        this.log.debug(res)
    }

    async get_formatted_profession_info(){
        var res= await this.querySepa();
        var row=res[0]
        return {
            profession_type: row.profession_type,
            activities_graph: row.activities_graph,
            events_graph: row.events_graph,
        }
    }





    add_binding_to_cache(binding){
        throw new Error("Add binding not implemented on professionInfoConsumer")
        if(!binding.hasOwnProperty("usergraph")){this.log.debug("Skipping binding, no usergraph key detected");return;}
        if(!this.get_cache().has(binding.usergraph)){
            const bindingMap=new Map();
            bindingMap.set("events_graph",binding.events_graph);
            bindingMap.set("activities_graph",binding.activities_graph)
            bindingMap.set("profession_type",binding.profession_type)
            this.get_cache().set(binding.usergraph,bindingMap)
        }else{
            this.log.debug("Skipping binding, key already exists");
            return;
        }
        this.log.trace(this.get_cache())
    }
    remove_binding_from_cache(binding){
        throw new Error("Remove binding not implemented on professionInfoConsumer")
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

module.exports = ProfessionInfoConsumer;