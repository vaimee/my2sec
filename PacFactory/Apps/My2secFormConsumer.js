var PacFactory=require('../gregnet_modules/PacFactory/PacFactory.js'); //Pac Factory
/*###########################################
|| NAME: AW MAPPER NODE.js APP
|| AUTHOR: Gregorio Monari
|| DATE: 4/11/2022
|| NOTES: Maps Aw messages into Events
############################################*/
class My2secFormConsumer extends PacFactory{
  constructor(jsap_file){
    //TITLE
    console.log("║║ ####################################");
    console.log("║║ # App: My2secFormConsumer v0.1");
    console.log("║║ ####################################");

    super({
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
    });
  }

  //============ CALL TO START LISTENING TO MESSAGES ===============
  async start(){

    var msg=await this.getMessages()
    //console.log(msg.length)
    console.log("Reding "+msg.length+" messages...")

    


  }







  async getMessages(){
    var res=await this.rawQuery(`
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX schema: <http://schema.org/>
    SELECT * WHERE {
        ?bnode rdf:type schema:Message;
               schema:dateSent ?timestamp;
               schema:text ?msg;
    }
    `);
    res=this.extractResultsBindings(res)
    return res;
  }


}//end of class 



module.exports= My2secFormConsumer;