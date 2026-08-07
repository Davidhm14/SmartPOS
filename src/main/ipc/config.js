import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerConfigHandlers() {
  ipcMain.handle('config:obtener', () => {
    const rows = getDb().prepare('SELECT clave, valor FROM config').all()
    return Object.fromEntries(rows.map((r) => [r.clave, r.valor]))
  })

  ipcMain.handle('config:guardar', (_, data) => {
    const db = getDb()
    const upsert = db.prepare('INSERT OR REPLACE INTO config (clave, valor) VALUES (?, ?)')
    const saveAll = db.transaction((obj) => {
      for (const [k, v] of Object.entries(obj)) upsert.run(k, String(v))
    })
    saveAll(data)
    return { ok: true }
  })

  // Medios de pago
  ipcMain.handle('mediosPago:listar', () => {
    return getDb()
      .prepare('SELECT * FROM medios_pago WHERE activo = 1 ORDER BY orden ASC, nombre ASC')
      .all()
  })

  ipcMain.handle('mediosPago:crear', (_, nombre) => {
    const db = getDb()
    const maxOrden = db.prepare('SELECT MAX(orden) as m FROM medios_pago').get().m ?? 0
    const result = db
      .prepare('INSERT INTO medios_pago (nombre, orden) VALUES (?, ?)')
      .run(nombre.trim(), maxOrden + 1)
    return { id: result.lastInsertRowid, nombre: nombre.trim(), activo: 1 }
  })

  ipcMain.handle('mediosPago:eliminar', (_, id) => {
    getDb().prepare('UPDATE medios_pago SET activo = 0 WHERE id = ?').run(id)
    return { ok: true }
  })

  ipcMain.handle('mediosPago:reordenar', (_, ids) => {
    const update = getDb().prepare('UPDATE medios_pago SET orden = ? WHERE id = ?')
    getDb().transaction(() => ids.forEach((id, i) => update.run(i, id)))()
    return { ok: true }
  })
}
