import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerClientesHandlers() {
  ipcMain.handle('clientes:listar', (_, busqueda) => {
    const db = getDb()
    if (busqueda) {
      return db
        .prepare("SELECT * FROM clientes WHERE nombre LIKE ? OR telefono LIKE ? ORDER BY nombre ASC")
        .all(`%${busqueda}%`, `%${busqueda}%`)
    }
    return db.prepare('SELECT * FROM clientes ORDER BY nombre ASC').all()
  })

  ipcMain.handle('clientes:crear', (_, data) => {
    const result = getDb()
      .prepare('INSERT INTO clientes (nombre, telefono, email) VALUES (?,?,?)')
      .run(data.nombre, data.telefono || '', data.email || '')
    return { id: result.lastInsertRowid, ...data }
  })

  ipcMain.handle('clientes:actualizar', (_, data) => {
    getDb()
      .prepare('UPDATE clientes SET nombre=?, telefono=?, email=? WHERE id=?')
      .run(data.nombre, data.telefono || '', data.email || '', data.id)
    return data
  })

  ipcMain.handle('clientes:eliminar', (_, id) => {
    const db = getDb()
    // Desvincular ventas antes de borrar el cliente (preserva historial)
    db.prepare('UPDATE ventas SET cliente_id = NULL WHERE cliente_id = ?').run(id)
    db.prepare('DELETE FROM clientes WHERE id = ?').run(id)
    return { ok: true }
  })

  ipcMain.handle('clientes:historial', (_, clienteId) => {
    return getDb()
      .prepare('SELECT * FROM ventas WHERE cliente_id = ? ORDER BY fecha DESC LIMIT 50')
      .all(clienteId)
  })
}
