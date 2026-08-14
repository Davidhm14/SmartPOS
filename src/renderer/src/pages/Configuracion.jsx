import { useState, useEffect } from 'react'
import { Save, Check, Plus, Trash2, GripVertical, Scale, Wifi, WifiOff, RefreshCw } from 'lucide-react'

function MediosPago() {
  const [medios, setMedios] = useState([])
  const [nuevo, setNuevo] = useState('')
  const [agregando, setAgregando] = useState(false)

  const cargar = () => window.api.listarMediosPago().then(setMedios)
  useEffect(() => { cargar() }, [])

  const agregar = async () => {
    const nombre = nuevo.trim()
    if (!nombre) return
    await window.api.crearMedioPago(nombre)
    setNuevo(''); setAgregando(false); cargar()
  }

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"? Las ventas registradas con este método no se borran.`)) return
    await window.api.eliminarMedioPago(id); cargar()
  }

  return (
    <div className="bg-th-s border border-th-b2 rounded-2xl p-4 flex flex-col h-full overflow-hidden space-y-3">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-th-t font-bold">Medios de pago</h2>
        <button
          onClick={() => setAgregando(true)}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium btn-touch"
        >
          <Plus size={15} /> Agregar
        </button>
      </div>

      {agregando && (
        <div className="flex gap-2 shrink-0">
          <input
            autoFocus
            className="flex-1 bg-th-s2 border border-th-b3 rounded-xl px-4 py-2 text-th-t focus:outline-none focus:border-blue-500"
            placeholder="Ej: Bre-B, Bancolombia..."
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') agregar(); if (e.key === 'Escape') setAgregando(false) }}
          />
          <button onClick={agregar} disabled={!nuevo.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-th-s2 text-white px-4 py-2 rounded-xl text-sm btn-touch">
            Guardar
          </button>
          <button onClick={() => { setAgregando(false); setNuevo('') }} className="bg-th-s2 hover:bg-th-s3 text-th-t px-3 py-2 rounded-xl text-sm btn-touch">
            Cancelar
          </button>
        </div>
      )}

      <div className="space-y-2 flex-1 overflow-y-auto">
        {medios.map((m) => (
          <div key={m.id} className="flex items-center gap-3 bg-th-s2 rounded-xl px-4 py-3">
            <GripVertical size={16} className="text-th-t4 shrink-0" />
            <span className="flex-1 text-th-t font-medium">{m.nombre}</span>
            <button onClick={() => eliminar(m.id, m.nombre)} className="text-th-t3 hover:text-red-500 btn-touch transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {medios.length === 0 && (
          <p className="text-th-t4 text-sm text-center py-2">Sin medios de pago activos</p>
        )}
      </div>
    </div>
  )
}

const BAUDRATES = [1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200]

function Bascula() {
  const [puertos, setPuertos] = useState([])
  const [puerto, setPuerto] = useState('')
  const [baudrate, setBaudrate] = useState(9600)
  const [conectada, setConectada] = useState(false)
  const [peso, setPeso] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState('')

  const cargarPuertos = async (puertoGuardado) => {
    const lista = await window.api.basculaListarPuertos()
    setPuertos(lista)
    if (lista.length > 0 && !puerto) {
      const saved = puertoGuardado ?? null
      setPuerto(saved && lista.find((p) => p.path === saved) ? saved : lista[0].path)
    }
  }

  useEffect(() => {
    window.api.getConfig().then((cfg) => {
      if (cfg.bascula_puerto) setPuerto(cfg.bascula_puerto)
      if (cfg.bascula_baudrate) setBaudrate(Number(cfg.bascula_baudrate))
      cargarPuertos(cfg.bascula_puerto)
    })
    window.api.basculaEstado().then(({ conectada: c, peso: p }) => {
      setConectada(c)
      if (c && p) setPeso(p.peso)
      if (c) setMsg('Conectada automáticamente al iniciar')
    })
    const off = window.api.onBasculaPeso(({ peso: p }) => { setPeso(p); setConectada(true) })
    return () => off && off()
  }, [])

  const conectar = async () => {
    if (!puerto) return
    setCargando(true); setMsg('')
    const res = await window.api.basculaConectar({ path: puerto, baudRate: baudrate })
    setCargando(false)
    if (res.ok) { setConectada(true); setMsg('Conectada correctamente') }
    else setMsg(`Error: ${res.error}`)
  }

  const desconectar = async () => {
    await window.api.basculaDesconectar()
    setConectada(false); setPeso(null); setMsg('Desconectada')
  }

  return (
    <div className="bg-th-s border border-th-b2 rounded-2xl p-4 flex flex-col h-full overflow-hidden space-y-3">
      <div className="flex items-center gap-2 shrink-0">
        <Scale size={18} className="text-blue-500" />
        <h2 className="text-th-t font-bold">Báscula / Balanza</h2>
        <span className={`ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium
          ${conectada ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-th-s2 text-th-t3'}`}>
          {conectada ? <><Wifi size={12} /> Conectada</> : <><WifiOff size={12} /> Desconectada</>}
        </span>
      </div>

      {conectada && peso !== null && (
        <div className="bg-th-bg rounded-xl px-4 py-2 text-center shrink-0">
          <p className="text-th-t3 text-xs">Peso en tiempo real</p>
          <p className="text-th-t text-2xl font-bold font-mono">{peso.toFixed(3)} kg</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div>
          <label className="block text-xs text-th-t3 mb-1">Puerto COM</label>
          <div className="flex gap-1">
            <select
              className="flex-1 bg-th-s2 border border-th-b3 rounded-xl px-2 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
              value={puerto} onChange={(e) => setPuerto(e.target.value)} disabled={conectada}
            >
              {puertos.length === 0
                ? <option value="">Sin puertos</option>
                : puertos.map((p) => <option key={p.path} value={p.path}>{p.path}{p.descripcion ? ` — ${p.descripcion}` : ''}</option>)}
            </select>
            <button onClick={() => cargarPuertos(puerto)} disabled={conectada} className="bg-th-s2 hover:bg-th-s3 disabled:opacity-40 text-th-t2 p-2 rounded-xl btn-touch" title="Actualizar puertos">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-th-t3 mb-1">Velocidad (baud)</label>
          <select
            className="w-full bg-th-s2 border border-th-b3 rounded-xl px-2 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
            value={baudrate} onChange={(e) => setBaudrate(Number(e.target.value))} disabled={conectada}
          >
            {BAUDRATES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {msg && (
        <p className={`text-sm px-3 py-2 rounded-xl shrink-0 ${msg.startsWith('Error') ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
          {msg}
        </p>
      )}

      <button
        onClick={conectada ? desconectar : conectar}
        disabled={cargando || (!conectada && !puerto)}
        className={`w-full py-2.5 rounded-xl font-bold btn-touch transition-colors shrink-0
          ${conectada ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-th-s2 disabled:text-th-t4 text-white'}`}
      >
        {cargando ? 'Conectando...' : conectada ? 'Desconectar báscula' : 'Conectar báscula'}
      </button>

      <p className="text-th-t4 text-xs shrink-0">
        Protocolo compatible: CAS, Epson, genérico. Para productos por kg activa la opción al editar el producto.
      </p>
    </div>
  )
}

export default function Configuracion({ config, onSave }) {
  const [form, setForm] = useState({ ...config })
  const [guardado, setGuardado] = useState(false)

  const guardar = async () => {
    await window.api.saveConfig(form)
    onSave(form)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  const campo = (key, label, placeholder = '') => (
    <div>
      <label className="block text-sm text-th-t2 mb-1">{label}</label>
      <input
        className="w-full bg-th-s2 border border-th-b3 rounded-xl px-3 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
        value={form[key] || ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header con botón guardar */}
      <div className="px-4 pt-3 pb-3 border-b border-th-b flex items-center gap-4">
        <h1 className="text-th-t font-bold text-xl flex-1">Configuración</h1>
        <button
          onClick={guardar}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold btn-touch transition-colors text-sm
            ${guardado ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {guardado ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar</>}
        </button>
      </div>

      {/* Cuadrícula 2 columnas */}
      <div className="flex-1 overflow-hidden p-4 grid grid-cols-2 gap-4">

        {/* Columna izquierda */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="bg-th-s border border-th-b2 rounded-2xl p-4 space-y-3">
            <h2 className="text-th-t font-bold">Datos del negocio</h2>
            {campo('nombre_negocio', 'Nombre del negocio', 'Tienda...')}
            {campo('nit', 'NIT / Documento', '900.000.000-0')}
            {campo('telefono', 'Teléfono', '300 000 0000')}
            {campo('direccion', 'Dirección', 'Calle...')}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <Bascula />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="bg-th-s border border-th-b2 rounded-2xl p-4 space-y-3">
            <h2 className="text-th-t font-bold">Ticket de venta</h2>
            {campo('footer_ticket', 'Mensaje al pie', 'Gracias por su compra')}
            <div>
              <label className="block text-sm text-th-t2 mb-1">Tamaño de papel</label>
              <div className="flex gap-3">
                {['58', '80'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, tamano_papel: t })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium btn-touch transition-colors border-2
                      ${form.tamano_papel === t
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                        : 'border-th-b3 text-th-t3 hover:border-th-b2'}`}
                  >
                    {t}mm
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <MediosPago />
          </div>
        </div>
      </div>
    </div>
  )
}
