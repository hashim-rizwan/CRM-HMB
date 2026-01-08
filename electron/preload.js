const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  // Add any exposed APIs here if needed
})

