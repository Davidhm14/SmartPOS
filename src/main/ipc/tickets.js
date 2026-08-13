import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerTicketsHandlers() {
  ipcMain.handle('tickets:listar', () => {
    return getDb()
      .prepare('SELECT * FROM tickets_pendientes ORDER BY id ASC')
      .all()
      .map((t) => ({ ...t, items: JSON.parse(t.items) }))
  })

  ipcMain.handle('tickets:crear', (_, nombre) => {
    const db = getDb()
    const result = db
      .prepare('INSERT INTO tickets_pendientes (nombre, items) VALUES (?, ?)')
      .run(nombre || 'Ticket', '[]')
    return { id: result.lastInsertRowid, nombre: nombre || 'Ticket', items: [] }
  })

  ipcMain.handle('tickets:guardar', (_, { id, items }) => {
    getDb()
      .prepare('UPDATE tickets_pendientes SET items = ? WHERE id = ?')
      .run(JSON.stringify(items), id)
    return { ok: true }
  })

  ipcMain.handle('tickets:renombrar', (_, { id, nombre }) => {
    getDb()
      .prepare('UPDATE tickets_pendientes SET nombre = ? WHERE id = ?')
      .run(nombre, id)
    return { ok: true }
  })

  ipcMain.handle('tickets:eliminar', (_, id) => {
    getDb().prepare('DELETE FROM tickets_pendientes WHERE id = ?').run(id)
    return { ok: true }
  })
}
