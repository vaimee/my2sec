const JsapApi = require('@arces-wot/sepa-js').Jsap//jsap api
const SEPA =  require('@arces-wot/sepa-js').SEPA//querybench


init()

async function init(){
    let qbClient=new SEPA({
        "host": "api.sepa.vaimee.com",
        "oauth": {
            "enable": false,
            "register": "https://localhost:8443/oauth/register",
            "tokenRequest": "https://localhost:8443/oauth/token"
        },
        "sparql11protocol": {
            "protocol": "https",
            "port": 443,
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
                    "port": 9667,
                    "path": "/subscribe"
                },
                "wss": {
                    "port": 9443,
                    "path": "/secure/subscribe"
                }
            }
        }
    });//querybench client, for static queries
    
    var res=await qbClient.query(`
    SELECT * WHERE{?s ?p ?o}
    `)

    console.log(JSON.stringify(res))

}


