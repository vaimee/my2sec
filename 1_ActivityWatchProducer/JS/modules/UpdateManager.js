class UpdateManager{
    constructor(jsap,userEmail,logTimesManager){
        this.dynamicSubsJsap=jsap;
        this.log=new GregLogs()
        this.userEmail=userEmail;
        this.logTimesManager=logTimesManager;
        this.awQueryManager= new AwQueryManager(jsap);
        this.my2secApiClient= new My2secApiClient(jsap);
        this.producerBucketClient= new ProducerBucketClient(jsap);

        this.state="validate_events"
        this.validationPanel=document.getElementById("validation_wrapper");
        this.obscurationPanel=document.getElementById("validation_obscurer");
        this.validationButton=document.getElementById("confirm");
        this.validationSpinnerDiv=document.getElementById("update_spinner");
        this.validationSuccessDiv=document.getElementById("success_status");
        this.validationCommentDiv=document.getElementById("validation_comment");

        //Table managing
        this.tm=new TableManager("validation_body");
        this.atm= new ActivityTableManager("validation_body")

        //PAC
        this.activityTypesConsumer= new ActivityTypesConsumer(jsap,userEmail);
        this.professionInfoConsumer=new UserProfessionInfoConsumer(jsap,userEmail);
        this.currentProfessionInfo={}


        //TODO: CHANGE TO MONGO
        this.awMessagesProducer= new MongoDbMessagesProducer(jsap,userEmail);//AwMessagesProducer(jsap,userEmail);
        //TODO: CHANGE TO MONGO FLAG
        this.productionFinishedFlagProducer = new MongoProductionFinishedFlagProducer(jsap,userEmail);


        //TRAINING ACTIVITIES
        //TODO: MAKE CONFIGURABLE GRAPH AND FLAG!!! @DONE
        this.trainingActivitiesConsumer; //dichiara
        //VALIDATED ACTIVITIES
        //TODO: MAKE CONFIGURABLE GRAPH AND FLAG!!!
        this.validatedActivitiesProducer//=new ValidatedActivitiesProducer(jsap,userEmail)
        //TODO: MAKE CONFIGURABLE FLAG
        this.validatedActivitiesFlagProducer//=new ValidatedActivitiesFlagProducer(jsap,userEmail)
        //TODO: MAKE CONFIGURABLE GRAPH
        this.trainingActivitiesRemover//= new TrainingActivitiesRemover(jsap);
    }
    getCurrentProfessionInfo(){
        return this.currentProfessionInfo
    }


    async initDynamicSubscriptions(professionInfo){
        this.log.info("Initializing Dynamic Subscriptions")
        this.log.debug(professionInfo)
        const jsap=this.dynamicSubsJsap
        const userEmail=this.userEmail;
        //var _events_graph="http://www.vaimee.it/my2sec/events";
        var _activities_graph="http://vaimee.it/my2sec/activities";
        //var _awmapperFlag="http://www.vaimee.it/my2sec/awmapperflag"; //ricevuto dall'aggregatore
        var _trainingActivitiesFlag="http://www.vaimee.it/my2sec/trainingactivitiesflag"; //prodotto dall'aggregatore
        var _validatedActivitiesFlag="http://www.vaimee.it/my2sec/validatedactivitiesflag"; //ricevuto dall'aggregatore
        //CONFIGURABLE GRAPH AND FLAG!!!
        if(professionInfo.hasOwnProperty("activities_graph")){
            _activities_graph=professionInfo.activities_graph;
            this.log.debug("Activities graph override with: "+_activities_graph)
        }else{this.log.warning("Activities graph is undefined, using default activities graph: "+_activities_graph)}
      
        if(professionInfo.hasOwnProperty("trainingActivitiesFlag")){
            _trainingActivitiesFlag=professionInfo.trainingActivitiesFlag;
            this.log.debug("trainingActivitiesFlag override with: "+_trainingActivitiesFlag)
        }else{this.log.warning("trainingActivitiesFlag is undefined, using default trainingActivitiesFlag: "+_trainingActivitiesFlag)}
        
        if(professionInfo.hasOwnProperty("validatedActivitiesFlag")){
            _validatedActivitiesFlag=professionInfo.validatedActivitiesFlag;
            this.log.debug("validatedActivitiesFlag override with: "+_validatedActivitiesFlag)
        }else{this.log.warning("validatedActivitiesFlag is undefined, using default validatedActivitiesFlag: "+_validatedActivitiesFlag)}


        this.trainingActivitiesConsumer=new SynchronousConsumer(
            jsap,
            "USER_TRAINING_ACTIVITIES",
            {
                activities_graph:_activities_graph,
                forceUserGraph:"http://www.vaimee.it/my2sec/"+userEmail
            },
            _trainingActivitiesFlag,//"http://www.vaimee.it/my2sec/trainingactivitiesflag",
            false,
            true
        );
        this.trainingActivitiesConsumer.em.addEventListener("newsyncflag",not=>{
            //TODO: GET SYNCH FLAG
            this.log.debug("ACTIVITIES FLAG TRIGGERED")
            var cache
            try{
                cache=this.trainingActivitiesConsumer.get_cache_by_user("http://www.vaimee.it/my2sec/"+userEmail);
            }catch(e){
                this.log.error(e)
            }

            this.load_training_activities(cache).catch(e=>{
                //throw new Error("MAO")
                var title="Load training activities error"
		        _errorManager.injectError(title,e)
            })
        })


        //TODO: MAKE CONFIGURABLE GRAPH AND FLAG!!!
        this.validatedActivitiesProducer=new ValidatedActivitiesProducer(jsap,userEmail,_activities_graph)
        //TODO: MAKE CONFIGURABLE FLAG
        this.validatedActivitiesFlagProducer=new ValidatedActivitiesFlagProducer(jsap,userEmail,_validatedActivitiesFlag)
        //TODO: MAKE CONFIGURABLE GRAPH
        this.trainingActivitiesRemover= new TrainingActivitiesRemover(jsap,_activities_graph);
        
    }


    async test(){
        console.log("HELLO!")
        await this.queryManager.test_general()
    }

    //---------------------------------INTERACTIONS MANAGEMENT---------------------------------
    select_all_visible_rows(){
        this.tm.select_all_visible_rows()
    }
    set_all_rows_to_value(value){
        this.tm.set_all_rows_to_value(value)
        if(!this.tm.check_none_events()){
            this.log.info("No None events found, reactivating update button")
            this.get_validation_button().className="default-button";
        }else{
            this.log.info("Found events with no working flag, deactivating update button...")
            this.get_validation_button().className="default-button-deactivated";
        }
    }
    on_selection_change(i){
        this.tm.on_selection_change(i)
        if(!this.tm.check_none_events()){
            this.log.info("No None events found, reactivating update button")
            this.get_validation_button().className="default-button";
        }else{
            this.log.info("Found events with no working flag, deactivating update button...")
            this.get_validation_button().className="default-button-deactivated";
        }
    }
    on_activity_selection_change(i){
        this.atm.on_activity_selection_change(i)
        //Check if none events are present
        this.log.info("Checking table for None activities")
        if(this.atm.check_none_activity_types()){
            this.log.info("Found activities with no activity flag, deactivating update button...")
            //this.get_validation_button().className="default-button-deactivated";
            this.change_procedure_status("button-deactivated")
        }else{
            this.log.info("All activities are categorized, update button is enabled")
            this.change_procedure_status("button-activated")
        }
    }
    async on_update_button_clicked(){
        this.open_validation_panel();
        try{
            var res=await this.professionInfoConsumer.querySepa();
            this.currentProfessionInfo=res[0];
            await this.initDynamicSubscriptions(this.getCurrentProfessionInfo()) //?DYNAMIC UPDATE!
            this.log.info("** Loading working events");
            await this.load_working_events();
            this.log.info("** Working events loaded correctly!");
        }catch(e){
            var title="Load Working Events error"
            _errorManager.injectError(title,e)
        }
    }
    async on_close_button_clicked(){
        this.activityTypesConsumer.exit()
        this.close_validation_panel();
        /*try{
            await this.abort_procedure()
        }catch(e){
            var title="Validation panel Close error"
            _errorManager.injectError(title,e)
        }*/
    }
    async on_validation_button_clicked(){
        if(this.get_validation_button().className!="default-button-deactivated"){
            var currentState=this.get_state();
            switch (currentState) {
                case "validate_events":
                    console.log(" ")
                    this.log.info("----------< Publishing validated EVENTS >----------")
                    await this.publish_validated_events()
                    this.trainingActivitiesConsumer.subscribeToSepa() //!NECESSARY
                    this.set_state("validate_activities")
                    this.change_section("validate_activities")
                    //await this.load_training_activities() //!CANNOT DO IT HERE, NEEDS SYNC FLAG
                    break;
    
                case "validate_activities":
                    console.log(" ")
                    this.log.info("----------< Publishing validated ACTIVITIES >----------")
                    await this.publish_validated_activities()
                    this.set_state("validate_tasks")
                    this.change_section("validate_tasks")
                    this.load_log_times()
                    break;
    
                case "validate_tasks":
                    this.log.warning("Not yet implemented")
                    break;
            
                default:
                    throw new Error("Unknown state for Update Manager")
                    break;
            }
        }else{
            throw new Error("User must fill none events before uploading")
        }
    }



    //---------------------------------PANEL MANAGEMENT---------------------------------
    open_validation_panel(){
        this.log.debug("Opening validation panel...")
        document.getElementById("vs1").className="validation_section-selected";
        document.getElementById("vs2").className="validation_section";
        document.getElementById("vs2").className="validation_section";
        document.getElementById("validation_body").innerHTML="";

        this.get_validation_panel().style.display="block"
        this.get_obscuration_panel().style.display="block"
    }
    close_validation_panel(){
        this.log.debug("Closing validation panel...")
        this.get_validation_panel().style.display="none"
        this.get_obscuration_panel().style.display="none"
    }
    change_section(section_name){
        switch (section_name) {
            case "validate_activities":
                document.getElementById("vs1").className="validation_section";
                document.getElementById("vs2").className="validation_section-selected";
                document.getElementById("validation_body").innerHTML="";
                document.getElementById("validation_selection_buttons").style.display="none";
                //this.change_procedure_status("button-activated")
                break;
            
            case "validate_tasks":
                document.getElementById("vs1").className="validation_section";
                document.getElementById("vs2").className="validation_section";
                document.getElementById("vs3").className="validation_section-selected";
                document.getElementById("validation_body").innerHTML="";
                //document.getElementById("validation_selection_buttons").style.display="none";
                break;

            default:
                break;
        }
    }
    change_procedure_status(status){
        switch (status) {
            case "button-deactivated":
                this.get_validation_button().className="default-button-deactivated";
                this.get_validation_button().style.display="block";
                this.get_loading_div().style.display="none";
                this.get_comment_div().style.display="block"; //notify to fill empty cells
                this.get_success_div().style.display="none";
                break;

            case "button-activated":
                this.get_validation_button().className="default-button";
                this.get_validation_button().style.display="block";
                this.get_loading_div().style.display="none";
                this.get_comment_div().style.display="none";
                this.get_success_div().style.display="none";
                break;

            case "loading":
                this.get_loading_div().style.display="block";
                this.get_comment_div().style.display="none";
                this.get_success_div().style.display="none";
                this.get_validation_button().style.display="none";
                break;

            case "success":
                this.get_loading_div().style.display="none";
                this.get_comment_div().style.display="none";
                this.get_success_div().style.display="block";
                this.get_validation_button().style.display="none";
                break;
        
            default:
                throw new Error("Unknown status")
                break;
        }
    }


    //---------------------------------DATA MANAGEMENT---------------------------------
    //LOAD DATA INTO PANEL
    async load_working_events(){
        //[1] Get filtered events from Python AI
        try{
            this.log.info("Getting filtered working events from AI")
            var data;
            data=await this.my2secApiClient.getWorkingEventsAiFiltered()
            this.log.debug(data)
            if(data==null||data==undefined){throw new Error("Filtered events cannot be null")}
        }catch(e){
            _errorManager.injectError("Error getting Filtered Working Events",e)
            return;
        }

        //[2] Inject them into a Dynamic table
        try{
            this.log.info("Injecting events into table")
            this.tm.injectTable(data,"app,title,timestamp,working_selection")
            this.log.debug(this.tm.get_internal_cache());
        }catch(e){
            _errorManager.injectError("Error injecting events into table",e)
            return;
        }

        //[3] Style the table with DataTables
        try{
            this.log.info("Applying style to table")
            if(Object.keys(data).length!=0){
                $(document).ready( function () {
                    var events_table=$("#wst").DataTable();
                });
            }else{
                this.log.info("Received empty json")
                var _corpo=document.getElementById("validation_body")
                _corpo.innerHTML=`
                <div 
                    width="100%" 
                    align="center"
                    style="margin-top:auto;margin-bottom:auto;height:100%;display:flex;align-items:center;justify-content:center"
                >
                    Events are already classified and ready to be sent!
                    <br>
                    This message appeared because all the scanned events have alredy previously been categorized by the IA.  
                    <br>
                    Press the 'confirm and upload' button to automatically upload your events and proceed to the next section
                </div>
                    `
            }
        }catch(e){
            _errorManager.injectError("Error styling working events table",e)
            return;
        }

        //[4] Check if none events are present
        this.log.info("Checking table for None events")
        if(this.tm.check_none_events()){
            this.log.info("Found events with no working flag, deactivating update button...")
            //this.get_validation_button().className="default-button-deactivated";
            this.change_procedure_status("button-deactivated")
        }else{
            this.log.info("All events are categorized, update button is enabled")
            this.change_procedure_status("button-activated")
        }


    }


    async load_training_activities(cache){
        this.log.info("** Loading training activities");
        if(cache==null||cache==undefined){throw new Error("Training activities cache cannot be null")}

        this.log.debug(cache);
        this.atm.originalBindings=cache;
        //this.atm.training_events_flag_uri=training_events_flag_uri
        var known_categories="Developing,Meeting,Reporting,Researching,Testing,Email,Other"
        try{
            this.log.info("Loading activityTypes")
            var activityTypes= await this.activityTypesConsumer.querySepa();
            this.log.info(activityTypes)
            var activityTypesString="";
            for(var i in activityTypes){
                this.log.info(activityTypes[i])
                var activityType=activityTypes[i].activity_type.split("#")[1].trim();
                activityTypesString=activityTypesString+activityType
                if(i!=activityTypes.length-1){activityTypesString=activityTypesString+","}
            }
            known_categories=activityTypesString;

        }catch(e){
            known_categories="Developing,Meeting,Reporting,Researching,Testing,Email,Other"
            console.error(e)
        }
        this.log.info(known_categories)

        this.log.info("Injecting Activities table")
        this.atm.injectTable(cache,"activity_type,app,title,duration,datetimestamp",known_categories)
        if(Object.keys(cache).length!=0){
            $(document).ready( function () {
                var events_table=$("#wst").DataTable();
            } );
        }else{
            throw new Error("Activities json CANNOT BE EMPTY!")
        }

        //Check if none events are present
        this.log.info("Checking table for None activities")
        if(this.atm.check_none_activity_types()){
            this.log.info("Found activities with no activity flag, deactivating update button...")
            //this.get_validation_button().className="default-button-deactivated";
            this.change_procedure_status("button-deactivated")
        }else{
            this.log.info("All activities are categorized, update button is enabled")
            this.change_procedure_status("button-activated")
        }
    }

    async load_log_times(){
        this.get_validation_body().innerHTML="";
        this.change_procedure_status("loading")
        this.logTimesManager.logTimesConsumer.emNaive.on("addedResults",(data)=>{
            this.log.debug('Added Log Times Results Event emitted with data:', data);
             //this.log.trace(this.tasksConsumer.get_cache())
             var tasksCache=this.logTimesManager.tasksConsumer.get_cache()
             //!FALLBACK
             if(tasksCache==null ||tasksCache==undefined){throw new Error("Tasks cache cannot be null")}
             this.printNewLogTime(tasksCache,data);
        })
    }
    async printNewLogTime(tasks_cache,binding){
        var tasks;
        if(tasks_cache.length==0){
            this.log.info("TASKS CACHE IS EMPTY, TRYING TO QUERY SEPA")
            tasks=await this.logTimesManager.tasksConsumer.querySepa()
            if(tasks.length==0){
                throw new Error("User has no tasks!")
            }
        }else{
            tasks=tasks_cache;
        }

        //this.log.debug(tasks);
        //this.log.debug(logtimes);
        var log_time=this.mapLogTime(tasks,binding);
        var logTimesContainer=this.get_validation_body();
        this.log.debug(log_time)
        logTimesContainer.innerHTML = logTimesContainer.innerHTML + this.generateLogTimeCell(log_time)
        this.change_procedure_status("success")
    }
    mapLogTime(tasks,binding){
        var logged_time=this.secondsToTimeString(binding.log_time)
        var task_uri=binding.task_uri;
        var task_name="";
        var progetto="";
        for(var j in tasks){
            if(task_uri==tasks[j].bnode){
                task_name=tasks[j].tasktitle.split("#")[1];
                progetto=tasks[j].progetto.split("#")[1];
                break;
            }
        }

        return {
            task_name:task_name,
            progetto:progetto,
            log_time:logged_time,
            now: binding.now
        }
    }
    generateLogTimeCell(log_time){
        var task_name=log_time.task_name;
        var progetto=log_time.progetto;
        var log_time_string=log_time.log_time;
        var now=log_time.now.split("T")[1].trim();
        //show only hour and minute
        now=now.split(":")[0]+":"+now.split(":")[1]
        //console.log(now.split(":"))

        return `
        <div class="log_time_cell">
            <p>
                ${now} > <b>${progetto} - Task '${task_name}'</b>
            </p>
            <p class="log_time_cell-logged_time">
                &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp
                <img src="Assets/icons/clock-outline.svg"> 
                &nbsp Logged time:&nbsp<b>${log_time_string}</b>
            </p>
        </div>
        `
    }

    //PUBLISH DATA
    async publish_validated_events(){
        
        //Ask user for confirmation
        if(!confirm("Are you sure?")){
            this.log.info("User aborted upload procedure")
            return;
        }

        //Activate spinner
        this.change_procedure_status("loading");

        //[1] Update IA Knowledge
        //Fetch events stored into the validation panel Table
        this.log.info("Fetching validated events from internal table cache")
        var validatedEvents= this.tm.get_cache_as_json_array();
        this.log.debug(validatedEvents)

        //If the IA returned a non-zero array, update IA with validated events from user. Else, skip
        if(Object.keys(validatedEvents).length!=0){
            this.log.info("Updating IA with user's validated events")
            await this.my2secApiClient.setWorkEvents(validatedEvents) //!bugfix, con JSON.stringify funzia -> SPOSTATO IN MY2SEC API
            var success=await this.my2secApiClient.getCsvNone()
            if(success=="True"){throw new Error("None events are present in csv")}
            this.log.info("IA updated correctly, proceeding to next step")
        }else{
            this.log.info("Skipping Updating IA with user's validated events, no new events to validate")
        }

        //Now that the IA is updated, save events into AWdb
        this.log.debug("Saving events into AW db")
        var currCsvRes=await this.my2secApiClient.sendCurrentCsv()
        this.log.debug(currCsvRes)
        

        

        //[2] Fetch all events and upload
        //Fetch all events from AwDb
        this.log.debug("Fetching all events from AwDb")
        const jsonEventsArr=await this.awQueryManager.get_aw_messages_jsonarr()
        this.log.debug(jsonEventsArr);

        
        //Send to SEPA
        //if mongo -> qui invia sia sepa che mongo
        //else solo sepa
        this.log.debug("Updating SEPA")
        //await this.awMessagesProducer.send_messages_to_sepa(rawEvents);
        await this.awMessagesProducer.send_messages_to_sepa_and_mongo(jsonEventsArr);

        this.log.debug("Messages published correctly, sending flag")
        await this.productionFinishedFlagProducer.updateSepa()
        this.log.debug("Sepa update Finished!")

        //ON SUCCESS ANCORA NIENTE, RESETTA UPDATE EVENT E SCANNED TIME ALLA FINE
        this.log.debug("Notify update completion to ProducerBucket")
        var now=this.get_current_timestamp()
        await this.producerBucketClient.set_last_update(now); //? LI FACCIO ADESSO?
        await this.producerBucketClient.set_scanned_time("0");

    }

    async publish_validated_activities(){
        if(!confirm("Are you sure?")){
            this.log.info("User aborted upload procedure")
            return;
        }

        //Activate spinner
        this.change_procedure_status("loading");

        //FETCH CACHE OF TABLE MANAGER
        this.log.info("Fetching validated activities from internal table cache")
        var validatedActivities= this.atm.get_internal_cache()
        this.log.debug(validatedActivities)
        this.log.info("Fetching bindings to remove from internal table cache")
        var bindingsToRemove= this.atm.get_original_bindings()
        this.log.debug(bindingsToRemove)
        

        //UPDATE VALIDATED ACTIVITIES
        await this.validatedActivitiesProducer.send_validated_activities_to_sepa(validatedActivities)
        //UPDATE VALIDATED ACTIVITIES FLAG
        await this.validatedActivitiesFlagProducer.updateSepa()
        //REMOVE TRAINING ACTIVITIES
        await this.trainingActivitiesRemover.remove_training_activities_from_sepa(bindingsToRemove)
        //REMOVE TRAINING ACTIVITIES FLAG //!FOR NOW MUST DO AUTO REMOVE
        //await this.flagRemover.updateSepa(training_activities_flag_uri)


    }


    //---------------------------------STATE MANAGEMENT---------------------------------
    set_state(state){
        this.state=state;
    }

    get_state(){
        return this.state;
    }

    //---------------------------------GETTERS/SETTERS-------------------------------------
    get_validation_body(){
        return document.getElementById("validation_body")
    }
    get_validation_panel(){
        return this.validationPanel;
    }
    get_obscuration_panel(){
        return this.obscurationPanel;
    }
    get_validation_button(){
        return this.validationButton;
    }
    get_loading_div(){
        return this.validationSpinnerDiv;
    }
    get_success_div(){
        return this.validationSuccessDiv;
    }
    get_comment_div(){
        return this.validationCommentDiv;
    }


    //---------------------------------UTILITY-----------------------------------------
    get_current_timestamp(){
        const date=new Date();
        var string_timestamp=date.toISOString()
        return string_timestamp
    }//get_current_timestamp()
    secondsToTimeString(secondsFloat){
		var seconds=Math.floor(secondsFloat)
		//this.log.trace("Total: "+seconds)

		//3 calcola stringa del tempo
		//var seconds=incrementedTimeScanned
		var string="";
		if(seconds<60){
			string=seconds+"s"
		}else{
			if(seconds<3600){
				var minutes=Math.floor(seconds/60)
				seconds=seconds-(minutes*60)
				string= minutes+"m:"+seconds+"s"
			}else{

				var h=Math.floor(seconds/3600)
				var left_s=seconds-(h*3600);
				if(left_s<60){
					string=  h+"h"
				}else{
					var m=Math.floor(left_s/60)
					string=  h+"h:"+m+"m"
				}

			}
		}
		this.log.trace("Scan timer: "+string)
		return string
	}
    


}