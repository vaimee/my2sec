class ConnectionTester{
    constructor(jsap){
        this.log=new GregLogs()
        this.listen_to_connection_status();
        this.awClient=new ActivityWatchSafeClient(jsap)
    }

    async poll(){
        this.log.info("Starting timer")
		while(true){

            await this.init_connection_status()
			await this.wait("300000")

		}
		//this.log.info("Timer stopped")
    }

    //TESTERS
    async init_connection_status(){
        console.log(" ")
        this.log.info("------<CONNECTION TEST>------")
        console.time("Connection test completed in")
        var isOffline=false;
        if(!navigator.onLine){
            isOffline=true;
            console.error('Offline')
            _errorManager.injectError(
                "Connection Offline",
                "The application can still perform scans, but upload is disabled."
                )
            this.get_connection_div().innerHTML=`<img id="user-menu-icon" style="transform:rotate(0deg);" class="white-icon" src="Assets/icons/wifi-off.svg" width="20px"> &nbsp Offline `
        }else{
            this.log.info("ONLINE")
            this.get_connection_div().innerHTML=`Online`
        }

        var awStatus=await this.get_activity_watch_status();
        if(!awStatus){
            this.get_connection_div().innerHTML="Disconnected from ActivityWatch"
        }else{
            this.log.info("Connected to ActivityWatch")
            if(!isOffline){this.get_connection_div().innerHTML=`<img id="user-menu-icon" style="transform:rotate(0deg);" class="white-icon" src="Assets/icons/wifi.svg" width="20px"> &nbsp Connected `}
        }
        console.timeEnd("Connection test completed in")
        console.log(" ")
    }

    listen_to_connection_status(){
        window.addEventListener('online', () => {
            console.error('Became offline')
            _errorManager.injectError(
                "Connection Offline",
                "The application can still perform scans, but upload is disabled."
                )
            this.get_connection_div().innerHTML="Offline"

        });

        window.addEventListener('offline', () => {
            console.error('Became offline')
            _errorManager.injectError(
                "Connection Offline",
                "The application can still perform scans, but upload is disabled."
                )
            this.get_connection_div().innerHTML="Offline"

        });
    }


    async get_sepa_status(){
        var basicSepaClient=new Sepajs.SEPA(jsap);//static queries
    }

    async get_activity_watch_status(){
        var out=false;
        try{
            var res=await this.awClient.get_all_buckets()
            out=true;
        }catch(e){
            _errorManager.injectError(
                "Activity Watch Offline",
                "Activity Watch application is not responding. The application cannot perform scans. Please activate ActivityWatch to continue using the application"
                )
        }
        return out
    }

    get_connection_div(){
        return document.getElementById("sepa_connectionstatus_wrapper")
    }


    wait(ms){
		return new Promise(resolve=>{
			setTimeout(() => { resolve("waited") }, ms)
		})
	}

    
	get_current_timestamp(){
        const date=new Date();
        var string_timestamp=date.toISOString()
        return string_timestamp
    }//get_current_timestamp()

}