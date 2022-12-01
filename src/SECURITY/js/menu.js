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
    }else{
        view=0;
        document.getElementById("loginform-wrapper").style.display="block";
        document.getElementById("createuserform-wrapper").style.display="none";
    }

}