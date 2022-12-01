const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
    loginsuccess: (userdata) => ipcRenderer.invoke('loginsuccess',userdata)
  // we can also expose variables, not just functions
})