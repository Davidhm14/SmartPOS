import { ipcMain } from 'electron'
import { getDb } from '../database'
import { registrarMovimiento } from './inventario'

export function registerVentasHandlers() {
  ipcMain.handle('ventas:crear', (_, { items, cliente_id, total, metodo_pago, efectivo_recibido, cambio, notas }) => {
    const db = getDb()
    const insertVenta = db.transaction(() => {
      const venta = db
        .prepare(
          'INSERT INTO ventas (cliente_id, total, metodo_pago, efectivo_recibido, cambio, notas) VALUES (?,?,?,?,?,?)'
        )
        .run(cliente_id || null, total, metodo_pago, efectivo_recibido || 0, cambio || 0, notas || '')

      const ventaId = venta.lastInsertRowid

      const insertDetalle = db.prepare(
        'INSERT INTO detalle_ventas (venta_id, producto_id, nombre_snap, precio_snap, cantidad) VALUES (?,?,?,?,?)'
      )
      for (const item of items) {
        insertDetalle.run(ventaId, item.id || null, item.nombre, item.precio, item.cantidad)
        // Reduce stock
        if (item.id) {
          const nuevo = registrarMovimiento(db, {
            producto_id: item.id,
            nombre_snap: item.nombre,
            tipo: 'venta',
            cantidad: -item.cantidad,
            motivo: `Venta #${ventaId}`
          })
          if (nuevo !== undefined) {
            db.prepare('UPDATE productos SET stock = ? WHERE id = ?').run(nuevo, item.id)
          }
        }
      }

      return ventaId
    })

    const ventaId = insertVenta()
    return { id: ventaId, ok: true }
  })

  ipcMain.handle('ventas:listar', (_, filtros = {}) => {
    const db = getDb()
    let sql = `
      SELECT v.*, c.nombre AS cliente_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
    `
    const params = []
    if (filtros.fecha_desde) {
      sql += params.length ? ' AND' : ' WHERE'
      sql += ' date(v.fecha) >= ?'
      params.push(filtros.fecha_desde)
    }
    if (filtros.fecha_hasta) {
      sql += params.length ? ' AND' : ' WHERE'
      sql += ' date(v.fecha) <= ?'
      params.push(filtros.fecha_hasta)
    }
    sql += ' ORDER BY v.fecha DESC'
    if (filtros.limite) {
      sql += ' LIMIT ?'
      params.push(filtros.limite)
    }
    return db.prepare(sql).all(...params)
  })

  ipcMain.handle('ventas:detalle', (_, ventaId) => {
    return getDb()
      .prepare('SELECT * FROM detalle_ventas WHERE venta_id = ?')
      .all(ventaId)
  })
}
