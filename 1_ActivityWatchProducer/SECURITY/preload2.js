const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
    request_user_credentials: () => ipcRenderer.invoke('request_user_credentials')
    //request_user_credentials: () => ipcRenderer.invoke('request_json_package')
  // we can also expose variables, not just functions
})