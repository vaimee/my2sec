class WorkerTypeProducer extends Producer{
    constructor(jsap){
        super(jsap,"ADD_PROFESSION_LINK_TO_USER")
        //if(this.userEmail==null||this.userEmail==undefined){throw new Error("UserEmail cannot be null")}
    }

    getOverrideHostConfiguration(){
        var override_host={
            "host":"dld.arces.unibo.it",
            "sparql11protocol": {
                "protocol": "http",
                "port": 8550,
                "query": {
                    "path": "/query",
                    "method": "POST",
                    "format": "JSON"
                },
                "update": {
                    "path": "/update",
                    "method": "POST",
                    "format": "JSON"
                }
            },
            "sparql11seprotocol": {
                "protocol": "ws",
                "availableProtocols": {
                    "ws": {
                        "port": 9550,
                        "path": "/subscribe"
                    },
                    "wss": {
                        "port": 9443,
                        "path": "/secure/subscribe"
                    }
                }
            }                
        }
        return override_host
    }


    //@OVERRIDE
    async updateSepa(bindings){
        this.log.debug("Executing override update")
        try{
            var failed=false;
            var forcedBindings=this.privateJsap.updates[this.updatename].forcedBindings;   
            
            if(Object.keys(forcedBindings).length==Object.keys(bindings).length){
              Object.keys(forcedBindings).forEach(fk=>{
                if(!bindings.hasOwnProperty(fk)){
                  failed=true;
                }
              })
            }else{
              failed=true;
            }
        }catch(e){console.log(e)}
      
        if(failed){
            this.log.error("Bindings mismatch in update: "+this.updatename+", showing logs:")
            console.log("bindings: "+Object.keys(bindings).join(" - "))
            console.log("forcedBindings: "+Object.keys(forcedBindings).join(" - "))
            throw new Error(`Bindings mismatch`)
        }else{
        this.log.trace("bindings ok")
        }

        this.log.debug("Executing override query")
        var query=this.bench.sparql(
            this.privateJsap.updates[this.updatename].sparql,
            bindings)
        query=query.replace(/(?<= *)(\?usergraph)(?= *)/g,"<"+bindings.usergraph+">")
        query=query.replace(/(?<= *)(\?profession_uuid)(?= *)/g,"<"+bindings.profession_uuid+">")
        var override=this.getOverrideHostConfiguration()
        console.log(query)
        var res=await this.basicSepaClient.update(query,override);
    }


}