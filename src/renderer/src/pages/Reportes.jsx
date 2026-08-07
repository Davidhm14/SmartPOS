import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, CreditCard, Package, DollarSign } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)
  const [desde, setDesde] = useState(hoy())
  const [hasta, setHasta] = useState(hoy())
  const [personalizado, setPersonalizado] = useState(false)

  const cargar = async (d, h) => {
    setLoading(true)
    try {
      const res = await window.api.resumenReporte({ desde: d, hasta: h })
      setData(res)
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-th-b">
        <h1 className="text-th-t font-bold text-2xl mb-3">Reportes</h1>
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
