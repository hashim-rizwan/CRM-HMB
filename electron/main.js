const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    const serverPath = path.join(__dirname, '../app/.next/standalone/server.js')
    const server = spawn('node', [serverPath], {
      env: { ...process.env, PORT: '3000' },
      cwd: path.join(__dirname, '../app/.next/standalone'),
    })
    
    server.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
    })
    
    server.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`)
    })
    
    server.on('error', (error) => {
      console.error('Failed to start server:', error)
    })
    
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000')
    }, 2000)
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

