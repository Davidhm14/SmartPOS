import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, X, Phone, Mail, History } from 'lucide-react'

function ModalCliente({ cliente, onGuardar, onCerrar }) {
  const [form, setForm] = useState(cliente || { nombre: '', telefono: '', email: '' })

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-th-s rounded-2xl w-full max-w-md shadow-2xl border border-th-b2 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-th-t font-bold text-xl">{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <button onClick={onCerrar} className="text-th-t3 hover:text-th-t btn-touch"><X size={24} /></button>
        </div>
        {[['nombre','Nombre *','Nombre completo'],['telefono','Teléfono','300 000 0000'],['email','Email','correo@ejemplo.com']].map(([k,l,p]) => (
          <div key={k}>
            <label className="block text-sm text-th-t2 mb-1">{l}</label>
            <input className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t focus:outline-none focus:border-blue-500"
              value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={p} />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={onCerrar} className="flex-1 bg-th-s2 hover:bg-th-s3 text-th-t py-3 rounded-xl btn-touch font-semibold">Cancelar</button>
          <button
            onClick={() => form.nombre.trim() && onGuardar(form)}
            disabled={!form.nombre.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-th-s2 text-white font-bold py-3 rounded-xl btn-touch"
          >Guardar</button>
        </div>
      </div>
    </div>
  )
}

function ModalHistorial({ cliente, onCerrar }) {
  const [historial, setHistorial] = useState([])

  useEffect(() => {
    window.api.historialCliente(cliente.id).then(setHistorial)
  }, [cliente.id])

  const total = historial.reduce((s, v) => s + v.total, 0)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-th-s rounded-2xl w-full max-w-lg shadow-2xl border border-th-b2 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-th-b2">
          <div>
            <h2 className="text-th-t font-bold text-xl">Historial de {cliente.nombre}</h2>
            <p className="text-th-t3 text-sm">{historial.length} compras · Total: ${total.toLocaleString('es-CO')}</p>
          </div>
          <button onClick={onCerrar} className="text-th-t3 hover:text-th-t btn-touch"><X size={24} /></button>
        </div>
        <div className="flex-1 scroll-touch p-4 space-y-2">
          {historial.length === 0 ? (
            <p className="text-th-t4 text-center py-8">Sin compras registradas</p>
          ) : historial.map((v) => (
            <div key={v.id} className="bg-th-s2 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-th-t text-sm font-medium">{v.fecha}</p>
                <p className="text-th-t3 text-xs">{v.metodo_pago}</p>
              </div>
              <span className="text-blue-600 font-bold">${Number(v.total).toLocaleString('es-CO')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [historial, setHistorial] = useState(null)

  const cargar = async (b) => {
    const data = await window.api.listarClientes(b || undefined)
    setClientes(data)
  }

  useEffect(() => { cargar(busqueda) }, [busqueda])

  const guardar = async (data) => {
    if (data.id) await window.api.actualizarCliente(data)
    else await window.api.crearCliente(data)
    setModal(null)
    cargar(busqueda)
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    await window.api.eliminarCliente(id)
    cargar(busqueda)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-th-b">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-th-t font-bold text-2xl flex-1">Clientes</h1>
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold btn-touch"
          >
            <Plus size={16} /> Nuevo cliente
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-t3" />
          <input
            className="w-full bg-th-s border border-th-b2 rounded-xl pl-9 pr-4 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
            placeholder="Buscar por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 scroll-touch p-4 space-y-2">
        {clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-th-t4 gap-3">
            <p className="text-lg">{busqueda ? 'Sin resultados' : 'No hay clientes'}</p>
            {!busqueda && (
              <button onClick={() => setModal({})} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold btn-touch">
                Agregar primer cliente
              </button>
            )}
          </div>
        ) : clientes.map((c) => (
          <div key={c.id} className="bg-th-s border border-th-b2 rounded-xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-600/15 rounded-full flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-bold text-lg">{c.nombre[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-th-t font-semibold">{c.nombre}</p>
              <div className="flex gap-3 mt-0.5">
                {c.telefono && <span className="text-th-t3 text-xs flex items-center gap-1"><Phone size={11} />{c.telefono}</span>}
                {c.email && <span className="text-th-t3 text-xs flex items-center gap-1"><Mail size={11} />{c.email}</span>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setHistorial(c)} className="bg-th-s2 hover:bg-th-s3 text-th-t p-2 rounded-xl btn-touch transition-colors" title="Historial">
                <History size={16} />
              </button>
              <button onClick={() => setModal(c)} className="bg-th-s2 hover:bg-blue-600 hover:text-white text-th-t p-2 rounded-xl btn-touch transition-colors">
                <Pencil size={16} />
              </button>
              <button onClick={() => eliminar(c.id)} className="bg-th-s2 hover:bg-red-600 hover:text-white text-th-t p-2 rounded-xl btn-touch transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal !== null && <ModalCliente cliente={modal.id ? modal : null} onGuardar={guardar} onCerrar={() => setModal(null)} />}
      {historial && <ModalHistorial cliente={historial} onCerrar={() => setHistorial(null)} />}
    </div>
  )
}
