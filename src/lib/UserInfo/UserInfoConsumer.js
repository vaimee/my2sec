class UserInfoConsumer {
    constructor(usermail){
        this.sepaConsumer= new Sepajs.SEPA(default_jsap)
        this.userName="";
        this.usermail=usermail;
        log.info("New UserInfoConsumer created!")
    }

    logspan_usermail(element){
        document.getElementById(element).innerHTML=this.usermail;
    }

    logspan_username(element){
        document.getElementById(element).innerHTML=this.userName.toUpperCase();
    }

    logspan_subEventsCount(element){
        consoleLog(1,"SUBSCRIBING TO EVENTS COUNT")
        var counter_el=document.getElementById(element);
        const sub = this.sepaConsumer.subscribe("select (COUNT(?nodeid) AS ?nevents) where { graph <http://www.vaimee.it/my2sec/"+this.usermail+"> {?nodeid <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.vaimee.it/ontology/sw#Event> }} ")
        //[0]ON SUBSCRIBE
        sub.on("subscribed",console.log)
        //g.consoleLog(1,"#### LISTENING TO NOTIFICATIONS ###\n")
        //[1]ON NOTIFICATION
        sub.on("notification", not => {
            var bindings=this.extract_bindings(not);
            counter_el.innerHTML=bindings[0].nevents.value;
            console.log("Received SubEventsCount notification: "+bindings[0].nevents.value)
        });
        //[2]ON ERROR
        sub.on("error",console.error)	
    }

	sepa_getUserDashboard(){
		return new Promise(resolve=>{
				this.sepaConsumer.query("select ?dash_id where { graph <http://www.vaimee.it/my2sec/dashboards> { <http://www.vaimee.it/my2sec/"+this.usermail+"> <http://www.vaimee.it/my2sec/superset/dashID> ?dash_id;  }}")
				.then((data)=>{
					//console.log("");
					var bindings=extract_query_bindings(data);
	
					if(bindings.length!=0){
						var dash_id=bindings[0].dash_id.value;
						console.log(dash_id)
					}else{
						dash_id="";
					}
					resolve(dash_id);
				});
		});	
	}

    sepa_getUserName(){
		return new Promise(resolve=>{
            this.sepaConsumer.query("select ?username where { graph <http://www.vaimee.it/my2sec/members> { <http://www.vaimee.it/my2sec/"+this.usermail+"> <http://www.vaimee.it/ontology/opo#username> ?username }}")
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