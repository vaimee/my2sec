class AccountPanelManager{
    constructor(jsap,userInfoConsumer){
        this.log=new GregLogs()
        this.userInfoConsumer=userInfoConsumer
		this.activityTypesConsumer= new ActivityTypesConsumer(jsap,userInfoConsumer.usermail)
		//var activityTypes= await activityTypesConsumer.querySepa();
		//this.log.debug("ACTIVITY TYPES")
		//this.log.debug(activityTypes)
        this.workerTypesConsumer= new WorkerTypesConsumer(jsap);
		this.workerTypeProducer= new WorkerTypeProducer(jsap)
		/*await workerTypeProducer.updateSepa({
			usergraph:"",
			profession_uuid:""
		});*/
        this.panelShown=false;
    }


    on_account_button_pressed(){
        if(!this.panelShown){
            this.panelShown=true
            this.get_account_panel_div().style.display="block"
            this.init_account_panel()
            this.get_user_menu_icon().style="transform:rotate(60deg);"
        }else{
            this.panelShown=false
            this.get_account_panel_div().style.display="none"
            this.get_user_menu_icon().style="transform:rotate(90deg);"
        }

    }

    async init_account_panel(){
        var worker_type=await this.activityTypesConsumer.querySepa();
        this.log.debug(worker_type)
        worker_type=worker_type[0].profession_type.split("#")[1]

        this.get_account_panel_body().innerHTML= `
        <div>
            Username: <b>${_userInfoConsumer.userName}</b>
            <br>
            <div id="account_panel_worker_type">
            Worker Type: <b>${worker_type}</b>
            <button id="modify_worker_button" onclick="on_modify_worker_button_pressed()">Modify</button>
            </div>
        </div>
        `
    }

    async on_modify_worker_button_pressed(){
        var workerTypes= await this.workerTypesConsumer.querySepa();
        this.log.debug(workerTypes)

        var selection="";

        for(var i in workerTypes){
            var profession= workerTypes[i].profession_type.split("#")[1].trim();
            selection=selection+`<option value="${workerTypes[i].uuid}">${profession}</option>`
        }

        //selection=selection+`<option value="${cat}">${cat}</option>`

        var body=`
        <select name="worker_type_selection" id="worker_type_selection" onchange="on_worker_type_selection_change()">
            ${selection}
        </select>
        `

        this.get_account_panel_worker_type().innerHTML=`
        Worker Type: <b>${body}</b>
        <button id="set_worker_button" onclick="on_set_worker_button_pressed()">Set</button>
        <button id="cancel_worker_button" onclick="on_cancel_worker_button_pressed()">Cancel</button>
        `
    }

    async on_set_worker_button_pressed(){
        var changed=document.getElementById(`worker_type_selection`)
		console.log(changed.innerHTML)
		console.log(`Changed worker type: ${changed.value}`)
        
        var profession_uuid=changed.value


        await this.workerTypeProducer.updateSepa({
            usergraph:"http://www.vaimee.it/my2sec/"+this.userInfoConsumer.usermail,
            profession_uuid:profession_uuid
        })
        await this.on_cancel_worker_button_pressed()

    }

    async on_cancel_worker_button_pressed(){
        var worker_type=await this.activityTypesConsumer.querySepa();
        this.log.debug(worker_type)
        worker_type=worker_type[0].profession_type.split("#")[1]
        this.get_account_panel_worker_type().innerHTML=`
        Worker Type: <b>${worker_type}</b>
        <button id="modify_worker_button" onclick="on_modify_worker_button_pressed()">Modify</button>
        `
    }


    get_account_panel_body(){
        return document.getElementById("account_panel_body")
    }

    get_account_panel_div(){
        return document.getElementById("account_panel")
    }

    get_user_menu_icon(){
        return document.getElementById("user-account-menu-icon")
    }

    get_account_panel_worker_type(){
        return document.getElementById("account_panel_worker_type")
    }


}