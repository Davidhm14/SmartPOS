import { ipcMain } from 'electron'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { getDb } from '../database'

let port = null
let lastWeight = null
let _sendToRenderer = null

function parseWeight(raw) {
  const line = raw.replace(/[^\x20-\x7E]/g, '').trim()
  if (!line) return null

  // Extract numeric value — handles most scale formats:
  // "ST,GS,+  1.250 kg"  (CAS/Epson)
  // "+001.250 kg"
  // "  1.250 kg"
  // "1250 g"
  // "1.250"
  const match = line.match(/[+-]?\s*(\d+\.?\d*)/)
  if (!match) return null

  let value = parseFloat(match[1])
  if (isNaN(value)) return null

  // Convert grams to kg if unit is 'g' (not 'kg')
  const lc = line.toLowerCase()
  if (lc.includes(' g') && !lc.includes('kg')) value = value / 1000

  // Stability: most scales prefix unstable readings with 'US', 'D', or '?'
  const estable = !/\b(us|ud|d\s|mov|\?)/i.test(line)

  return { peso: Math.max(0, value), estable, raw: line }
}

function conectarPuerto(path, baudRate) {
  if (port) {
    try { port.close() } catch (_) {}
    port = null
  }

  return new Promise((resolve) => {
    try {
      const sp = new SerialPort({ path, baudRate: Number(baudRate) || 9600, autoOpen: false })

      sp.open((err) => {
        if (err) return resolve({ ok: false, error: err.message })

        const parser = sp.pipe(new ReadlineParser({ delimiter: '\n' }))
        parser.on('data', (data) => {
          const w = parseWeight(data)
          if (w) {
            lastWeight = w
            if (_sendToRenderer) _sendToRenderer('bascula:peso', w)
          }
        })

        sp.on('error', () => {})
        sp.on('close', () => {
          port = null
          lastWeight = null
          if (_sendToRenderer) _sendToRenderer('bascula:desconectada', {})
        })

        port = sp
        resolve({ ok: true })
      })
    } catch (err) {
      resolve({ ok: false, error: err.message })
    }
  })
}

export async function autoConectarBascula() {
  try {
    const db = getDb()
    const pRow = db.prepare("SELECT valor FROM config WHERE clave = 'bascula_puerto'").get()
    const bRow = db.prepare("SELECT valor FROM config WHERE clave = 'bascula_baudrate'").get()
    if (!pRow?.valor) return
    await conectarPuerto(pRow.valor, Number(bRow?.valor) || 9600)
  } catch (_) {}
}

export function registerBasculaHandlers(sendToRenderer) {
  _sendToRenderer = sendToRenderer

  ipcMain.handle('bascula:listarPuertos', async () => {
    try {
      const list = await SerialPort.list()
      return list.map((p) => ({ path: p.path, descripcion: p.manufacturer || p.pnpId || p.path }))
    } catch {
      return []
    }
  })

  ipcMain.handle('bascula:conectar', async (_, { path, baudRate }) => {
    const res = await conectarPuerto(path, baudRate)
    if (res.ok) {
      const db = getDb()
      const upsert = db.prepare('INSERT OR REPLACE INTO config (clave, valor) VALUES (?, ?)')
      db.transaction(() => {
        upsert.run('bascula_puerto', path)
        upsert.run('bascula_baudrate', String(baudRate))
      })()
    }
    return res
  })

  ipcMain.handle('bascula:desconectar', () => {
    if (port) {
      try { port.close() } catch (_) {}
      port = null
      lastWeight = null
    }
    // Limpiar config guardada para no reconectar al siguiente inicio
    try {
      getDb().prepare("DELETE FROM config WHERE clave IN ('bascula_puerto', 'bascula_baudrate')").run()
    } catch (_) {}
    return { ok: true }
  })

  ipcMain.handle('bascula:estado', () => ({
    conectada: port ? port.isOpen : false,
    peso: lastWeight
  }))

  ipcMain.handle('bascula:getPeso', () => lastWeight)
}
