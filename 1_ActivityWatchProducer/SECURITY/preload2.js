const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
    request_user_credentials: () => ipcRenderer.invoke('request_user_credentials')
  // we can also expose variables, not just functions
})