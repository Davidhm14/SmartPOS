import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerProductosHandlers() {
  ipcMain.handle('productos:listar', (_, filtros = {}) => {
    const db = getDb()
    let sql = `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = 1
    `
    const params = []
    if (filtros.categoria_id) {
      sql += ' AND p.categoria_id = ?'
      params.push(filtros.categoria_id)
    }
    if (filtros.busqueda) {
      sql += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)'
      params.push(`%${filtros.busqueda}%`, `%${filtros.busqueda}%`)
    }
    sql += ' ORDER BY p.nombre ASC'
    return db.prepare(sql).all(...params)
  })

  ipcMain.handle('productos:obtener', (_, id) => {
    return getDb().prepare('SELECT * FROM productos WHERE id = ?').get(id)
  })

  ipcMain.handle('productos:crear', (_, data) => {
    const db = getDb()
    const result = db
      .prepare(
        'INSERT INTO productos (nombre, precio, categoria_id, imagen, stock, descripcion, venta_por_peso, precio_kg, precio_costo, precio_oferta) VALUES (?,?,?,?,?,?,?,?,?,?)'
      )
      .run(data.nombre, data.precio, data.categoria_id || null, data.imagen || null, data.stock || 0, data.descripcion || '', data.venta_por_peso ? 1 : 0, data.precio_kg || 0, data.precio_costo || 0, data.precio_oferta || 0)
    return { id: result.lastInsertRowid, ...data }
  })

  ipcMain.handle('productos:actualizar', (_, data) => {
    getDb()
      .prepare(
        'UPDATE productos SET nombre=?, precio=?, categoria_id=?, imagen=?, stock=?, descripcion=?, venta_por_peso=?, precio_kg=?, precio_costo=?, precio_oferta=? WHERE id=?'
      )
      .run(data.nombre, data.precio, data.categoria_id || null, data.imagen || null, data.stock || 0, data.descripcion || '', data.venta_por_peso ? 1 : 0, data.precio_kg || 0, data.precio_costo || 0, data.precio_oferta || 0, data.id)
    return data
  })

  ipcMain.handle('productos:eliminar', (_, id) => {
    getDb().prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(id)
    return { ok: true }
  })

  ipcMain.handle('categorias:listar', () => {
    return getDb().prepare('SELECT * FROM categorias ORDER BY nombre ASC').all()
  })

  ipcMain.handle('categorias:crear', (_, nombre) => {
    const result = getDb().prepare('INSERT OR IGNORE INTO categorias (nombre) VALUES (?)').run(nombre)
    return { id: result.lastInsertRowid, nombre }
  })

  ipcMain.handle('categorias:eliminar', (_, id) => {
    const db = getDb()
    // Desvincular productos antes de borrar la categoría
    db.prepare('UPDATE productos SET categoria_id = NULL WHERE categoria_id = ?').run(id)
    db.prepare('DELETE FROM categorias WHERE id = ?').run(id)
    return { ok: true }
  })
}
