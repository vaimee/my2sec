//================================
// ELECTRON: main.js
// Controls the main node process
//================================
//DETECT IF APP IS RUNNING IN DEVELOPMENT OR PRODUCTION

//var runMode = process.env.NODE_ENV;
//console.log(runMode)

// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')
const {ipcMain} = require('electron')
log=require('electron-log');
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => __dirname + "/log.log";
//const isDev = require('electron-is-dev');
//Custom modules
const AwApiRouter = require("./electron_main_modules/AwApiRouter");
const PythonApiRunner = require("./electron_main_modules/PythonApiRunner");
const MongoDbRouter = require("./electron_main_modules/MongoDbRouter");
const JsapConfigurationManager = require("./electron_main_modules/JsapConfigurationManager");

/*===============
## APP WINDOWS
===============*/
//GLOBAL VARIABLES
var json_package={};
// Create the browser window.
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    show: false,
    //fullscreen: true,
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, './SECURITY/preload2.js')
    }
  })
  ipcMain.handle('request_user_credentials', () => JSON.stringify(json_package))
  mainWindow.setMenuBarVisibility(false)
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  })
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}
// Create LoginWindow.
const createLoginWindow = () => {
  loginWindow = new BrowserWindow({
    show: false,
    //frame: false,
    width: 360,
    height: 580,
    webPreferences: {
      preload: path.join(__dirname, './SECURITY/preload.js')
    }
  })
  ipcMain.handle('loginsuccess', async (event, arg) => {
    handleLoginSuccess(arg);
  })
  loginWindow.setMenuBarVisibility(false)
  // and load the index.html of the app.
  loginWindow.loadFile('./SECURITY/index_1.html')
  loginWindow.once('ready-to-show', () => {
    loginWindow.show()
  })
}

function handleLoginSuccess(arg){
  console.log(arg)
  //user_login_json=arg; //set user_login_json
  json_package["user_login_json"]=JSON.parse(arg);
  //delete login window
  loginWindow.close();
  createWindow();
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  
  try{
    console.log("CLEANING OLD LOG FILE")
    await saveToFile( __dirname +"/log.log","")
    console.log("FILE CLEANED")
  }catch(e){
    console.log("FILE DOES NOT EXIST. THIS IS NOT AN ERROR AND IS INTENDED")
    console.log(e)
  }

  log.info("[ My2secProducer logs ]")
  //INITIALIZE CONFIGURATION MANAGER
  //This will detect if the host machine uses ipv6 or is windows/darwin and change the requests urls accordingly.
  //FIND JSAP
  /*var relativePath="";
  if(isDev){
    relativePath="./Resources/my2sec_7-3-2023.jsap"
  }else{
    if (process.platform == 'darwin'){
      relativePath="./Content/Resources/app/Resources/my2sec_7-3-2023.jsap"
    }else{
      relativePath="./resources/app/Resources/my2sec_7-3-2023.jsap"
    }
  }*/

  var jsapPath= __dirname + "/Resources/my2sec_7-3-2023.jsap"
  //var jsapPath=path.resolve(relativePath);
  let jsapConfigurationManager = new JsapConfigurationManager(jsapPath,log);//"./Resources/my2sec_7-3-2023.jsap");
  var my2sec_jsap=await jsapConfigurationManager.getConfiguredJsap();
  json_package["my2sec_jsap"]=my2sec_jsap;
  //INITIALIZE REST OF THE MODULES
  initMainElectronModules()

  createLoginWindow()

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




//-------------------------------------------------------------------------------------------------------------
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
async function initMainElectronModules(){
  //INITIALIZE AWAPIROUTER
  //This router takes http requests from the frontend and forwards them to activitywatch.
  //Connection close headers are added to requests in order to fix an aw bug
  var activitywatch_url=json_package["my2sec_jsap"].extended.AwProducer.endpoints.ActivityWatch;
  var arr=split_url(activitywatch_url);
  //console.log(arr)
  var aw_host=arr[0];//"localhost";
  var aw_port=arr[1];//5600;
  var aw_router_port=1340;
  let awApiRouter = new AwApiRouter(aw_host,aw_port,aw_router_port,log);
  awApiRouter.start();
  log.info("- AwApiRouter started")   

  let pythonApiRunner = new PythonApiRunner(log);
  pythonApiRunner.start();
  log.info("- Python api started")   


  var mongodb_uri=json_package["my2sec_jsap"].extended.AwProducer.endpoints.MongoDb;//"mongodb://root:Gregnet-99@dld.arces.unibo.it:27017/"
  var database="my2sec_aw_messages"
  var collection="test"
  var mongodb_router_port=1341
  let mongoDbRouter = new MongoDbRouter(mongodb_uri,database,collection,mongodb_router_port)
  mongoDbRouter.start();
  log.info("- MongoDbClient started")  
}


function split_url(url){
  var string=url.split("//")[1]
  log.info(string)
  if(string.includes("[") && string.includes("]")){
    var tempArr=string.split("]");
    var dirtyport=tempArr[1];
    var splitArr=[];
    splitArr[0]=tempArr[0]+"]"
    if(dirtyport.startsWith(":")){
      log.info(dirtyport)
      if(dirtyport.endsWith("/")){
        splitArr[1]=dirtyport.slice(1,dirtyport.length-1)
      }else{
        splitArr[1]=dirtyport.slice(1,dirtyport.length)
      }
      return splitArr
    }else{
      throw new Error("loopback address parse error")
    }
  }else{
    var splitArr=string.split(":");
    return splitArr
  }
}



function saveToFile(filename,string){
  var fs = require('fs');
  return new Promise(resolve=>{
    fs.writeFile(filename, string, function (err) {
      if (err) return console.log(err);
      //console.log('FILE SAVED');
      resolve("FILE SAVED")
    });
  })
}
