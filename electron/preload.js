const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  backup: {
    saveDialog: () => ipcRenderer.invoke('backup:save-dialog'),
    writeFile: (filePath, data) => ipcRenderer.invoke('backup:write-file', filePath, data),
    openDialog: () => ipcRenderer.invoke('backup:open-dialog'),
  },
  isElectron: true,
})

