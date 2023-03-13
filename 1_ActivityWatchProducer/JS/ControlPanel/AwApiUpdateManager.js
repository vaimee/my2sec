class AwApiUpdateManager {
    constructor(jsap_file,awmanager,userinfoconsumer,tasksconsumer){
        this.log=new Greglogs();
        this.awManager=awmanager;
        this.userInfoConsumer=userinfoconsumer;
        this.tasksConsumer=tasksconsumer;
        this.vpanel=document.getElementById("validation_wrapper");
        this.opanel=document.getElementById("validation_obscurer");
        this.usergraph="http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail;
        //MESSAGES 
        this.awMessagesProducer=new SynchronousProducer(
            jsap_file,
            "SEND_MESSAGE",
            "http://www.vaimee.it/my2sec/awproducerflag"
        );
        //TRAINING ACTIVITIES
        this.trainingActivitiesConsumer=new SynchronousConsumer(
            jsap_file,
            "USER_TRAINING_ACTIVITIES",
            {
                forceUserGraph:this.usergraph
            },
            "http://www.vaimee.it/my2sec/trainingactivitiesflag",
            false
        );
        this.trainingActivitiesConsumer.em.addEventListener("newsyncflag",not=>{
            console.log("ACTIVITIES FLAG TRIGGERED")
            var tempcache=this.trainingActivitiesConsumer.get_cache_by_user(this.usergraph)
            this.on_received_training_activities(tempcache)
        })
        //VALIDATED ACTIVITIES
        this.validatedActivitiesProducer=new SynchronousProducer(
            jsap_file,
            "ADD_VALIDATED_ACTIVITY",
            "http://www.vaimee.it/my2sec/validatedactivitiesflag"
        );
        //SHOW LOG TIMES
        /*this.logTimesConsumer=new Consumer(jsap_file,"USER_LOG_TIMES",{
            usergraph:this.usergraph
        })
        this.logTimesConsumer.em.addEventListener("addedResults",not=>{
            console.log("RECEIVED LOG TIMES")
            this.on_log_time(not)
        })*/

        this.logTimesSub;//declare
 
        //FLOW CONTROL
        this.currentSection=0;
    }

    async start(){
        this.trainingActivitiesConsumer.subscribeToSepa();

        this.logTimesSub=this.awManager.sepaClient.USER_LOG_TIMES({
            usergraph:this.usergraph
        }) 
        this.logTimesSub.on("notification",not=>{
            var bindings=not.addedResults.results.bindings
            for(var i in bindings){
                //console.log()
                this.on_log_time(bindings[i])
            }
            
        })

        this.log.info("AwApiUpdateManager started!")
    }
    async stop(){
        this.trainingActivitiesConsumer.exit();
        this.logTimesSub.unsubscribe();
        this.log.info("AwApiUpdateManager stopped!")
    }

    //-------------------------------
    //MANAGE BUTTONS EVENTS
    on_update_button_pressed(){
        this.log.info("Update button pressed! Starting validation procedure")
        //show validation panel
        this.vpanel.style.display="block"
        this.opanel.style.display="block"
        this.log.info("Checking for unvalidated activities...")
        var usercache=this.trainingActivitiesConsumer.get_cache_by_user(this.usergraph)
        console.log(usercache)
        if(!usercache){
            usercache=[];
        }
        console.log(usercache.length)
        if(usercache.lenght>0){
            this.log.warning("Attenzione, attività non validate ricevute")
            this.currentSection=1;//segnala che siamo nella sezione 2
            this.begin_activities_validation()
            this.on_received_training_activities(usercache)
        }else{
            this.currentSection=0;//inizio standard
            document.getElementById("vs1").className="validation_section-selected";
            document.getElementById("vs2").className="validation_section";
            document.getElementById("vs2").className="validation_section";
            document.getElementById("validation_body").innerHTML="";
            this.change_update_status(0);
            this.awManager.initialize_validation_procedure()
        }
    }
    abort_update_procedure(){
        this.vpanel.style.display="none"
        this.opanel.style.display="none"
        this.currentSection=0;
        //dovresti anche pulire tutti gli oggetti e cache
    }

    async on_validation_button_pressed(){
        if(this.currentSection==0){
            await this.confirm_and_upload_events()
            this.currentSection=1;
        }else{
            this.send_validated_activities()
            this.currentSection=2;
        }
        //this.currentSection++
    }


    //-------------------------------
    //MANAGE UPDATE EVENTS
    async confirm_and_upload_events(){
        if(!confirm("Are you sure?")){
            throw new Error("UPLOAD ABORTED!")
        }
    
        console.log("### STARTING AI UPLOAD ###")
    
        var arr=this.awManager.tm.logicalArray//Json styled csv
        console.log("proceeding to send: ")
        console.table(arr)
        if(!(Object.keys(arr).length===0)){
            console.log(arr)
            var newKnowledgeCell={}
            for(var k in arr){
                var field=[]
                for(var i in arr[k]){
                    field.push(arr[k][i])
                }
                newKnowledgeCell[k]=field;
            }
            newKnowledgeCell=JSON.stringify(newKnowledgeCell)
            console.log(newKnowledgeCell)
            await this.awManager.setWorkEvents(newKnowledgeCell)
    
            var success=await this.awManager.getCsvNone()
            console.log(success)
            if(success=="True"){
                throw new Error("None events are present in Csv")
            }
        }else{
            console.log("NOTHING TO SHOW, PROCEEDING WITH SENDING EVENTS")
        }
    
        var success=await this.awManager.sendCurrentCsv()
        console.log(success)
        
        //ON SUCCESS...
        await this.awManager.uploadQuery() //dentro di se ora awmanager ha gli eventi
        //non mi piace, voglio che ritorni una variabile e che fai il ciclo for prima
        //if mongo -> qui invia sia sepa che mongo
        //else solo sepa
        await this.send_messages_to_sepa()
    }

    async send_messages_to_mongo(){

    }

    async send_messages_to_sepa(){
        this.log.info("### BUTTON PRESSED, STARTING SEPA UPLOAD ###")
        this.change_update_status(3)//activate loading spinner
    
        console.log(" ")
    
        //UPDATE MESSAGE	
        var update_success_flag=1;
        var response;
        var data={};
        for (var key in this.awManager.watchersJson) {		
            try{
                var msgtimestamp=this.get_current_timestamp();
                //response=await update_user_timed_sepa_message(EVENTS_RAWJSON[key],WATCHERS_JSON[key].client,curruser,msgtimestamp); 
                
                //BUGFIX
                if(!this.awManager.watchersJson[key].id.includes(this.awManager.watchersJson[key].client)){
                    //l'id e il client name sono diversi, seleziona l'id
                    log.warning("id and clientname of watcher do not match, using sliced id as clientname...")
                    var index=this.awManager.watchersJson[key].id.lastIndexOf("_")
                    this.awManager.watchersJson[key].client=this.awManager.watchersJson[key].id.slice(0,index)
                    log.warning(this.awManager.watchersJson[key].client)
                }
                
                data={
                    message_graph: "http://www.vaimee.it/my2sec/messages/activitywatch",
                    usergraph: "http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail,
                    source: "http://www.vaimee.it/sources/"+this.awManager.watchersJson[key].client,
                    msgtimestamp: msgtimestamp,
                    msgvalue: this.awManager.eventsRawJson[key]
                }
                this.log.debug("Usergraph: "+data.usergraph)
                this.log.debug("Source: "+data.source)
                this.log.debug("Timestamp: "+data.msgtimestamp)
                this.log.debug("Message: "+data.msgvalue)
                response=await this.awManager.sepaClient.SEND_MESSAGE(data)
                this.log.debug("RESPONSE: "+JSON.stringify(response))
                data={}//wipe data
            }catch(e){
                console.log(e);
                update_success_flag=0;
            }
        } 
    
        if(update_success_flag==1){
            this.change_update_status(1)
            if(silent_update==0){
                this.begin_activities_validation();
                //WHEN ALL UPDATES ARE DONE, CREATE UPDATE EVENT
                //UNCOMMENT TO RESUME UPDATE
                var syncresponse=await this.awManager.sepaClient.SET_SYNCHRONIZATION_FLAG({
                    flag_type:"http://www.vaimee.it/my2sec/awproducerflag",
                    usergraph:"http://www.vaimee.it/my2sec/"+this.userInfoConsumer.usermail
                  })
                console.log("Sync flag response: "+JSON.stringify(syncresponse))
                console.log("UPDATING TIMESTAMP")
                await this.awManager.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+get_current_timestamp()+"\"} }")
                //alert("UPDATED!");
                init_update_button()
                console.log("SUCCESS!")
                //var loadingbar=document.getElementById("loading_bar");
                //loadingbar.style.animation="load 1s linear"
            }else{
                console.log("SILENT UPDATE, PRODUCER TIMESTAMP DID NOT CHANGE")
                this.change_update_status(1)
            }
        }else{
            //alert("UPDATE FAILED!")
            this.change_update_status(2)
        }
    
    }


    //-------------------------------
    //MANAGE UPDATE ACTIVITIES
    begin_activities_validation(){
        document.getElementById("vs1").className="validation_section";
        document.getElementById("vs2").className="validation_section-selected";
        document.getElementById("validation_body").innerHTML="";
        console.log("BEGINNING ACTIVITIES PROCEDURE")
        this.change_update_status(0);
    }
    
    on_received_training_activities(bindings){
        console.log("Setting original bindings:")
        console.log(bindings)
        this.awManager.atm.originalBindings=bindings;
        var known_categories="Developing,Meeting,Reporting,Researching,Testing,Email,Other"
        console.log("Injecting table")
        this.awManager.atm.injectTable(bindings,"activity_type,app,title,duration,datetimestamp",known_categories)
        if(!this.awManager._jsonEmpty(bindings)){
            $(document).ready( function () {
                var events_table=$("#wst").DataTable();
            } );
        }else{
            console.log("ERROR: JSON CAN'T BE EMPTY")
            this.change_update_status(2)
        }
        //on_validated_activities()
    }
    
    async send_validated_activities(){
        this.change_update_status(3);
        var arr=this.awManager.atm.logicalArray//Json styled csv
        console.log(arr)
        //throw new Error("MAO")
        var ok=0;
        try{
            for(var i in arr){
                arr[i]["usergraph"]="http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail
    
                var title=arr[i]["title"].replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
                title=title.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI
                arr[i]["title"]=title;
                console.log(arr[i])
    
                var syncresponse=await this.awManager.sepaClient.ADD_VALIDATED_ACTIVITY(arr[i])
                console.log("Add validated activity response: "+JSON.stringify(syncresponse))	
            }
            
            try{
    
            
            var toRemove=this.awManager.atm.originalBindings;
            console.log("REMOVING: ")
            console.log(toRemove)
            for(var i in toRemove){
                var syncresponse=await this.awManager.sepaClient.REMOVE_TRAINING_ACTIVITY({
                    activity: toRemove[i].nodeid
                })
                console.log("Remove training activity response: "+JSON.stringify(syncresponse))	
            }
    
            }catch(e){
                console.log(e)
            }
            
            var syncresponse=await this.awManager.sepaClient.SET_SYNCHRONIZATION_FLAG({
                flag_type:"http://www.vaimee.it/my2sec/validatedactivitiesflag",
                usergraph:"http://www.vaimee.it/my2sec/"+userInfoConsumer.usermail
              })
            console.log("Sync flag response: "+JSON.stringify(syncresponse))	
            ok=1;
        }catch(e){
            console.log(e)
            ok=0;
        }
        if(ok==1){
            this.change_update_status(1)
            document.getElementById("success_status").innerHTML="Success! You can view your tasks on OpenProject"
            this.show_log_times()
        }else{
            this.change_update_status(2)
        }
    
    }


    show_log_times(){
        document.getElementById("vs1").className="validation_section";
        document.getElementById("vs2").className="validation_section";
        document.getElementById("vs3").className="validation_section-selected";
        document.getElementById("validation_body").innerHTML="";
        console.log("SHOWING LOG TIMES")
        
    }

    on_log_time(binding){
        console.log(binding)
        console.log(this.tasksConsumer.tasksCache)
        //console.log(this.find_task_name(binding,this.tasksConsumer.tasksCache))
        if(this.currentSection==2){
            var cachedTasks=this.tasksConsumer.tasksCache;
            var task_name=this.find_task_name(binding,cachedTasks)
            var log_time=binding.log_time.value;
            log_time=Math.round(log_time);
            var newString=`
            <div>
                <p>
                    <b>Updated spent time of Task '${task_name}'</b>
                </p>
                <p>
                    &nbsp&nbsp
                    <img src="Assets/icons/clock-outline.svg"> 
                    &nbsp Logged time: ${log_time}s
                </p>
            </div>
            `;
            document.getElementById("validation_body").innerHTML=document.getElementById("validation_body").innerHTML+newString;
        }else{
            console.log("Ignoring log time")
        }
    }

    find_task_name(log_time,tasks){
        for(var i in tasks){
            if(tasks[i].bnode==log_time.task_uri.value){
                return tasks[i].tasktitle
            }
        }

    }





    //-------------------------------------------------------
    //UTILITY
    change_update_status(type){
        //$("ready_status").style.display="none";
        //HIDE ALL
        //document.getElementById("ready_status").style.display="none";
        document.getElementById("success_status").style.display="none";
        document.getElementById("error_status").style.display="none";
        document.getElementById("update_spinner").style.display="none";
        //0 ready, 1 success, 2 error, 3 spinner
        switch (type) {
            case 0:
                console.log("status box removed")
                //document.getElementById("ready_status").style.display="block";
                break;
            case 1:
                document.getElementById("success_status").style.display="block";
                break;
            case 2:
                document.getElementById("error_status").style.display="block";
                break;
            case 3:
                document.getElementById("update_spinner").style.display="block";
                break;
            default:
                break;
        }
    }

    //NAME: get_current_timestamp()
    get_current_timestamp(){
	    const date=new Date();
	    var string_timestamp=date.toISOString()
	    //console.log(stringa)
	    return string_timestamp
    }

}