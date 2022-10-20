// main.js
// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  //---FILTER KEYCLOAK----------
  const {session: {webRequest}} = mainWindow.webContents;
  const filter = {
    urls: [
      'http://localhost/keycloak-redirect*'
    ]
  };
  webRequest.onBeforeRequest(filter, async ({url}) => {
    const params = url.slice(url.indexOf('#'));
    mainWindow.loadURL('file://' + path.join(__dirname, 'index.html') + params);
  });



}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

 // init_router()

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})





// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.









//SNEAKY BOY
//---------------------------
console.log("#============#")
console.log("# SNEAKY BOY #")
console.log("#============#")

const http = require('http');
const express = require('express');


test_datasource();  


//CREATE APP
const awApiRouter = express();
//YEAH FUCK IT BITCH
//app.use(cors());
awApiRouter.use(express.json());

awApiRouter.get('/api/*', (request, response) => { //listen to all requests
    console.log(`received AW buckets api request: ${request.originalUrl}`)
    //console.log(get_time()+` [info] received AW API request: (${request.path})`);

    //CREATE HTTP REQUEST FOR THE API
    var host_name="localhost";
    var http_port=5600;
    var reqpath=request.originalUrl;
    //var response=await get(host_name,http_port,reqpath);
    get(host_name,http_port,reqpath).then((data)=>{
        console.log(data)
        response.json(JSON.parse(data));
    });

});


awApiRouter.post('/api/*', (request,response)=>{
    //CREATE HTTP REQUEST FOR THE API
    var host_name="localhost";
  var http_port=5600;
  var reqpath=request.originalUrl;
  const reqdata=JSON.stringify(request.body);
  //var response=await get(host_name,http_port,reqpath);
  post(host_name,http_port,reqpath,reqdata).then((data)=>{
    console.log(data)
    response.json(JSON.parse(data));    
  });
});


awApiRouter.delete('/api/*', (request,response)=>{
    //const data=request.body;
    //consoleLog(0,"performing DELETE request to "+request.path)
    //CREATE HTTP REQUEST FOR THE API
    var host_name="localhost";
  var http_port=5600;
  var reqpath=request.originalUrl;
  //var response=await get(host_name,http_port,reqpath);
  http_delete(host_name,http_port,reqpath).then((data)=>{
    console.log(data)
    response.json(JSON.parse(data));    
  });
});






//---------------------------------------
//USER FUNCTIONS
async function test_datasource(){
  console.log("TESTING DATASOURCE: preflight...")
  var host_name="localhost";
  var http_port=5600;
  var reqpath="/api/0/buckets/"
  //console.log("sending get request")
  //var response=await get(host_name,http_port,reqpath);
  get(host_name,http_port,reqpath).then((data)=>{
    console.log("DATASOURCE: OK!\n")    
  });
  //console.log(String(response))
}




function http_delete(host_name,http_port,reqpath){
  //CREATE HTTP REQUEST FOR THE API
  const options = {
      hostname: host_name,
      port: http_port,
      path: reqpath, //`${request.path}`, //forward the path to the api
      method: 'DELETE',
      headers: {
            'Content-Type': 'application/json',
            'Connection': 'close',
        },
  }; 

  return new Promise(resolve=>{
    const req = http.request(options, res => {
        //console.log(`forwarded request to ${options.path}, statusCode: ${res.statusCode}`);
        res.on('data', d => {
            resolve(d)
        });
    });
    req.setHeader("Connection","close");
    //CATCH ERRORS
    req.on('error', error => {
        console.error(error);
    });
    req.end();    
  })
  
}



function post(host_name,http_port,reqpath,data){
  //CREATE HTTP REQUEST FOR THE API
  const options = {
      hostname: host_name,
      port: http_port,
      path: reqpath, //`${request.path}`, //forward the path to the api
      method: 'POST',
      headers: {
            'Content-Type': 'application/json',
            'Connection': 'close',
        },
  }; 

  return new Promise(resolve=>{
    const req = http.request(options, res => {
      res.on('data', d => {
        resolve(d);
      });
    });
    //CATCH ERRORS
    req.on('error', error => {
        console.error(error);
    });
    req.write(data);
    req.end();    
  })
  
}




function get(host_name,http_port,reqpath){
  //CREATE HTTP REQUEST FOR THE API
  const options = {
      hostname: host_name,
      port: http_port,
      path: reqpath, //`${request.path}`, //forward the path to the api
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'close',
      },
  }; 

  return new Promise(resolve=>{
    const req = http.request(options, res => {
        //console.log(`forwarded request to ${options.path}, statusCode: ${res.statusCode}`);
        var str='';
        res.on('data', d => {
            str=str+d;
        });

        res.on('end', ()=>{
            resolve(str)
        })

    });

    req.setHeader("Connection","close");
    //CATCH ERRORS
    req.on('error', error => {
        console.error(error);
    });
    req.end();    
  })
  
}







//-----------------------------------------------------------------------------------------------------
//LISTEN TO REQUESTS
awApiRouter.listen(1340, () => {
    console.log('server is listening on port 1340');
});

