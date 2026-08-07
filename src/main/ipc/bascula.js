import { ipcMain } from 'electron'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'

let port = null
let lastWeight = null

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

export function registerBasculaHandlers(sendToRenderer) {
  ipcMain.handle('bascula:listarPuertos', async () => {
    try {
      const list = await SerialPort.list()
      return list.map((p) => ({ path: p.path, descripcion: p.manufacturer || p.pnpId || p.path }))
    } catch {
      return []
    }
  })

  ipcMain.handle('bascula:conectar', async (_, { path, baudRate }) => {
    // Close previous connection
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
              sendToRenderer('bascula:peso', w)
            }
          })

          sp.on('error', (e) => sendToRenderer('bascula:error', e.message))
          sp.on('close', () => {
            port = null
            lastWeight = null
            sendToRenderer('bascula:desconectada', {})
          })

          port = sp
          resolve({ ok: true })
        })
      } catch (err) {
        resolve({ ok: false, error: err.message })
      }
    })
  })

  ipcMain.handle('bascula:desconectar', () => {
    if (port) {
      try { port.close() } catch (_) {}
      port = null
      lastWeight = null
    }
    return { ok: true }
  })

  ipcMain.handle('bascula:estado', () => ({
    conectada: port ? port.isOpen : false,
    peso: lastWeight
  }))

  ipcMain.handle('bascula:getPeso', () => lastWeight)
}
