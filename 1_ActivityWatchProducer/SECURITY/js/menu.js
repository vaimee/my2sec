document.getElementById("loginform").addEventListener('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        //alert("validato")
        document.getElementById("loginbutton").className="formbutton_selected";
        tryLogin()
    }
});


var view=0;

function switch_view(){
    if(view==0){
        view=1;
        document.getElementById("loginform-wrapper").style.display="none";
        document.getElementById("createuserform-wrapper").style.display="block";
        console.log("Showing create user form")
        init_user_form()
    }else{
        view=0;
        document.getElementById("loginform-wrapper").style.display="block";
        document.getElementById("createuserform-wrapper").style.display="none";
    }

}


async function init_user_form(){
    //GET JSAP
    const string_jsap_package=await window.versions.request_jsap()
    const jsap_package=JSON.parse(string_jsap_package)
    const jsap=jsap_package["my2sec_jsap"]
    //GET PROFESSIONS
    const professions=await get_all_available_professions(jsap)
    //INIT FORM
    print_professions_in_form(professions)
}

async function get_all_available_professions(jsap){
    var workerTypesConsumer= new WorkerTypesConsumer(jsap);
    //this.workerTypeProducer= new WorkerTypeProducer(jsap)
    var workerTypes= await workerTypesConsumer.querySepa();  
    return workerTypes;
}

function print_professions_in_form(workerTypes){
    console.log(workerTypes)
    var worker_type_selection=document.getElementById("worker_type_selection");

    var selection="";

    for(var i in workerTypes){
        var profession= workerTypes[i].profession_type.split("#")[1].trim();
        selection=selection+`<option value="${workerTypes[i].uuid}">${profession}</option>`
    }

    worker_type_selection.innerHTML=selection;

}

