import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerReportesHandlers() {
  ipcMain.handle('reportes:resumen', (_, { desde, hasta }) => {
    const db = getDb()

    const totalVentas = db
      .prepare("SELECT COUNT(*) as total, SUM(total) as monto FROM ventas WHERE date(fecha) BETWEEN ? AND ?")
      .get(desde, hasta)

    const porMetodo = db
      .prepare("SELECT metodo_pago, COUNT(*) as cantidad, SUM(total) as monto FROM ventas WHERE date(fecha) BETWEEN ? AND ? GROUP BY metodo_pago")
      .all(desde, hasta)

    const productosTop = db
      .prepare(`
        SELECT
          COALESCE(NULLIF(TRIM(p.descripcion), ''), dv.nombre_snap) AS nombre,
          SUM(dv.cantidad) AS unidades,
          SUM(dv.cantidad * dv.precio_snap) AS total,
          COALESCE(p.precio_costo, 0) AS precio_costo,
          SUM(dv.cantidad * (dv.precio_snap - COALESCE(p.precio_costo, 0))) AS utilidad
        FROM detalle_ventas dv
        JOIN ventas v ON dv.venta_id = v.id
        LEFT JOIN productos p ON dv.producto_id = p.id
        WHERE date(v.fecha) BETWEEN ? AND ?
        GROUP BY COALESCE(NULLIF(TRIM(p.descripcion), ''), dv.nombre_snap)
        ORDER BY unidades DESC
        LIMIT 10
      `)
      .all(desde, hasta)

    const utilidadTotal = db
      .prepare(`
        SELECT SUM(dv.cantidad * (dv.precio_snap - COALESCE(p.precio_costo, 0))) AS utilidad
        FROM detalle_ventas dv
        JOIN ventas v ON dv.venta_id = v.id
        LEFT JOIN productos p ON dv.producto_id = p.id
        WHERE date(v.fecha) BETWEEN ? AND ?
      `)
      .get(desde, hasta)

    const ventasPorDia = db
      .prepare(`
        SELECT date(fecha) AS dia, COUNT(*) AS cantidad, SUM(total) AS monto
        FROM ventas
        WHERE date(fecha) BETWEEN ? AND ?
        GROUP BY date(fecha)
        ORDER BY dia ASC
      `)
      .all(desde, hasta)

    return {
      totalVentas: totalVentas.total || 0,
      montoTotal: totalVentas.monto || 0,
      utilidadTotal: utilidadTotal.utilidad || 0,
      porMetodo,
      productosTop,
      ventasPorDia
    }
  })

  ipcMain.handle('reportes:ventasRecientes', () => {
    return getDb()
      .prepare(`
        SELECT v.*, c.nombre AS cliente_nombre
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        ORDER BY v.fecha DESC
        LIMIT 20
      `)
      .all()
  })
}
