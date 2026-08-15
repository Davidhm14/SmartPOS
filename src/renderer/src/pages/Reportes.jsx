import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, CreditCard, Package, DollarSign, Printer, Receipt } from 'lucide-react'

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hoy() { return localDate() }

function haceDias(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localDate(d)
}

function getPeriodos() {
  const h = hoy()
  return [
    { label: 'Hoy', desde: h, hasta: h },
    { label: '7 días', desde: haceDias(7), hasta: h },
    { label: '30 días', desde: haceDias(30), hasta: h },
    { label: 'Mes actual', desde: h.slice(0, 7) + '-01', hasta: h }
  ]
}

function generarTicketHTML(config, items, total, metodo, cambio, fecha) {
  const ancho = config.tamano_papel === '58' ? '58mm' : '80mm'
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; font-size:12px; width:${ancho}; }
      .c { text-align:center; } .r { text-align:right; } .b { font-weight:bold; }
      .lg { font-size:14px; } .line { border-top:1px dashed #000; margin:4px 0; }
      table { width:100%; } td { padding:1px 0; vertical-align:top; }
      @media print { @page { margin:0; size:${ancho} auto; } }
    </style></head><body>
    <div class="c b lg">${config.nombre_negocio || 'POS'}</div>
    ${config.nit ? `<div class="c">NIT: ${config.nit}</div>` : ''}
    ${config.telefono ? `<div class="c">Tel: ${config.telefono}</div>` : ''}
    ${config.direccion ? `<div class="c">${config.direccion}</div>` : ''}
    <div class="line"></div>
    <div class="c">${fecha}</div>
    <div class="line"></div>
    <table>${items.map(i =>
      `<tr><td>${i.nombre} x${i.cantidad}<br/><span style="font-size:10px">$${Number(i.precio).toLocaleString('es-CO')} c/u</span></td>
       <td class="r b">$${(i.precio * i.cantidad).toLocaleString('es-CO')}</td></tr>`
    ).join('')}</table>
    <div class="line"></div>
    <table>
      <tr><td class="b lg">TOTAL</td><td class="r b lg">$${Number(total).toLocaleString('es-CO')}</td></tr>
      <tr><td>${metodo}</td><td></td></tr>
      ${cambio > 0 ? `<tr><td>Cambio</td><td class="r">$${Number(cambio).toLocaleString('es-CO')}</td></tr>` : ''}
    </table>
    <div class="line"></div>
    <div class="c">${config.footer_ticket || 'Gracias por su compra'}</div>
    <br/><br/></body></html>`
}

function generarReporteHTML(config, data, desde, hasta) {
  const negocio = config.nombre_negocio || 'POS'
  const periodo = desde === hasta ? desde : `${desde} al ${hasta}`
  const fecha = new Date().toLocaleString('es-CO')

  const filaMetodo = (m) =>
    `<tr><td>${m.metodo_pago}</td><td style="text-align:right">${m.cantidad}</td><td style="text-align:right">$${Number(m.monto).toLocaleString('es-CO')}</td></tr>`

  const filaProducto = (p, i) =>
    `<tr><td>#${i + 1}</td><td>${p.nombre}</td><td style="text-align:right">${p.unidades}</td><td style="text-align:right">$${Number(p.total).toLocaleString('es-CO')}</td>${p.precio_costo > 0 ? `<td style="text-align:right">$${Number(p.utilidad).toLocaleString('es-CO')}</td>` : '<td></td>'}</tr>`

  const filaDia = (d) =>
    `<tr><td>${d.dia}</td><td style="text-align:right">${d.cantidad}</td><td style="text-align:right">$${Number(d.monto).toLocaleString('es-CO')}</td></tr>`

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:Arial,sans-serif; font-size:12px; color:#111; padding:20px; }
      h1 { font-size:20px; margin-bottom:4px; }
      h2 { font-size:14px; margin:16px 0 6px; border-bottom:1px solid #ccc; padding-bottom:4px; }
      .sub { color:#555; font-size:11px; margin-bottom:16px; }
      .stats { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:8px; }
      .stat { border:1px solid #ddd; border-radius:8px; padding:10px 16px; flex:1; min-width:120px; }
      .stat .label { font-size:11px; color:#666; }
      .stat .val { font-size:18px; font-weight:bold; margin-top:2px; }
      table { width:100%; border-collapse:collapse; font-size:12px; }
      th { background:#f0f0f0; text-align:left; padding:5px 8px; }
      td { padding:4px 8px; border-bottom:1px solid #eee; }
      .footer { margin-top:24px; font-size:10px; color:#888; text-align:right; }
      @media print { @page { margin:15mm; } body { padding:0; } }
    </style></head><body>
    <h1>${negocio}</h1>
    ${config.nit ? `<div class="sub">NIT: ${config.nit}${config.telefono ? ' | Tel: ' + config.telefono : ''}${config.direccion ? ' | ' + config.direccion : ''}</div>` : '<div class="sub"> </div>'}
    <div class="sub">Reporte de ventas — Período: ${periodo}</div>

    <div class="stats">
      <div class="stat"><div class="label">Total ventas</div><div class="val">${data.totalVentas}</div></div>
      <div class="stat"><div class="label">Ingresos</div><div class="val">$${Number(data.montoTotal).toLocaleString('es-CO')}</div></div>
      <div class="stat"><div class="label">Utilidad estimada</div><div class="val">$${Number(data.utilidadTotal).toLocaleString('es-CO')}</div></div>
      ${data.montoTotal > 0 ? `<div class="stat"><div class="label">Margen promedio</div><div class="val">${Math.round((data.utilidadTotal / data.montoTotal) * 100)}%</div></div>` : ''}
    </div>

    ${data.porMetodo.length > 0 ? `
    <h2>Métodos de pago</h2>
    <table><thead><tr><th>Método</th><th style="text-align:right">Ventas</th><th style="text-align:right">Monto</th></tr></thead>
    <tbody>${data.porMetodo.map(filaMetodo).join('')}</tbody></table>` : ''}

    ${data.productosTop.length > 0 ? `
    <h2>Productos más vendidos</h2>
    <table><thead><tr><th>#</th><th>Producto</th><th style="text-align:right">Unidades</th><th style="text-align:right">Total</th><th style="text-align:right">Utilidad</th></tr></thead>
    <tbody>${data.productosTop.map(filaProducto).join('')}</tbody></table>` : ''}

    ${data.ventasPorDia.length > 0 ? `
    <h2>Ventas por día</h2>
    <table><thead><tr><th>Fecha</th><th style="text-align:right">Ventas</th><th style="text-align:right">Monto</th></tr></thead>
    <tbody>${data.ventasPorDia.map(filaDia).join('')}</tbody></table>` : ''}

    <div class="footer">Generado el ${fecha}</div>
    </body></html>`
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-th-s border border-th-b2 rounded-2xl p-5 flex items-center gap-4">
      <div className={`${color} rounded-xl p-3`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-th-t3 text-sm">{label}</p>
        <p className="text-th-t font-bold text-2xl">{value}</p>
      </div>
    </div>
  )
}

export default function Reportes() {
  const [periodoIdx, setPeriodoIdx] = useState(0)
  const [data, setData] = useState(null)
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(false)
  const [desde, setDesde] = useState(hoy())
  const [hasta, setHasta] = useState(hoy())
  const [personalizado, setPersonalizado] = useState(false)
  const [config, setConfig] = useState({})
  const [reimprimiendo, setReimprimiendo] = useState(null)

  useEffect(() => {
    window.api.getConfig().then(setConfig)
  }, [])

  const cargar = async (d, h) => {
    setLoading(true)
    try {
      const [res, vts] = await Promise.all([
        window.api.resumenReporte({ desde: d, hasta: h }),
        window.api.listarVentas({ fecha_desde: d, fecha_hasta: h })
      ])
      setData(res)
      setVentas(vts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!personalizado) {
      const p = getPeriodos()[periodoIdx]
      setDesde(p.desde)
      setHasta(p.hasta)
      cargar(p.desde, p.hasta)
    }
  }, [periodoIdx, personalizado])

  const imprimirReporte = () => {
    if (!data) return
    const html = generarReporteHTML(config, data, desde, hasta)
    window.api.imprimirTicket(html)
  }

  const reimprimirFactura = async (venta) => {
    setReimprimiendo(venta.id)
    try {
      const items = await window.api.detalleVenta(venta.id)
      const mapped = items.map((i) => ({ nombre: i.nombre_snap, precio: i.precio_snap, cantidad: i.cantidad }))
      const html = generarTicketHTML(config, mapped, venta.total, venta.metodo_pago, venta.cambio, venta.fecha)
      await window.api.imprimirTicket(html)
    } finally {
      setReimprimiendo(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-th-b">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-th-t font-bold text-2xl">Reportes</h1>
          {data && (
            <button
              onClick={imprimirReporte}
              className="flex items-center gap-2 bg-th-s border border-th-b2 hover:bg-th-s2 text-th-t2 hover:text-th-t px-4 py-2 rounded-xl text-sm font-medium btn-touch transition-colors"
            >
              <Printer size={15} />
              Imprimir reporte
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {getPeriodos().map((p, i) => (
            <button
              key={p.label}
              onClick={() => { setPeriodoIdx(i); setPersonalizado(false) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium btn-touch transition-colors
                ${!personalizado && periodoIdx === i ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2 hover:bg-th-s2'}`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setPersonalizado(!personalizado)}
            className={`px-4 py-2 rounded-xl text-sm font-medium btn-touch transition-colors
              ${personalizado ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2 hover:bg-th-s2'}`}
          >
            Personalizado
          </button>
        </div>
        {personalizado && (
          <div className="flex gap-3 mt-3 items-center">
            <input type="date" className="bg-th-s border border-th-b2 rounded-xl px-3 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
              value={desde} onChange={(e) => setDesde(e.target.value)} />
            <span className="text-th-t3">—</span>
            <input type="date" className="bg-th-s border border-th-b2 rounded-xl px-3 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
              value={hasta} onChange={(e) => setHasta(e.target.value)} />
            <button onClick={() => cargar(desde, hasta)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium btn-touch">
              Buscar
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 scroll-touch p-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center h-40 text-th-t3">Cargando...</div>
        )}
        {data && !loading && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={ShoppingBag} label="Ventas" value={data.totalVentas} color="bg-blue-600" />
              <StatCard icon={TrendingUp} label="Total ingresos" value={`$${Number(data.montoTotal).toLocaleString('es-CO')}`} color="bg-green-600" />
              <StatCard icon={DollarSign} label="Utilidad estimada" value={`$${Number(data.utilidadTotal).toLocaleString('es-CO')}`} color="bg-purple-600" />
              {data.montoTotal > 0 && (
                <StatCard
                  icon={TrendingUp}
                  label="Margen promedio"
                  value={`${Math.round((data.utilidadTotal / data.montoTotal) * 100)}%`}
                  color="bg-indigo-600"
                />
              )}
            </div>

            {data.porMetodo.length > 0 && (
              <div className="bg-th-s border border-th-b2 rounded-2xl p-4">
                <h3 className="text-th-t font-bold mb-3 flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-500" /> Métodos de pago
                </h3>
                <div className="space-y-2">
                  {data.porMetodo.map((m) => (
                    <div key={m.metodo_pago} className="flex justify-between items-center py-2 border-b border-th-b2 last:border-0">
                      <div>
                        <span className="text-th-t capitalize font-medium">{m.metodo_pago}</span>
                        <span className="text-th-t3 text-sm ml-2">({m.cantidad} ventas)</span>
                      </div>
                      <span className="text-blue-600 font-bold">${Number(m.monto).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.productosTop.length > 0 && (
              <div className="bg-th-s border border-th-b2 rounded-2xl p-4">
                <h3 className="text-th-t font-bold mb-3 flex items-center gap-2">
                  <Package size={18} className="text-blue-500" /> Productos más vendidos
                </h3>
                <div className="space-y-2">
                  {data.productosTop.map((p, i) => (
                    <div key={p.nombre} className="flex items-center gap-3 py-2 border-b border-th-b2 last:border-0">
                      <span className="text-th-t4 font-bold w-5 text-sm">#{i + 1}</span>
                      <span className="flex-1 text-th-t text-sm">{p.nombre}</span>
                      <span className="text-th-t3 text-sm">{p.unidades} uds</span>
                      <span className="text-blue-600 font-bold text-sm">${Number(p.total).toLocaleString('es-CO')}</span>
                      {p.precio_costo > 0 && (
                        <span className="text-purple-600 text-xs font-medium">+${Number(p.utilidad).toLocaleString('es-CO')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.ventasPorDia.length > 0 && (
              <div className="bg-th-s border border-th-b2 rounded-2xl p-4">
                <h3 className="text-th-t font-bold mb-3">Ventas por día</h3>
                <div className="space-y-2">
                  {data.ventasPorDia.map((d) => (
                    <div key={d.dia} className="flex justify-between items-center py-2 border-b border-th-b2 last:border-0">
                      <div>
                        <span className="text-th-t text-sm">{d.dia}</span>
                        <span className="text-th-t3 text-xs ml-2">({d.cantidad} ventas)</span>
                      </div>
                      <span className="text-green-600 font-bold">${Number(d.monto).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ventas.length > 0 && (
              <div className="bg-th-s border border-th-b2 rounded-2xl p-4">
                <h3 className="text-th-t font-bold mb-3 flex items-center gap-2">
                  <Receipt size={18} className="text-blue-500" /> Historial de facturas
                </h3>
                <div className="space-y-1">
                  {ventas.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 py-2 border-b border-th-b2 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-th-t3 text-xs font-mono">#{v.id}</span>
                          <span className="text-th-t text-sm font-medium truncate">{v.cliente_nombre || 'Cliente general'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-th-t3 text-xs">{v.fecha?.slice(0, 16)}</span>
                          <span className="text-th-t4 text-xs capitalize">{v.metodo_pago}</span>
                        </div>
                      </div>
                      <span className="text-th-t font-bold text-sm shrink-0">${Number(v.total).toLocaleString('es-CO')}</span>
                      <button
                        onClick={() => reimprimirFactura(v)}
                        disabled={reimprimiendo === v.id}
                        title="Reimprimir factura"
                        className="shrink-0 bg-th-s2 hover:bg-th-s3 disabled:opacity-40 text-th-t2 hover:text-th-t p-2 rounded-xl btn-touch transition-colors"
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.totalVentas === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-th-t4">
                <TrendingUp size={40} className="mb-3 opacity-30" />
                <p>No hay ventas en este período</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
