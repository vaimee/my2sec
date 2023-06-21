class Initializer{
    constructor(json_package){

        this.log=new GregLogs()
        this.nodeInfo=json_package
    }


    //GETTERS
    get_jsap(){
        return this.nodeInfo["my2sec_jsap"]
    }

    get_login_info(){
        return this.nodeInfo["user_login_json"]
    }

    get_updatemanager(userInfoConsumer,logTimesManager){
        console.log(" ")
        this.log.info("----------< Loading working EVENTS >----------")
        let updateManager = new UpdateManager(this.get_jsap(),userInfoConsumer.usermail,logTimesManager)
        return updateManager
    }

    async get_updatemanager_old(){
        this.log.info("----------< Init ACTIVITYWATCH Client, test datasources >----------")
	    //IF THIS SECTION FAILS, THE APP EXECUTION MUST STOP
	    let awManager = new AwManager(json_package["my2sec_jsap"]);
	    this.log.info("** TEST DATASOURCES **")
	    var test_results=await awManager.startTests();
	    console.table(test_results)
	    Object.keys(test_results).forEach(k=>{
		    if(test_results[k]=="not-passed"){
			    throw new Error("Datasource error: ")
		    }
	    })
	    this.log.info("** TEST PASSED, DATASOURCES ONLINE! **")
        console.log(" ")
        return awManager
    }

    async get_userinfomanager(){
        console.log(" ")
        //THIS SECTION MUST ALSO NOT FAIL, SO I WILL NOT CATCH ANY ERROR
        log.info("----------< Init UserInfoManager >----------")
        log.debug("getting keycloak user credentials from node...")
        //const user_credentials_string = await window.versions.request_user_credentials()
        //const user_credentials_json=JSON.parse(user_credentials_string)
        const user_credentials_json=this.get_login_info()//json_package["user_login_json"];
        log.info_table(user_credentials_json)
        log.info("Fetched user information correctly")
        var userInfoConsumer= new UserInfoConsumer(this.get_jsap(),user_credentials_json.email)
        await userInfoConsumer.sepa_getUserName();
        log.debug("User info consumer initialized with data: Email("+userInfoConsumer.usermail+"), username("+userInfoConsumer.userName+")") // prints out 'pong'
        userInfoConsumer.logspan_username("user_name_welcome")
        userInfoConsumer.logspan_usermail("user_name");
        //userInfoConsumer.logspan_subEventsCount("sub_counter")
        console.log(" ")
        return userInfoConsumer
    }


    async init_dashboardmanager(userInfoConsumer){
        
        this.log.info("----------< Init SUPERSET dashboard >----------")
        var superset_host="http://dld.arces.unibo.it:8087";
        var container_id="my-superset-container";
        try{
            var dash_id=await userInfoConsumer.sepa_getUserDashboard();//"755f0434-6ac6-4d4f-8415-3b2b80c571e9";
            this.log.info("Fetched dashboard_id of "+userInfoConsumer.userName+" :"+dash_id)
            if(!dash_id){
                this.log.error("Error: invalid dashboard id, showing error message to the user")
                document.getElementById(container_id).innerHTML=`
                    <div class="missing_dashboard_error">
                        <div style="width:100%" align="center">
                            <h2>WARNING, missing events dashboard.</h2>
                            Contact your server administrator (discord/email) to activate it for you.
                        <div>
                    <div>
                    `
            }else{
                createDashboard(dash_id,superset_host,container_id)
            }
        }catch(e){
            console.log(e)
        }
        console.log(" ")
    }


    get_tasksmanager(userInfoConsumer){
        this.log.info("----------< Init TASKS dashboard >----------")
        let tasksManager;
        try{
            tasksManager = new TasksManager(this.get_jsap(),userInfoConsumer.usermail);
            this.log.info("** start task consumer **")
            tasksManager.start()
            //tasksConsumer.generate_tasks_template("task-wrapper")		
            //log.info("tasks consumed")
        }catch(e){
            console.log(e)
        }
        console.log(" ")
        return tasksManager
    }

    async get_scanmanager(){
        this.log.info("----------< Init SCAN MANAGER >----------")
        //await initControlPanel();
        var scanManager=new ScanManager(this.get_jsap());
        //console.log(scanManager.secondsToTimeString(60))
        
        await scanManager.init_start_scan_button(); //! DO NOT AWAIT INIT SCAN MANAGER, IT IS POLLING SO IT WILL BLOCK CODE EXECUTION UNTIL AW API IS STARTED
        await scanManager.init_update_button();
        this.log.info("Scan manager initialized")
        this.log.debug(`Scan status: ${scanManager.is_scan_running()}`)
        //scanManager.logStatus();
        return scanManager
    }






}