const Consumer=require("../Consumer")

class UserProfessionInfoConsumer extends Consumer{
    constructor(jsap,userEmail){
        var queryName="USER_PROFESSION_INFO"
        var bindings={
            usergraph:"http://www.vaimee.it/my2sec/"+userEmail
        }
        super(jsap,queryName,bindings)
        this.user_graph="http://www.vaimee.it/my2sec/"+userEmail
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
    async overrideQuerySepa(){
        var override=this.getOverrideHostConfiguration()
        var res;
        var queryname=this.queryname;
        var bindings=this.sub_bindings;
        if(override==null || override==undefined){
          res=await this.query(queryname,bindings);
        }else{
          this.log.debug("Executing override query")
          var query=this.bench.sparql(this.queryText,bindings)
          query=query.replace(/(?<= *)(\?usergraph)(?= *)/g,"<"+this.user_graph+">")
          //this.log.info("QUERY SEPA:"+query)
          res=await this.basicSepaClient.query(query,override);
          //res=await this.query(queryname,bindings,override);
        }
    
        return this.extractResultsBindings(res);
      }
}

module.exports= UserProfessionInfoConsumer