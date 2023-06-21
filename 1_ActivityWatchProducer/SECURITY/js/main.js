/*--------------------------------------------
|| MAIN.js OF MY2SEC- keycloak login interface
|| DESCRIPTION: handles login and user creation
----------------------------------------------*/
/*
keycloak_loginApp_config={//CONFIGURE AUTH SERVER HOST, REALM and CLIENT
    hostname: "https://keycloak.vaimee.org",
    realm:"My2Sec%20-%20realm",
    client_id: "my2sec-awproducer-clientcred",
    client_secret:"V5unAD2LkJfSyxzrdV8pVYW3LvAdYxwh",
}
*/
keycloak_loginApp_config={//CONFIGURE AUTH SERVER HOST, REALM and CLIENT
    hostname: "https://keycloak.vaimee.org",
    realm:"my2sec-realm",
    client_id: "my2sec-awproducer",
    client_secret:"kCghmHxnDabK5c4VTgVmGXyPnOynDWQk",
}
keycloak_createUserApp_adminConfig={//CONFIGURE ADMIN CLIENT FOR USER CREATION
    hostname: "https://keycloak.vaimee.org",
    realm:"master",
    client_id: "admin-cli",
    client_secret:"rFGrvQe5mQgQ95HjeU8f6Sw6LDI7MKib",
}

//===========
//LOGIN USER
//called when the user fills the login form and presses the login button (or enter)
async function tryLogin(){
    //GET LOGIN INFO
    var loginform=document.getElementById('loginform')
    const loginjson={
        username: loginform.username.value,
        password: loginform.password.value,
        grant_type: "password",
        scope: "email"
    }
    console.log("Trying to login as "+loginjson.username)

    //CREATE CLIENT
    var my2secLoginApp= new keycloakClient(keycloak_loginApp_config);
    //init login with password flow
    await my2secLoginApp.set_passwordAccessToken(loginjson);
    //get user info from api
    var userinfo=await my2secLoginApp.get_user_info();
    //SEND INFO TO IPC
    window.versions.loginsuccess(userinfo)
}




//============
//CREATE USER
//createUser()
async function tryCreateUser(){
    var errorbox=document.getElementById("createuser_error_message")
    var successbox=document.getElementById("createuser_success_message")
    console.log("# CREATING ADMIN CLIENT #")
    var my2secCreateUserApp = new adminKeycloakClient(keycloak_createUserApp_adminConfig)
    //GET ADMIN ACCESS TOKEN
    console.log("# GETTING ACCESS TOKEN #")
    await my2secCreateUserApp.set_AdminAccessToken();

    //CREATE NEW USER
    console.log("# CREATING NEW USER #")
    var createUserForm=document.getElementById("createuserform");
    
    if(createUserForm.create_password.value==createUserForm.confirm_password.value){

        var worker_profession=createUserForm.worker_type_selection.value;

        var data={
            firstName: createUserForm.firstName.value,
            lastName: createUserForm.lastName.value,
            email: createUserForm.userEmail.value,
            enabled: "true",
            username: createUserForm.create_username.value,
            credentials:[{
                type:"password",
                value: createUserForm.create_password.value,
                temporary:false
            }],
        }
        
        var success=false;
        try{
            await my2secCreateUserApp.post_new_user(data,keycloak_loginApp_config.realm)
            successbox.innerHTML="User "+createUserForm.create_username.value+" created!"
            switch_view()
            errorbox.innerHTML=""
            success=true;
        }catch(e){
            console.log(e)
            return
        }    
        if(!success){
            errorbox.innerHTML="Error creating user: already exists"
            return;
        }
        

        //?CREATE USER LINK TO PROFESSION
        //CREATE NEW USER
        console.log("# ADDING PROFESSION LINK #")
        await create_user_link_to_profession(data.email,worker_profession)
        
        
    }else{
        errorbox.innerHTML="Passwords do not correspond"
    }


}



async function create_user_link_to_profession(userEmail,profession_uuid){
    const string_jsap_package=await window.versions.request_jsap()
    const jsap_package=JSON.parse(string_jsap_package)
    const jsap=jsap_package["my2sec_jsap"]
    console.log(userEmail);
    console.log(profession_uuid)
    var workerTypeProducer= new WorkerTypeProducer(jsap);
    await workerTypeProducer.updateSepa({
        usergraph:"http://www.vaimee.it/my2sec/"+userEmail,
        profession_uuid:profession_uuid
    })
}


//switch_view()
