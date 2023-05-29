class ActivityTypesConsumer extends Consumer{
    constructor(jsap,userEmail){
        var queryName="USER_ACTIVITY_TYPES"
        var bindings={
            assignee:"http://www.vaimee.it/my2sec/"+userEmail
        }
        super(jsap,queryName,bindings)
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
    async querySepa(){
        return await super.querySepa(this.getOverrideHostConfiguration())
    }


}