import { useState } from 'react'
import { Store } from 'lucide-react'

export default function Setup({ onComplete }) {
  const [form, setForm] = useState({
    nombre_negocio: '',
    nit: '',
    telefono: '',
    direccion: '',
    footer_ticket: 'Gracias por su compra'
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!form.nombre_negocio.trim()) return
    setLoading(true)
    await window.api.saveConfig({ ...form, setup_done: '1' })
    onComplete()
  }

  const campo = (key, label, placeholder, required = false) => (
    <div>
      <label className="block text-xs text-th-t2 mb-0.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        className="w-full bg-th-s2 border border-th-b3 rounded-lg px-3 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  )

  return (
    <div className="flex items-center justify-center h-full bg-th-bg">
      <div className="bg-th-s rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-th-b2">
        {/* Header compacto */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 rounded-xl p-2 shrink-0">
            <Store size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-th-t leading-tight">Configuración inicial</h1>
            <p className="text-th-t3 text-xs">Datos de tu negocio</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {campo('nombre_negocio', 'Nombre del negocio', 'Ej: Tienda Doña Rosa', true)}
          {campo('nit', 'NIT / Documento', 'Ej: 900.123.456-7')}
          {campo('telefono', 'Teléfono', 'Ej: 300 123 4567')}
          {campo('direccion', 'Dirección', 'Ej: Calle 24 # 15-30')}
          {campo('footer_ticket', 'Mensaje en el ticket', 'Gracias por su compra')}
        </div>

        <button
          onClick={handleSave}
          disabled={!form.nombre_negocio.trim() || loading}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-th-s2 disabled:text-th-t4 text-white font-bold py-2.5 rounded-xl text-sm transition-colors btn-touch"
        >
          {loading ? 'Guardando...' : 'Comenzar'}
        </button>
      </div>
    </div>
  )
}
