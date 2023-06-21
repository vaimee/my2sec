class UserInfoConsumer {
    constructor(jsap,usermail){
        var log=new GregLogs();
        this.sepaConsumer= new Sepajs.SEPA(jsap)
        this.userName="";
        this.usermail=usermail;
        //log.info("New UserInfoConsumer created!")
    }

    get_userEmail(){
        return this.usermail
    }

    logspan_usermail(element){
        document.getElementById(element).innerHTML=this.usermail;
    }

    logspan_username(element){
        if(this.usermail=="gregorio.monari@vaimee.it"){
            document.getElementById(element).innerHTML="MASTER"
        }else{
            document.getElementById(element).innerHTML=this.userName.toUpperCase();
        }
    }

    logspan_subEventsCount(element){
        log.debug("SUBSCRIBING TO EVENTS COUNT")
        var counter_el=document.getElementById(element);
        const sub = this.sepaConsumer.subscribe("select (COUNT(?nodeid) AS ?nevents) where { graph <http://www.vaimee.it/my2sec/"+this.usermail+"> {?nodeid <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.vaimee.it/ontology/sw#Event> }} ")
        //[0]ON SUBSCRIBE
        sub.on("subscribed",console.log)
        //[1]ON NOTIFICATION
        sub.on("notification", not => {
            var bindings=this.extract_bindings(not);
            counter_el.innerHTML=bindings[0].nevents.value;
            console.log("Received SubEventsCount notification: "+bindings[0].nevents.value)
        });
        //[2]ON ERROR
        sub.on("error",console.error)	
    }

	async sepa_getUserDashboard(){

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
        
        var data=await this.sepaConsumer.query("select ?dash_id where { graph <http://www.vaimee.it/my2sec/dashboards> { <http://www.vaimee.it/my2sec/"+this.usermail+"> <http://www.vaimee.it/my2sec/superset/dashID> ?dash_id;  }}",override_host)
        
        //console.log("");
        var bindings=this.extract_query_bindings(data);

        if(bindings.length!=0){
            var dash_id=bindings[0].dash_id.value;
            console.log(dash_id)
        }else{
            dash_id="";
        }
        return dash_id;
            

	}

    sepa_getUserName(){
		return new Promise(resolve=>{
            this.sepaConsumer.query("select ?username where { graph <http://www.vaimee.it/my2sec/members> { <http://www.vaimee.it/my2sec/"+this.usermail+"> <http://www.vaimee.it/ontology/my2sec#username> ?username }}")
            .then((data)=>{
                //console.log("");
                var bindings=this.extract_query_bindings(data);
                this.userName=bindings[0].username.value;
                resolve(this.userName);
            });
		});	
	}

    extract_bindings(msg){
        var bindings=msg.addedResults.results.bindings;
        return bindings;
    }
    
    extract_query_bindings(msg){
        var bindings=msg.results.bindings;
        return bindings;
    }
}