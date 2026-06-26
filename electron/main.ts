import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { initDatabase, registerDatabaseHandlers, closeDatabase } from './database'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0B1120',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
    },
    icon: isDev
      ? path.join(process.cwd(), 'app_icons/batchmate.png')
      : path.join(process.resourcesPath, 'app_icons/batchmate.png'),
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── Dialog handlers ──────────────────────────────────────────────

ipcMain.handle('dialog:openFile', async (_, options?: {
  filters?: { name: string; extensions: string[] }[]
  properties?: string[]
}) => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: options?.filters,
    properties: (options?.properties as any) || ['openFile'],
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:openFiles', async (_, options?: {
  filters?: { name: string; extensions: string[] }[]
}) => {
  if (!mainWindow) return []
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: options?.filters,
    properties: ['openFile', 'multiSelections'],
  })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle('dialog:saveFile', async (_, options?: {
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
}) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options?.defaultPath,
    filters: options?.filters,
  })
  return result.canceled ? null : result.filePath
})

// ── File system handlers ─────────────────────────────────────────

ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  return fs.readFileSync(filePath)
})

ipcMain.handle('fs:writeFile', async (_, filePath: string, data: Buffer | Uint8Array) => {
  fs.writeFileSync(filePath, data)
  return true
})

ipcMain.handle('fs:openExternal', async (_, filePath: string) => {
  await shell.openPath(filePath)
})

ipcMain.handle('app:getPath', async (_, name: string) => {
  return app.getPath(name as any)
})

ipcMain.handle('app:getResultSheetsDir', async () => {
  const dir = isDev
    ? path.join(process.cwd(), 'result-sheets')
    : path.join(app.getPath('userData'), 'result-sheets')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
})

// ── Excel parsing handler ────────────────────────────────────────

ipcMain.handle('excel:parse', async (_, filePath: string) => {
  const xlsxModule = await import('xlsx')
  const XLSX = xlsxModule.default || xlsxModule
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)
  const headers = Object.keys(data[0] || {})
  return { headers, data, sheetName, totalSheets: workbook.SheetNames.length }
})

// ── App lifecycle ────────────────────────────────────────────────

app.whenReady().then(async () => {
  await initDatabase()
  registerDatabaseHandlers()
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

app.on('before-quit', async () => {
  await closeDatabase()
})
