import { useState, useEffect, useRef } from 'react'
import { X, Scale, Wifi, WifiOff, RotateCcw } from 'lucide-react'

export default function ModalPeso({ producto, onAgregar, onCerrar }) {
  const [peso, setPeso] = useState(0)
  const [pesoManual, setPesoManual] = useState('')
  const [estable, setEstable] = useState(false)
  const [basculaConectada, setBasculaConectada] = useState(false)
  const [modoManual, setModoManual] = useState(false)
  const cleanupRef = useRef([])
  const confirmarRef = useRef(null)

  const precioKg = producto.precio_kg > 0 ? producto.precio_kg : producto.precio
  const pesoFinal = modoManual ? (parseFloat(pesoManual) || 0) : peso
  const total = pesoFinal * precioKg

  // Keep ref current so the keydown listener always calls the latest confirmar
  useEffect(() => { confirmarRef.current = () => { if (pesoFinal > 0) confirmar() } })

  // Enter key confirms from anywhere in the modal
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Enter') confirmarRef.current?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    window.api.basculaEstado().then(({ conectada, peso: p }) => {
      setBasculaConectada(conectada)
      if (conectada && p) { setPeso(p.peso); setEstable(p.estable) }
      if (!conectada) setModoManual(true)
    })

    const offPeso = window.api.onBasculaPeso(({ peso: p, estable: e }) => {
      setPeso(p); setEstable(e); setBasculaConectada(true)
    })
    const offDesconectada = window.api.onBasculaDesconectada(() => {
      setBasculaConectada(false); setModoManual(true)
    })

    cleanupRef.current = [offPeso, offDesconectada]
    return () => cleanupRef.current.forEach((fn) => fn && fn())
  }, [])

  const confirmar = () => {
    if (pesoFinal <= 0) return
    onAgregar({
      ...producto,
      cantidad: pesoFinal,
      precio: precioKg,
      _pesoKg: pesoFinal,
      nombre: `${producto.nombre} (${pesoFinal.toFixed(3)} kg)`
    })
    onCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-th-s rounded-2xl w-full max-w-sm shadow-2xl border border-th-b2">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-th-b2">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-blue-500" />
            <h2 className="text-th-t font-bold">Pesaje</h2>
          </div>
          <button onClick={onCerrar} className="text-th-t3 hover:text-th-t btn-touch">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Producto */}
          <div className="bg-th-bg rounded-xl px-4 py-3">
            <p className="text-th-t3 text-xs">Producto</p>
            <p className="text-th-t font-semibold">{producto.nombre}</p>
            <p className="text-blue-600 text-sm">${precioKg.toLocaleString('es-CO')} / kg</p>
          </div>

          {/* Estado báscula */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
            ${basculaConectada ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-th-s2 text-th-t3'}`}>
            {basculaConectada
              ? <><Wifi size={14} /> Báscula conectada</>
              : <><WifiOff size={14} /> Báscula no conectada — ingreso manual</>}
          </div>

          {/* Lectura de peso */}
          {!modoManual ? (
            <div className="text-center space-y-2">
              <div className={`bg-th-bg rounded-2xl py-6 border-2 transition-colors
                ${estable ? 'border-green-500' : 'border-th-b3'}`}>
                <p className={`text-5xl font-bold font-mono tracking-wider
                  ${estable ? 'text-th-t' : 'text-th-t3'}`}>
                  {peso.toFixed(3)}
                </p>
                <p className="text-th-t3 text-sm mt-1">kg</p>
                {!estable && <p className="text-yellow-600 text-xs mt-1 animate-pulse">Estabilizando...</p>}
                {estable && peso > 0 && <p className="text-green-600 text-xs mt-1">✓ Estable</p>}
              </div>
              <button onClick={() => setModoManual(true)} className="text-th-t3 hover:text-th-t text-xs btn-touch underline">
                Ingresar peso manualmente
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-th-t3 text-xs">Peso en kilogramos</label>
              <div className="flex gap-2">
                <input
                  type="number" step="0.001" min="0" autoFocus
                  className="flex-1 bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t text-2xl font-bold font-mono focus:outline-none focus:border-blue-500 text-center"
                  placeholder="0.000"
                  value={pesoManual}
                  onChange={(e) => setPesoManual(e.target.value)}
                />
                {basculaConectada && (
                  <button onClick={() => setModoManual(false)} className="bg-th-s2 hover:bg-th-s3 text-th-t2 p-3 rounded-xl btn-touch" title="Volver a báscula">
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Total calculado */}
          <div className={`bg-th-bg rounded-xl p-4 transition-opacity ${pesoFinal > 0 ? 'opacity-100' : 'opacity-40'}`}>
            <div className="flex justify-between text-sm text-th-t3 mb-1">
              <span>{pesoFinal.toFixed(3)} kg × ${precioKg.toLocaleString('es-CO')}/kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-th-t2 font-medium">Total</span>
              <span className="text-th-t text-2xl font-bold">${total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-th-s2 hover:bg-th-s3 text-th-t font-semibold py-3 rounded-xl btn-touch">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={pesoFinal <= 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-th-s2 disabled:text-th-t4 text-white font-bold py-3 rounded-xl btn-touch"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
