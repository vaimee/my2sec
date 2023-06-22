/*---------------------------------------------------------\
|| main.js: MAIN SCRIPT OF ACTIVITY WATCH PRODUCER
|| 	DATE: 28/06/2022
|| 	AUTHOR: Gregorio Monari
|| 	DESCRIPTION: initializes the application and defines 
||		some major functions
\\---------------------------------------------------------*/
var log=new GregLogs();
console.log("//------------------------\\\\")
console.log("|| ActivityWatch PRODUCER ||")
console.log("\\\\------------------------//")
//GLOBAL
let _initializer;
let _connectionTester;
let _userInfoConsumer;
let _tasksManager;
let _scanManager;
let _updateManager;
let _errorManager= new ErrorManager("error-panel","error-title","error-description")
let _accountPanelManager;
let _logTimesManager;

//Init application
init();

async function init(){
	log.info("Initializing Application") 


	try{
		//Get json configuration
		var json_package=await window.versions.request_user_credentials();
		json_package=JSON.parse(json_package)//contains jsap and user credentials
		this.log.trace(json_package)

		//Create the initializer
		_initializer= new Initializer(json_package);

		//Initialize Connection tester
		_connectionTester= new ConnectionTester(_initializer.get_jsap())
		//await _connectionTester.init_connection_status()
		//this.log.info("Connection status: "+(initialConnectionStatus? 'connected' : 'not connected'))
		_connectionTester.poll()
		//TODO: CHECK IF AW PRODUCER DOES NOT EXIST
		var awQueryManager= new AwQueryManager(_initializer.get_jsap())
		var producerClient= new ProducerBucketClient(_initializer.get_jsap())
		var producerExists=await awQueryManager.producer_bucket_exists()
		if(!producerExists){
			this.log.info("Aw Producer bucket does not exist, creating bucket...")
			await producerClient.create_bucket()
		}else{
			this.log.info("Producer bucket exists, skipping bucket creation")
		}

		//Initialize UserInfoConsumer
		_userInfoConsumer= await _initializer.get_userinfomanager()



		

		
		//Initialize TaskManager
		_tasksManager= _initializer.get_tasksmanager(_userInfoConsumer);


		//Initialize Scan Manager
		_initializer.get_scanmanager().then(res=>{
			_scanManager=res;
		}) //!DO NOT AWAIT, CONTAINS A POLLING AND COULD BLOCK CODE EXECUTION
		//_scanManager.test()
		

		//INITIALIZE LOG TIMES MANAGER
		_logTimesManager= new LogTimesManager(
			_initializer.get_jsap(),
			_userInfoConsumer.usermail,
			_tasksManager.get_tasks_consumer()
		)
		_logTimesManager.start()



		
		//CHECK FOR UNVALIDATED ACTIVITIES LEFT, IN CASE PROCEDURE WAS CUT
		/*const queryRes=await new UserSynchronousConsumer(
            _initializer.get_jsap(),
            "USER_TRAINING_ACTIVITIES",
            {
                forceUserGraph:"http://www.vaimee.it/my2sec/"+_userInfoConsumer.usermail
            },
            "http://www.vaimee.it/my2sec/trainingactivitiesflag",
			"http://www.vaimee.it/my2sec/"+userEmail,
            false
        ).querySepa()
		//var queryRes=await trainingActivitiesConsumer.querySepa();
		this.log.debug(queryRes)
		if(queryRes!=null||queryRes!=undefined){
			if(queryRes.length>0){
				this.log.info("Unvalidated activities left, calling update manager");
				try{
					_updateManager = _initializer.get_updatemanager(_userInfoConsumer,_logTimesManager)
					await _updateManager.open_validation_panel()
					_updateManager.set_state("validate_activities")
                    _updateManager.change_section("validate_activities")
                    _updateManager.trainingActivitiesConsumer.subscribeToSepa() //!NECESSARY
				}catch(e){
					var title="UpdateManager initialization error"
					_errorManager.injectError(title,e)
				}
			}
		}*/


		_accountPanelManager= new AccountPanelManager(_initializer.get_jsap(),_userInfoConsumer)


		_initializer.init_dashboardmanager(_userInfoConsumer)
		
		this.log.debug("Querying profession")
		var userProfessionConsumer=new UserProfessionInfoConsumer(_initializer.get_jsap(),_userInfoConsumer.get_userEmail())
		const worker_type=await userProfessionConsumer.querySepa();
		const profession_type=worker_type[0].profession_type.split("#")[1]
		const div=document.getElementById("user_welcome_worker_type");
		div.innerHTML=profession_type

	}catch(e){
		var title="Initialization error in main.js"
		_errorManager.injectError(title,e)
	}

}






