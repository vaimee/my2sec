class keycloakClient {
    constructor(config) {
      this.hostname = config.hostname;
      this.realm = config.realm;
      this.client_id = config.client_id;
      this.client_secret = config.client_secret;
      this.access_token="";
    }

    //USER INFO
    async get_user_info(){
        //"https://keycloak.vaimee.org/auth/realms/My2Sec%20-%20realm/protocol/openid-connect/userinfo"
        var url=this.hostname+"/auth/realms/"+this.realm+"/protocol/openid-connect/userinfo"
        var user_info_json=await this.auth_post(url,"{}","application/x-www-form-urlencoded")
        console.log("keycloak-client: user info fetched correctly")
        return user_info_json;
    }




    //=============GET AND SET PASSWORD TOKEN=====================================
    async set_passwordAccessToken(config){
        var data=this.password_encode(config)
        var url=this.hostname+"/auth/realms/"+this.realm+"/protocol/openid-connect/token"
        //var url="https://keycloak.vaimee.org/auth/realms/My2Sec%20-%20realm/protocol/openid-connect/token"
        //console.log("mao")
        var token=await this.post(url,data,"application/x-www-form-urlencoded")
        //console.log(token)
        this.access_token=JSON.parse(token).access_token;
        console.log("keycloak-client: fetched access token correctly")
    }

    password_encode(config){
        var field1="client_id="+this.client_id;
        var field2="client_secret="+this.client_secret;
        var field3="username="+config.username;
        var field4="password="+config.password;
        //field3="scope="+config.scope;
        var field5="grant_type="+config.grant_type;
        var data=field1+"&"+field2+"&"+field3+"&"+field4+"&"+field5;
        return data;
    }  

    //============POST AND AUTH POST===================//
    auth_post(url,data,content_type){
        var access_token=this.access_token
        //console.log("UBUBUBUBUBUBB: "+access_token)
        return new Promise(resolve=>{
            var req = new XMLHttpRequest();
            req.addEventListener('loadstart', ()=>{
                console.log("keycloak-client: POST "+url)
                console.log("post data: "+data)
            });
            req.addEventListener('error', ()=>{console.log(req.responseText)});
            req.open("POST", url, true);
            //Send the proper header information along with the request
            req.setRequestHeader("Content-Type", content_type);
            req.setRequestHeader("Authorization", "Bearer "+access_token);
            req.onreadystatechange = function() {// Call a function when the state changes.
                //console.log("questo viene chiamato comunque")
                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                    // Request finished. Do processing here.
                    console.log("keycloak-client: auth post completed")
                    resolve(req.responseText);
                }else{
                    if(this.readyState === XMLHttpRequest.DONE && this.status === 201){
                        console.log("keycloak-client: auth post completed, status 201")
                        resolve(req.responseText);  
                    }else{
                        if(this.status === 409){
                            console.log("error: user already exists")
                            document.getElementById("createuser_error_message").innerHTML="Error: user already exists"
                            throw new Error("Error: user already exists")
                            
                            //resolve(req.responseText);
                        }
                    }
                }
            }
            req.send(data);	
        });
    }

    post(url,data,content_type){
        return new Promise(resolve=>{
            var req = new XMLHttpRequest();
            req.addEventListener('loadstart', ()=>{
                console.log("keycloak-client: POST "+url)}
            );
            req.open("POST", url, true);
            //Send the proper header information along with the request
            req.setRequestHeader("Content-Type", content_type);
            req.onreadystatechange = function() {// Call a function when the state changes.
                if (this.readyState != XMLHttpRequest.DONE && this.status != 200) {
                    // Request error!
                    //resolve(req.responseText);
                    //==========================
                    var errBox=document.getElementById("login_error_message");
                    var loginbutt=document.getElementById("loginbutton");
                    errBox.innerHTML=JSON.parse(req.responseText).error_description;
                    loginbutt.className="formbutton"
                    //==========================
                }else{
                    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                        // Request finished. Do processing here.
                        console.log("keycloak-client: post completed")
                        resolve(req.responseText);
                    }   
                }
            }
            req.send(data);	
        });
    }
}



//=========================
//NAME: adminKeycloakClient
//DESCRIPTION: a keycloak client with admin powers. Can create users
class adminKeycloakClient extends keycloakClient{
    //REQUIRES ADMIN TOKEN
    async post_new_user(data,realm){
        var url=this.hostname+"/auth/admin/realms/"+realm+"/users"
        //'{\"firstName\": \"gregtest\",\"lastName\": \"gregcognome\",\"email\": \"gt@gmail.com\",\"enabled\": \"true\",\"username\": \"gregtest\",\"password\": \"gregtest\"}'
        await super.auth_post(url,JSON.stringify(data),"application/json");
    }

