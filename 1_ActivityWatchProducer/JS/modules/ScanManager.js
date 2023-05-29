class ScanManager{
    constructor(jsap){
		this.my2secApiClient= new My2secApiClient(jsap);
		this.producerBucketClient= new ProducerBucketClient(jsap);
		this.log=new GregLogs();
		//scan status
        this.scan_running=false;
		this.last_start;
        this.time_scanned=0;
        this.currentSection=0;
		//dom elements
		this.timerSpan=document.getElementById("ready_status")
        this.updatebutton=document.getElementById("update-procedure-button")
        this.explorerbutton=document.getElementById("explorer-button")
        this.startbutton=document.getElementById("start-stop-innertext")
		//this.producerBucketClient.set_scanned_time(0)
    }

	async test(){
		//await this.producerBucketClient.delete_event("293317");
		//await this.producerBucketClient.delete_event("293315");
		//console.log(eventsArr)
		//var eventsArr= await this.producerBucketClient.get_all_producer_events();
		//console.log(eventsArr)

		var res=await this.my2secApiClient.getCsvNone();
		console.log(res)

	}

	async onStartButtonPressed(){
		if(!this.is_scan_running()){
			//start scan
			try{
				this.set_scan_status(true);
				await this.start_scan();
			}catch(e){
				this.set_scan_status(false);
				this.log.error(e);
			}
		}else{
			//stop scan
			try{
				this.set_scan_status(false);
				await this.stop_scan();
			}catch(e){
				this.log.error(e);
			}
		}
	}


	/**
	 * Performs this actions:
	 * - save the last start timestamp in the AW database
	 * - load the previous scanned time from AW db into this.scanned_time
	 * - start a timer
	 * - notify to the user that the scan has started
	 */
	async start_scan(){
		this.log.info("** Starting scan")
		var res = await this.my2secApiClient.startWatchers();
		this.log.info(res)
		await this.producerBucketClient.set_last_start(this.get_current_timestamp())
		//var eventsArr= await this.producerBucketClient.get_all_producer_events();
		//console.log(eventsArr)

		//Restore previous scanned time
		var previousScannedTime= await this.producerBucketClient.get_scanned_time()
		if(previousScannedTime!=null){
			var floatTime= parseFloat(previousScannedTime) //!CAST TO FLOAT
			this.set_time_scanned(floatTime)
			this.log.info("Restored scanned_time: "+this.get_time_scanned())
		}else{
			this.log.info("No scanned_time to restore, default: "+this.get_time_scanned())
		}

		this.start_timer()
		//update html button
		this.updatebutton.className="default-button-deactivated"
		this.startbutton.innerHTML=`Stop Scan&nbsp <img class="white-icon" src="Assets/icons/square.svg">`
	}
	/**
	 * Performs this actions:
	 * - save the last stop timestamp in the AW database
	 * - saves the previous scanned time in AW db from this.scanned_time
	 * - notify to the user that the scan has ended
	 */
	async stop_scan(){
		this.log.info("** Pausing scan")
		var res=await this.my2secApiClient.stopWatchers();
		this.log.info(res)
		await this.producerBucketClient.set_last_stop(this.get_current_timestamp())
		await this.producerBucketClient.set_scanned_time(this.get_time_scanned())
		//var eventsArr= await this.producerBucketClient.get_all_producer_events();
		//console.log(eventsArr)

		this.log.info("Scanned: "+this.get_time_scanned()+"s")
		this.updatebutton.className="default-button"
        this.startbutton.innerHTML=`Resume Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
	}
	/**
	 * Collects the scanned time from Aw db and updates the control panel accordingly
	 */
	async init_update_button(){
		var time_scanned = await this.producerBucketClient.get_scanned_time();
		//console.log(time_scanned)
		if(time_scanned!=0 && time_scanned!=null){
			//riprendi da pausa
			this.log.debug("Init update button: Resume from pause")
			this.updatebutton.className="default-button"
			//this.explorerbutton.className="default-button-deactivated"
			this.startbutton.innerHTML=`Resume Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
			var string=this.secondsToTimeString(time_scanned);
			this.timerSpan.innerHTML="Scanned: <b>"+string+"</b>"
		
		}else{
			//nuovo scan
			this.log.debug("Init update button: Start new scan")
			this.updatebutton.className="default-button-deactivated"
			//this.explorerbutton.className="default-button-deactivated"
			this.startbutton.innerHTML=`Start Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
		}
	}

	/**
	 * Starts a timer synchronized with the private variable this.scan_running.
	 * Check is scan is running with this.is_scan_running()
	 */
	async start_timer(){
		this.log.info("Starting timer")
		var prevDate=new Date();
		while(this.is_scan_running()){

			//1 Get delta
			var now=new Date()
			//var prev=this.get_last_start();
			var ms=now.getTime()-prevDate.getTime();
			var deltaSeconds=ms/1000
			prevDate=now;//update prevdate
			//this.log.trace("Delta: "+deltaSeconds)

			//2 aggiorna time scanned
			this.increment_time_scanned(deltaSeconds)
			var seconds=Math.floor(this.get_time_scanned())

			//3 calcola stringa del tempo
			var string=this.secondsToTimeString(seconds)

			//4 aggiorna span
			this.timerSpan.innerHTML="Scanned: <b>"+string+"</b>"
			await this.wait("1000")

		}
		this.log.info("Timer stopped")
	}


	//------------------------------------GETTERS-----------------------------------
	is_scan_running(){
		return this.scan_running;
	}

	async get_last_start_event(){
		var last_start=await this.producerBucketClient.get_last_start_event();
		return last_start;
	}
	async get_last_update_event(){
		var last_start=await this.producerBucketClient.get_last_update_event();
		return last_start;
	}
	get_last_start(){
		return this.last_start;
	}
	get_time_scanned(){
		return this.time_scanned;
	}


	//------------------------------------SETTERS-----------------------------------
	set_last_start(time){
		this.last_start=time;
	}
	set_scan_status(status){
		this.scan_running=status;
	}
	set_time_scanned(time){
		this.time_scanned=time
	}
	increment_time_scanned(seconds){
		this.time_scanned=this.time_scanned+seconds
	}

	
	//------------------------------------UTILITIES-----------------------------------
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