//===== CONNECTORS ==================================================================================
//###################
//# ACCOUNT PANEL   #
//###################
function switch_account_panel(){
	_accountPanelManager.on_account_button_pressed()
}
function on_modify_worker_button_pressed(){
	_accountPanelManager.on_modify_worker_button_pressed()
}
function on_set_worker_button_pressed(){
	_accountPanelManager.on_set_worker_button_pressed()
}
function on_cancel_worker_button_pressed(){
	_accountPanelManager.on_cancel_worker_button_pressed()
}

//###################
//# ERROR PANEL     #
//###################
function close_error_panel(){
	document.getElementById("error-panel").style.display="none"
}


//###################
//# START-STOP SCAN #
//###################
function on_start_button_pressed(){
	if(document.getElementById("start-stop-button").className=="default-button-deactivated"){
		this.log.warning("DEFAULT BUTTON IS NOT ACTIVE YET, WAIT A FEW SECONDS PLEASE...")
		return;
	}
	try{
		_scanManager.onStartButtonPressed()
	}catch(e){
		var title="Scan manager error"
		_errorManager.injectError(title,e)
	}
}

//###################################
//# INITIALIZE VALIDATION PROCEDURE #
//###################################
//when user presses update button in the homepage
async function start_update_procedure(){
	var updateManagerOn=false;
	try{
		_updateManager.get_state();
		updateManagerOn=true;
	}catch(e){
		this.log.info(e)
	}
	if(updateManagerOn){
		//throw new Error("UpdateManager is still On!")
		this.log.info("UpdateManager is still on")
	}else{
		this.log.info("UpdateManager is undefined, perfect!")
	}

	try{
		_updateManager = _initializer.get_updatemanager(_userInfoConsumer,_logTimesManager)
		await _updateManager.on_update_button_clicked()
	}catch(e){
		var title="UpdateManager initialization error"
		_errorManager.injectError(title,e)
	}

}

async function abort_update_procedure(){
	//console.log("aborting")
	refreshSupersetDashboard('my-superset-container')
	_updateManager.on_close_button_clicked()
	this.log.info("Cleaning updateManager")
	//_updateManager={}; //!DELETE UPDATE MANAGER
	try{
		_updateManager.get_state();
	}catch(e){
		console.error(e)
	}
	try{
		_updateManager.trainingActivitiesConsumer.cachedGraphs=[];//clean cache
		_updateManager.tm.logicalArray={}//clean cache
		_updateManager.atm.logicalArray={}//clean cache
		//document.getElementById("update-procedure-button").className="default-button-deactivated"
		try{
			_updateManager.trainingActivitiesConsumer.exit()
		}catch(e){
			console.log(e)
		}
		//?Reset update panel
		_scanManager.init_update_button();
        
	}catch(e){console.log(e)}
	
}
async function on_validation_button_pressed(){
	try{
		await _updateManager.on_validation_button_clicked()
	}catch(e){
		var title="UpdateManager upload error"
		_errorManager.injectError(title,e)
	}

}

//change selection
function on_selection_change(i){
	_updateManager.on_selection_change(i)	
}
function select_all(){
	_updateManager.select_all_visible_rows()
}
function set_all_rows_to_value(value){
	_updateManager.set_all_rows_to_value(value)
}
function on_activity_selection_change(i){
	_updateManager.on_activity_selection_change(i)	
}

