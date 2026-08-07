import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, extname } from 'path'
import { is } from '@electron-toolkit/utils'
import { initDatabase } from './database'
import { registerProductosHandlers } from './ipc/productos'
import { registerVentasHandlers } from './ipc/ventas'
import { registerClientesHandlers } from './ipc/clientes'
import { registerReportesHandlers } from './ipc/reportes'
import { registerConfigHandlers } from './ipc/config'
import { registerBasculaHandlers } from './ipc/bascula'
import { registerInventarioHandlers } from './ipc/inventario'
import { existsSync, mkdirSync, copyFileSync, readdirSync, unlinkSync } from 'fs'

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    title: 'SmartPOS',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('app:getUserDataPath', () => app.getPath('userData'))

  initDatabase()
  registerProductosHandlers()
  registerVentasHandlers()
  registerClientesHandlers()
  registerReportesHandlers()
  registerConfigHandlers()
  registerInventarioHandlers()
  registerBasculaHandlers((channel, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data)
    }
  })

  ipcMain.handle('dialog:openImage', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('image:copiar', (_, sourcePath) => {
    const imagesDir = join(app.getPath('userData'), 'imagenes')
    if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true })
    const ext = extname(sourcePath)
    const filename = `${Date.now()}${ext}`
    copyFileSync(sourcePath, join(imagesDir, filename))
    return filename
  })

  ipcMain.handle('caja:abrir', async () => {
    const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } })
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{margin:0;size:80mm 1mm}body{margin:0}</style></head><body> </body></html>`
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    await new Promise((resolve) => win.webContents.on('did-finish-load', resolve))
    win.webContents.print({ silent: true, printBackground: false }, () => win.destroy())
    return { ok: true }
  })

  ipcMain.handle('ticket:imprimir', async (_, htmlContent) => {
    const win = new BrowserWindow({
      show: false,
      webPreferences: { contextIsolation: true }
    })
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
    await new Promise((resolve) => win.webContents.on('did-finish-load', resolve))
    win.webContents.print({ silent: false, printBackground: true }, () => {
      win.destroy()
    })
    return { ok: true }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function hacerRespaldo() {
  try {
    const userDataPath = app.getPath('userData')
    const dbPath = join(userDataPath, 'pos.db')
    if (!existsSync(dbPath)) return

    const backupDir = join(userDataPath, 'backups')
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })

    const now = new Date()
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`
    copyFileSync(dbPath, join(backupDir, `pos_${ts}.db`))

    // Conservar solo los últimos 10 respaldos
    const archivos = readdirSync(backupDir)
      .filter((f) => f.startsWith('pos_') && f.endsWith('.db'))
      .sort()
    if (archivos.length > 10) {
      archivos.slice(0, archivos.length - 10).forEach((f) => {
        try { unlinkSync(join(backupDir, f)) } catch (_) {}
      })
    }
  } catch (_) {}
}

app.on('before-quit', hacerRespaldo)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
