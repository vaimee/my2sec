class AwApiStartStopManager {
    constructor(){
        this.scan_started=false;
        this.time_scanned=0;
        this.currentSection=0;
        this.updatebutton=document.getElementById("update-procedure-button")
        this.explorerbutton=document.getElementById("explorer-button")
        this.startbutton=document.getElementById("start-stop-innertext")
        this.awManager= new AwClient();
    }

    async start_button(){
        try{
            if(!scan_started){
                this.currentSection=0;
                console.log("Starting scan...")
                var res= await this.awManager.startWatchers()
                console.log(res)
                await this.awManager.update_start_flag()
                updatebutton.className="default-button-deactivated"
                startbutton.innerHTML=`Stop Scan&nbsp <img class="white-icon" src="Assets/icons/square.svg">`
                explorerbutton.className="default-button"
                scan_started=true
                timer("ready_status")
            }else{
                this.currentSection=0;
                console.log("stopping scan...")
                var res=await this.awManager.stopWatchers()
                console.log(res)
                updatebutton.className="default-button"
                startbutton.innerHTML=`Resume Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
                scan_started=false
            }
        }catch(e){
            console.log(e)
            change_update_status(2)
        }
    }


}


//###################
//# START-STOP SCAN #
//###################
//update ia knowledge
var currentSection=0;
var scan_started=false;
var time_scanned=0;
var updatebutton=document.getElementById("update-procedure-button")
var explorerbutton=document.getElementById("explorer-button")
var startbutton=document.getElementById("start-stop-innertext")
async function start_button(){
	try{
		if(!scan_started){
			currentSection=0;
			console.log("Starting scan...")
			var res= await awManager.startWatchers()
			console.log(res)
			await awManager.update_start_flag()
			updatebutton.className="default-button-deactivated"
			startbutton.innerHTML=`Stop Scan&nbsp <img class="white-icon" src="Assets/icons/square.svg">`
			explorerbutton.className="default-button"
			scan_started=true
			timer("ready_status")
		}else{
			currentSection=0;
			console.log("stopping scan...")
			var res=await awManager.stopWatchers()
			console.log(res)
			updatebutton.className="default-button"
			startbutton.innerHTML=`Resume Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
			scan_started=false
		}
	}catch(e){
		console.log(e)
		change_update_status(2)
	}
}
async function init_update_button(){
	var start_event=await awManager.get_producer_event("last_start")
	if(Object.keys(start_event).length===0){
		console.log("Start event does not exist")
		updatebutton.className="default-button-deactivated"
		explorerbutton.className="default-button-deactivated"
		startbutton.innerHTML=`Start Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
	}else{
		console.log("Fetched Start Event: "+start_event.data.last_start)
		var update_event=await awManager.get_producer_event("last_update")
		if(Object.keys(update_event).length===0){
			console.log("start event exists but no update has ever been made")
			updatebutton.className="default-button"
			explorerbutton.className="default-button"
			startbutton.innerHTML=`Resume Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
		}else{
			console.log("Fetched Update Event: "+update_event.data.last_update)
			if(new Date(start_event.data.last_start)<new Date(update_event.data.last_update)){
				console.log("NUOVO START")
				updatebutton.className="default-button-deactivated"
				explorerbutton.className="default-button-deactivated"
				startbutton.innerHTML=`Start Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
			}else{
				console.log("RIPRENDI DA PAUSA")
				updatebutton.className="default-button"
				explorerbutton.className="default-button"
				startbutton.innerHTML=`Resume Scan&nbsp <img class="white-icon" src="Assets/icons/play-outline.svg">`
			}
		}
		//await awManager.update_event("{ \"timestamp\": \""+get_current_timestamp()+"\", \"duration\": 0, \"data\": {\"last_update\":\""+get_current_timestamp()+"\"} }")
	}
}