    async set_AdminAccessToken(){
        var loginjson={
            grant_type: "password",
            username: "admin",
            password: "Gregnet/99"
        }
        await super.set_passwordAccessToken(loginjson)
    }
}




/*
async function post_new_user(config,access_token){
    var url=config.hostname+"/auth/admin/realms/"+config.realm+"/users"
    //'{\"firstName\": \"gregtest\",\"lastName\": \"gregcognome\",\"email\": \"gt@gmail.com\",\"enabled\": \"true\",\"username\": \"gregtest\",\"password\": \"gregtest\"}'
    await auth_post_raw(url,access_token,JSON.stringify(config.data));
}

function auth_post_raw(url,access_token,data){
    //console.log("UBUBUBUBUBUBB: "+access_token)
    return new Promise(resolve=>{
		var req = new XMLHttpRequest();
        req.addEventListener('loadstart', ()=>{console.log("CAZZO")});
        req.addEventListener('error', ()=>{console.log("CAZZO")});
		req.open("POST", url, true);
		//Send the proper header information along with the request
		req.setRequestHeader("Content-Type", "application/json");
        req.setRequestHeader("Authorization", "Bearer "+access_token);
		req.onreadystatechange = function() {// Call a function when the state changes.
            //console.log("questo viene chiamato comunque")
    		if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
    			// Request finished. Do processing here.
    			resolve(req.responseText);
			}
		}
		req.send(data);	
	});
}



//==============PASSWORD===========================
//USER INFO
async function get_user_info(config,access_token){
    //"https://keycloak.vaimee.org/auth/realms/My2Sec%20-%20realm/protocol/openid-connect/userinfo"
    var url=config.hostname+"/auth/realms/"+config.realm+"/protocol/openid-connect/userinfo"
    var user_info_json=await auth_post(url,access_token,"{}")
    return user_info_json;
}
//GET PASSWORD TOKEN
async function get_password_access_token(config){
    var data=password_encode(config)
    var url=config.hostname+"/auth/realms/"+config.realm+"/protocol/openid-connect/token"
    //var url="https://keycloak.vaimee.org/auth/realms/My2Sec%20-%20realm/protocol/openid-connect/token"
    console.log("mao")
    var token=await post(url,data)
    //console.log(token)
    return token;
}
function password_encode(config){
    field1="client_id="+config.client_id;
    field2="client_secret="+config.client_secret;
    field3="username="+config.username;
    field4="password="+config.password;
    //field3="scope="+config.scope;
    field5="grant_type="+config.grant_type;
    data=field1+"&"+field2+"&"+field3+"&"+field4+"&"+field5;
    return data;
}
function auth_post(url,access_token,data){
    //console.log("UBUBUBUBUBUBB: "+access_token)
    return new Promise(resolve=>{
		var req = new XMLHttpRequest();
        req.addEventListener('loadstart', ()=>{console.log("CAZZO")});
        req.addEventListener('error', ()=>{console.log("CAZZO")});
		req.open("POST", url, true);
		//Send the proper header information along with the request
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        req.setRequestHeader("Authorization", "Bearer "+access_token);
		req.onreadystatechange = function() {// Call a function when the state changes.
            //console.log("questo viene chiamato comunque")
    		if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
    			// Request finished. Do processing here.
    			resolve(req.responseText);
			}
		}
		req.send(data);	
	});
}



//===========CLIENT CREDENTIALS====================================
async function get_clientcred_access_token(config){
    var data=client_credentials_encode(config)
    var url=config.hostname+"/auth/realms/"+config.realm+"/protocol/openid-connect/token"
    //var url="https://keycloak.vaimee.org/auth/realms/My2Sec%20-%20realm/protocol/openid-connect/token"

    var token=await post(url,data)
    //console.log(token)
    return token;
}

function client_credentials_encode(config){
    field1="client_id="+config.client_id;
    field2="client_secret="+config.client_secret;
    field3="scope="+config.scope;
    field4="grant_type="+config.grant_type;
    data=field1+"&"+field2+"&"+field3+"&"+field4;
    return data;
}

function post(url,data){
    return new Promise(resolve=>{
		var req = new XMLHttpRequest();
		req.open("POST", url, true);
		//Send the proper header information along with the request
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.onreadystatechange = function() {// Call a function when the state changes.
    		if (this.readyState != XMLHttpRequest.DONE && this.status != 200) {
    			// Request error!
    			//resolve(req.responseText);
                //==========================
                var errBox=document.getElementById("login_error_message");
                var loginbutt=document.getElementById("loginbutton");
                errBox.innerHTML=JSON.parse(req.responseText).error_description;
                loginbutt.className="formbutton"
                //==========================
			}else{
                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                    // Request finished. Do processing here.
                    console.log("POST SUCCESS")
                    resolve(req.responseText);
                }   
            }
		}
		req.send(data);	
	});
}
*/