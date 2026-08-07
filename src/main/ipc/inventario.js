import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registrarMovimiento(db, { producto_id, nombre_snap, tipo, cantidad, motivo }) {
  const producto = db.prepare('SELECT stock FROM productos WHERE id = ?').get(producto_id)
  if (!producto) return
  const stock_antes = producto.stock
  const stock_despues = Math.max(0, stock_antes + cantidad)
  db.prepare(
    'INSERT INTO movimientos_inventario (producto_id, nombre_snap, tipo, cantidad, motivo, stock_antes, stock_despues) VALUES (?,?,?,?,?,?,?)'
  ).run(producto_id, nombre_snap, tipo, cantidad, motivo || '', stock_antes, stock_despues)
  return stock_despues
}

export function registerInventarioHandlers() {
  ipcMain.handle('inventario:listar', (_, filtros = {}) => {
    const db = getDb()
    let sql = `
      SELECT m.*, p.imagen
      FROM movimientos_inventario m
      LEFT JOIN productos p ON m.producto_id = p.id
    `
    const params = []
    const where = []
    if (filtros.producto_id) { where.push('m.producto_id = ?'); params.push(filtros.producto_id) }
    if (filtros.tipo)        { where.push('m.tipo = ?');        params.push(filtros.tipo) }
    if (filtros.desde)       { where.push("date(m.fecha) >= ?"); params.push(filtros.desde) }
    if (filtros.hasta)       { where.push("date(m.fecha) <= ?"); params.push(filtros.hasta) }
    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' ORDER BY m.fecha DESC'
    if (filtros.limite) { sql += ' LIMIT ?'; params.push(filtros.limite) }
    return db.prepare(sql).all(...params)
  })

  ipcMain.handle('inventario:ajuste', (_, { producto_id, tipo, cantidad, motivo }) => {
    const db = getDb()
    const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(producto_id)
    if (!producto) return { ok: false, error: 'Producto no encontrado' }

    const delta = tipo === 'entrada' ? Math.abs(cantidad) : -Math.abs(cantidad)
    const nuevo_stock = registrarMovimiento(db, {
      producto_id,
      nombre_snap: producto.nombre,
      tipo,
      cantidad: delta,
      motivo
    })
    db.prepare('UPDATE productos SET stock = ? WHERE id = ?').run(nuevo_stock, producto_id)
    return { ok: true, stock_nuevo: nuevo_stock }
  })

  ipcMain.handle('inventario:resumen', () => {
    const db = getDb()
    return db.prepare(`
      SELECT p.id, p.nombre, p.descripcion, p.imagen, p.stock, p.categoria_id,
             c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = 1
      ORDER BY p.stock ASC, p.nombre ASC
    `).all()
  })
}
