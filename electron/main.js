const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
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

// Helper function to check if path is on external/removable drive
function isExternalDrive(filePath) {
  try {
    const platform = process.platform
    const normalizedPath = path.normalize(filePath)
    
    if (platform === 'win32') {
      // On Windows, check if drive is removable
      const drive = normalizedPath.substring(0, 2).toUpperCase() // e.g., "D:"
      const drives = require('child_process').execSync('wmic logicaldisk get name,drivetype', { encoding: 'utf8' })
      const driveLines = drives.split('\n').filter(line => line.trim())
      
      for (let i = 1; i < driveLines.length; i++) {
        const parts = driveLines[i].trim().split(/\s+/)
        if (parts.length >= 2 && parts[0].toUpperCase() === drive) {
          const driveType = parseInt(parts[parts.length - 1])
          // Drive type 2 = Removable, 3 = Fixed, 4 = Network, 5 = CD-ROM
          return driveType === 2 || driveType === 5
        }
      }
      return false
    } else if (platform === 'darwin') {
      // On macOS, check if path is in /Volumes (external drives)
      return normalizedPath.startsWith('/Volumes/') && !normalizedPath.startsWith('/Volumes/Macintosh HD')
    } else {
      // On Linux, check if path is in /media or /mnt (common external drive mount points)
      return normalizedPath.startsWith('/media/') || normalizedPath.startsWith('/mnt/')
    }
  } catch (error) {
    console.error('Error checking external drive:', error)
    return false
  }
}

// IPC handlers for backup/restore
ipcMain.handle('backup:save-dialog', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Backup File to External Drive',
    defaultPath: `haqeeq-marbles-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['showOverwriteConfirmation'],
    message: 'Please select an external drive to save the backup file'
  })

  if (canceled || !filePath) {
    return { canceled: true }
  }

  // Check if path is on external drive
  if (!isExternalDrive(filePath)) {
    return { 
      canceled: false, 
      error: 'Backup files can only be saved to external storage devices. Please select a location on an external drive.',
      filePath: null
    }
  }

  return { canceled: false, filePath }
})

ipcMain.handle('backup:write-file', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data, 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Error writing backup file:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('backup:open-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Backup File from External Drive',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile'],
    message: 'Please select a backup file from an external drive'
  })

  if (canceled || !filePaths || filePaths.length === 0) {
    return { canceled: true }
  }

  try {
    const filePath = filePaths[0]
    
    // Check if path is on external drive
    if (!isExternalDrive(filePath)) {
      return { 
        canceled: false, 
        error: 'Backup files can only be restored from external storage devices. Please select a file from an external drive.',
        data: null
      }
    }
    
    const data = fs.readFileSync(filePath, 'utf8')
    return { canceled: false, data }
  } catch (error) {
    console.error('Error reading backup file:', error)
    return { canceled: false, error: error.message, data: null }
  }
})

