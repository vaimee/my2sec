const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
    loginsuccess: (userdata) => ipcRenderer.invoke('loginsuccess',userdata),
    request_jsap: () => ipcRenderer.invoke('request_jsap')
  // we can also expose variables, not just functions
})
