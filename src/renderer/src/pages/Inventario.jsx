import { useState, useEffect } from 'react'
import { Package, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, AlertTriangle, Search, X, Check } from 'lucide-react'
import { useAppContext } from '../context'

const TIPOS = [
  { value: 'entrada', label: 'Entrada', icon: ArrowUpCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'salida',  label: 'Salida',  icon: ArrowDownCircle, color: 'text-red-500',   bg: 'bg-red-100 dark:bg-red-900/30' },
  { value: 'ajuste',  label: 'Ajuste',  icon: SlidersHorizontal, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
]

const TIPO_INFO = {
  entrada: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Entrada' },
  salida:  { color: 'text-red-500',   bg: 'bg-red-100 dark:bg-red-900/30',     label: 'Salida' },
  ajuste:  { color: 'text-blue-600',  bg: 'bg-blue-100 dark:bg-blue-900/30',   label: 'Ajuste' },
  venta:   { color: 'text-th-t3',     bg: 'bg-th-s2',                          label: 'Venta' },
}

function ModalAjuste({ productos, onGuardar, onCerrar }) {
  const [productoId, setProductoId] = useState('')
  const [tipo, setTipo] = useState('entrada')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)

  const producto = productos.find((p) => p.id === Number(productoId))

  const guardar = async () => {
    if (!productoId || !cantidad || Number(cantidad) <= 0) return
    setLoading(true)
    try {
      await window.api.inventarioAjuste({
        producto_id: Number(productoId),
        tipo,
        cantidad: Number(cantidad),
        motivo: motivo.trim()
      })
      setExito(true)
      setTimeout(() => { onGuardar(); onCerrar() }, 1200)
    } finally {
      setLoading(false)
    }
  }

  if (exito) return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-green-600 rounded-2xl p-8 flex flex-col items-center gap-3 shadow-2xl">
        <Check size={48} className="text-white" />
        <p className="text-white text-xl font-bold">Ajuste registrado</p>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-th-s rounded-2xl w-full max-w-md shadow-2xl border border-th-b2">
        <div className="flex items-center justify-between px-5 py-4 border-b border-th-b2">
          <h2 className="text-th-t font-bold text-lg">Ajuste de inventario</h2>
          <button onClick={onCerrar} className="text-th-t3 hover:text-th-t btn-touch"><X size={22} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Producto */}
          <div>
            <label className="block text-sm text-th-t2 mb-1">Producto</label>
            <select
              className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t focus:outline-none focus:border-blue-500"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              autoFocus
            >
              <option value="">— Selecciona un producto —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}{p.descripcion ? ` — ${p.descripcion}` : ''} (Stock: {p.stock})</option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm text-th-t2 mb-2">Tipo de movimiento</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(({ value, label, icon: Icon, color, bg }) => (
                <button
                  key={value}
                  onClick={() => setTipo(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-colors btn-touch
                    ${tipo === value ? 'border-blue-500 bg-blue-500/10' : 'border-th-b3 hover:border-th-b2'}`}
                >
                  <Icon size={20} className={tipo === value ? 'text-blue-600' : color} />
                  <span className={`text-xs font-semibold ${tipo === value ? 'text-blue-600' : 'text-th-t2'}`}>{label}</span>
                </button>
              ))}
            </div>
            <p className="text-th-t4 text-xs mt-1.5">
              {tipo === 'entrada' && 'Aumenta el stock (compra, recepción de mercancía)'}
              {tipo === 'salida'  && 'Reduce el stock (pérdida, merma, producto dañado)'}
              {tipo === 'ajuste'  && 'Corrección por conteo físico (puede aumentar o reducir)'}
            </p>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm text-th-t2 mb-1">Cantidad</label>
            <input
              type="number" min="0.001" step="0.001"
              className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t text-xl font-bold text-center focus:outline-none focus:border-blue-500"
              placeholder="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
            {producto && cantidad && Number(cantidad) > 0 && (
              <p className="text-th-t3 text-xs mt-1 text-center">
                Stock actual: <strong className="text-th-t">{producto.stock}</strong>
                {' → '}
                <strong className={tipo === 'salida' ? 'text-red-500' : 'text-green-600'}>
                  {tipo === 'entrada' ? producto.stock + Number(cantidad)
                    : Math.max(0, producto.stock - Number(cantidad))}
                </strong>
              </p>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm text-th-t2 mb-1">Motivo / Nota (opcional)</label>
            <input
              className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-2.5 text-th-t text-sm focus:outline-none focus:border-blue-500"
              placeholder="Ej: Compra a proveedor, producto vencido..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && guardar()}
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-th-s2 hover:bg-th-s3 text-th-t font-semibold py-3 rounded-xl btn-touch">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={!productoId || !cantidad || Number(cantidad) <= 0 || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-th-s2 disabled:text-th-t4 text-white font-bold py-3 rounded-xl btn-touch"
          >
            {loading ? 'Guardando...' : 'Registrar ajuste'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Inventario() {
  const { userDataPath } = useAppContext()
  const [tab, setTab] = useState('stock')
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modalAjuste, setModalAjuste] = useState(false)
  const [loading, setLoading] = useState(false)

  const imgSrc = (f) => userDataPath && f ? `file:///${userDataPath.replace(/\\/g, '/')}/imagenes/${f}` : null

  const cargarStock = async () => {
    setLoading(true)
    try {
      const data = await window.api.inventarioResumen()
      setProductos(data)
    } finally {
      setLoading(false)
    }
  }

  const cargarMovimientos = async () => {
    setLoading(true)
    try {
      const filtros = { limite: 200 }
      if (filtroTipo) filtros.tipo = filtroTipo
      setMovimientos(await window.api.inventarioListar(filtros))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarStock() }, [])
  useEffect(() => { if (tab === 'movimientos') cargarMovimientos() }, [tab, filtroTipo])

  const productosFiltrados = productos.filter((p) =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const sinStock    = productosFiltrados.filter((p) => p.stock === 0).length
  const stockBajo   = productosFiltrados.filter((p) => p.stock > 0 && p.stock <= 5).length
  const stockNormal = productosFiltrados.filter((p) => p.stock > 5).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-th-b">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-th-t font-bold text-2xl flex-1">Inventario</h1>
          <button
            onClick={() => setModalAjuste(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold btn-touch"
          >
            <SlidersHorizontal size={16} /> Ajustar stock
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[{ id: 'stock', label: 'Stock actual' }, { id: 'movimientos', label: 'Movimientos' }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium btn-touch transition-colors
                ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2 hover:bg-th-s2'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido Stock */}
      {tab === 'stock' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Resumen rápido */}
          <div className="px-6 py-3 flex gap-3 border-b border-th-b shrink-0">
            <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-xl">
              <span className="text-red-600 font-bold text-sm">{sinStock}</span>
              <span className="text-red-600 text-xs">Sin stock</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 rounded-xl">
              <span className="text-orange-600 font-bold text-sm">{stockBajo}</span>
              <span className="text-orange-600 text-xs">Stock bajo (≤5)</span>
            </div>
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-xl">
              <span className="text-green-600 font-bold text-sm">{stockNormal}</span>
              <span className="text-green-600 text-xs">Stock normal</span>
            </div>
            <div className="relative ml-auto w-52">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-t3" />
              <input
                className="w-full bg-th-s border border-th-b2 rounded-xl pl-8 pr-3 py-1.5 text-th-t text-sm focus:outline-none focus:border-blue-500"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 scroll-touch p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-th-t3">Cargando...</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {productosFiltrados.map((p) => {
                  const nivel = p.stock === 0 ? 'sin' : p.stock <= 5 ? 'bajo' : 'ok'
                  return (
                    <div key={p.id} className="bg-th-s border border-th-b2 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-th-s2 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {p.imagen
                          ? <img src={imgSrc(p.imagen)} alt="" className="w-full h-full object-cover" />
                          : <Package size={16} className="text-th-t4" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-th-t font-semibold text-sm truncate">{p.nombre}</p>
                        {p.descripcion && <p className="text-th-t3 text-xs truncate">{p.descripcion}</p>}
                        {p.categoria_nombre && <p className="text-th-t4 text-xs">{p.categoria_nombre}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold
                          ${nivel === 'sin'  ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            nivel === 'bajo' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                                              'bg-green-100 dark:bg-green-900/30 text-green-700'}`}
                        >
                          {nivel === 'sin'  && <AlertTriangle size={12} />}
                          {p.stock} {p.stock === 1 ? 'ud' : 'uds'}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {productosFiltrados.length === 0 && (
                  <div className="text-center text-th-t4 py-16">No hay productos</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenido Movimientos */}
      {tab === 'movimientos' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-3 flex gap-2 border-b border-th-b shrink-0">
            <button
              onClick={() => setFiltroTipo('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium btn-touch transition-colors
                ${!filtroTipo ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2 hover:bg-th-s2'}`}
            >
              Todos
            </button>
            {['entrada','salida','ajuste','venta'].map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTipo(filtroTipo === t ? '' : t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium btn-touch transition-colors capitalize
                  ${filtroTipo === t ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2 hover:bg-th-s2'}`}
              >
                {TIPO_INFO[t]?.label || t}
              </button>
            ))}
          </div>

          <div className="flex-1 scroll-touch p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-th-t3">Cargando...</div>
            ) : movimientos.length === 0 ? (
              <div className="text-center text-th-t4 py-16">No hay movimientos registrados</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {movimientos.map((m) => {
                  const info = TIPO_INFO[m.tipo] || TIPO_INFO.ajuste
                  const esPositivo = m.cantidad > 0
                  return (
                    <div key={m.id} className="bg-th-s border border-th-b2 rounded-xl p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${info.bg}`}>
                        {esPositivo
                          ? <ArrowUpCircle size={16} className={info.color} />
                          : <ArrowDownCircle size={16} className="text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-th-t font-semibold text-sm truncate">{m.nombre_snap}</p>
                        <p className="text-th-t3 text-xs">
                          {m.motivo || info.label} · {m.fecha?.slice(0, 16).replace('T', ' ')}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`font-bold text-sm ${esPositivo ? 'text-green-600' : 'text-red-500'}`}>
                          {esPositivo ? '+' : ''}{Number(m.cantidad).toFixed(m.cantidad % 1 !== 0 ? 3 : 0)}
                        </p>
                        <p className="text-th-t4 text-xs">{m.stock_antes} → {m.stock_despues}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {modalAjuste && (
        <ModalAjuste
          productos={productos}
          onGuardar={cargarStock}
          onCerrar={() => setModalAjuste(false)}
        />
      )}
    </div>
  )
}
