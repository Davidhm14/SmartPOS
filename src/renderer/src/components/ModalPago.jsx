import { useState, useEffect } from 'react'
import { X, Check, Plus, Trash2 } from 'lucide-react'
import { getPaymentLogo, EfectivoLogo, TransferenciaLogo } from '../utils/paymentLogos'

function MetodoBtn({ metodo, activo, onClick }) {
  const Logo = getPaymentLogo(metodo.nombre) || TransferenciaLogo
  const esEfectivo = metodo.nombre.toLowerCase() === 'efectivo'
  const LogoEl = esEfectivo ? EfectivoLogo : Logo
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-colors btn-touch
        ${activo ? 'border-blue-500 bg-blue-500/10' : 'border-th-b3 hover:border-th-b2'}`}
    >
      <LogoEl size={34} />
      <span className={`text-xs font-semibold text-center leading-tight ${activo ? 'text-blue-600' : 'text-th-t2'}`}>
        {metodo.nombre}
      </span>
    </button>
  )
}

export default function ModalPago({ total, onConfirmar, onCerrar, clientes }) {
  const [metodos, setMetodos] = useState([])
  const [metodo, setMetodo] = useState(null)
  const [efectivo, setEfectivo] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [exito, setExito] = useState(false)
  const [mixto, setMixto] = useState(false)
  const [lineas, setLineas] = useState([{ metodo: '', monto: '' }, { metodo: '', monto: '' }])

  useEffect(() => {
    window.api.listarMediosPago().then((lista) => {
      setMetodos(lista)
      if (lista.length > 0) {
        setMetodo(lista[0].nombre)
        setLineas([{ metodo: lista[0].nombre, monto: '' }, { metodo: lista.length > 1 ? lista[1].nombre : '', monto: '' }])
      }
    })
  }, [])

  // ── Modo simple ──
  const esEfectivo = metodo?.toLowerCase() === 'efectivo'
  const cambio = esEfectivo && efectivo ? Math.max(0, Number(efectivo) - total) : 0
  const puedeConfirmar = metodo && (!esEfectivo || Number(efectivo) >= total)
  const numerosRapidos = esEfectivo
    ? [...new Set([
        Math.ceil(total / 1000) * 1000,
        Math.ceil(total / 5000) * 5000,
        Math.ceil(total / 10000) * 10000,
        Math.ceil(total / 50000) * 50000,
      ])].filter((v) => v >= total).slice(0, 4)
    : []

  // ── Modo mixto ──
  const totalPagado = lineas.reduce((s, l) => s + (Number(l.monto) || 0), 0)
  const pendiente = Math.max(0, total - totalPagado)
  const totalEfectivo = lineas.filter((l) => l.metodo.toLowerCase() === 'efectivo').reduce((s, l) => s + (Number(l.monto) || 0), 0)
  const totalNoEfectivo = totalPagado - totalEfectivo
  const cambioMixto = Math.max(0, totalEfectivo - Math.max(0, total - totalNoEfectivo))
  const puedeConfirmarMixto = totalPagado >= total && lineas.some((l) => l.metodo && Number(l.monto) > 0)

  const updateLinea = (idx, field, value) =>
    setLineas((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))

  const addLinea = () => setLineas((prev) => [...prev, { metodo: metodos[0]?.nombre || '', monto: '' }])
  const removeLinea = (idx) => setLineas((prev) => prev.filter((_, i) => i !== idx))

  const confirmar = async (imprimir) => {
    if (mixto) {
      if (!puedeConfirmarMixto) return
      const lineasValidas = lineas.filter((l) => l.metodo && Number(l.monto) > 0)
      const metodoPago = lineasValidas.map((l) => l.metodo).join(' + ')
      await onConfirmar({
        metodo_pago: metodoPago,
        efectivo_recibido: totalEfectivo,
        cambio: cambioMixto,
        cliente_id: clienteId || null,
        imprimir
      })
    } else {
      if (!puedeConfirmar) return
      await onConfirmar({
        metodo_pago: metodo,
        efectivo_recibido: esEfectivo ? Number(efectivo) : total,
        cambio,
        cliente_id: clienteId || null,
        imprimir
      })
    }
    setExito(true)
    setTimeout(onCerrar, 1600)
  }

  if (exito) {
    const metodoMostrar = mixto
      ? lineas.filter((l) => l.metodo && Number(l.monto) > 0).map((l) => l.metodo).join(' + ')
      : metodo
    const cambioMostrar = mixto ? cambioMixto : cambio
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-green-600 rounded-3xl p-10 flex flex-col items-center gap-3 shadow-2xl">
          <div className="bg-white/20 rounded-full p-4">
            <Check size={52} className="text-white" />
          </div>
          <p className="text-white text-3xl font-bold">¡Venta registrada!</p>
          <p className="text-white/80 text-lg">{metodoMostrar}</p>
          {cambioMostrar > 0 && (
            <p className="text-white/90 text-xl">
              Cambio: <strong>${cambioMostrar.toLocaleString('es-CO')}</strong>
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
      <div className="bg-th-s rounded-2xl w-full max-w-md shadow-2xl border border-th-b2 flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-th-b2 shrink-0">
          <h2 className="text-th-t font-bold text-lg">Registrar pago</h2>
          <button onClick={onCerrar} className="text-th-t3 hover:text-th-t btn-touch">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Total */}
          <div className="bg-th-bg rounded-xl p-3 text-center">
            <p className="text-th-t3 text-xs">Total a cobrar</p>
            <p className="text-th-t text-4xl font-bold">${total.toLocaleString('es-CO')}</p>
          </div>

          {/* Toggle simple / mixto */}
          <div className="flex bg-th-s2 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMixto(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors btn-touch
                ${!mixto ? 'bg-blue-600 text-white' : 'text-th-t3 hover:text-th-t'}`}
            >
              Un método
            </button>
            <button
              onClick={() => setMixto(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors btn-touch
                ${mixto ? 'bg-blue-600 text-white' : 'text-th-t3 hover:text-th-t'}`}
            >
              Pago mixto
            </button>
          </div>

          {/* ── MODO SIMPLE ── */}
          {!mixto && (
            <>
              <div>
                <p className="text-th-t3 text-xs mb-2">Método de pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {metodos.map((m) => (
                    <MetodoBtn
                      key={m.id}
                      metodo={m}
                      activo={metodo === m.nombre}
                      onClick={() => { setMetodo(m.nombre); setEfectivo('') }}
                    />
                  ))}
                </div>
              </div>

              {esEfectivo && (
                <div className="space-y-2">
                  <p className="text-th-t3 text-xs">Efectivo recibido</p>
                  <input
                    type="number"
                    className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t text-2xl font-bold focus:outline-none focus:border-blue-500 text-center"
                    placeholder="0"
                    value={efectivo}
                    onChange={(e) => setEfectivo(e.target.value)}
                    autoFocus
                  />
                  {numerosRapidos.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {numerosRapidos.map((n) => (
                        <button
                          key={n}
                          onClick={() => setEfectivo(String(n))}
                          className="bg-th-s2 hover:bg-th-s3 text-th-t text-xs py-2 rounded-lg btn-touch font-medium"
                        >
                          ${n.toLocaleString('es-CO')}
                        </button>
                      ))}
                    </div>
                  )}
                  {efectivo && Number(efectivo) >= total && (
                    <div className="bg-green-100 dark:bg-green-900/40 border border-green-400 dark:border-green-700 rounded-xl p-3 text-center">
                      <p className="text-th-t3 text-xs">Cambio</p>
                      <p className="text-green-700 dark:text-green-400 text-2xl font-bold">${cambio.toLocaleString('es-CO')}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── MODO MIXTO ── */}
          {mixto && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-th-t3 text-xs">Distribución del pago</p>
                <div className={`text-xs font-bold px-2 py-1 rounded-lg ${pendiente > 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                  {pendiente > 0 ? `Faltan $${pendiente.toLocaleString('es-CO')}` : 'Completo'}
                </div>
              </div>

              {lineas.map((linea, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    className="flex-1 bg-th-s2 border border-th-b3 rounded-xl px-3 py-2.5 text-th-t text-sm focus:outline-none focus:border-blue-500"
                    value={linea.metodo}
                    onChange={(e) => updateLinea(idx, 'metodo', e.target.value)}
                  >
                    <option value="">— Método —</option>
                    {metodos.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                  </select>
                  <input
                    type="number" min="0"
                    className="w-28 bg-th-s2 border border-th-b3 rounded-xl px-3 py-2.5 text-th-t text-sm font-bold focus:outline-none focus:border-blue-500 text-right"
                    placeholder="$0"
                    value={linea.monto}
                    onChange={(e) => updateLinea(idx, 'monto', e.target.value)}
                  />
                  {lineas.length > 2 && (
                    <button onClick={() => removeLinea(idx)} className="text-th-t4 hover:text-red-500 btn-touch p-1">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addLinea}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm btn-touch py-1"
              >
                <Plus size={15} /> Agregar método
              </button>

              {cambioMixto > 0 && (
                <div className="bg-green-100 dark:bg-green-900/40 border border-green-400 dark:border-green-700 rounded-xl p-3 text-center">
                  <p className="text-th-t3 text-xs">Cambio en efectivo</p>
                  <p className="text-green-700 dark:text-green-400 text-xl font-bold">${cambioMixto.toLocaleString('es-CO')}</p>
                </div>
              )}
            </div>
          )}

          {/* Cliente opcional */}
          {clientes && clientes.length > 0 && (
            <div>
              <p className="text-th-t3 text-xs mb-1">Cliente (opcional)</p>
              <select
                className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-2.5 text-th-t focus:outline-none focus:border-blue-500"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">— Sin cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 shrink-0 flex gap-3">
          <button
            onClick={() => confirmar(false)}
            disabled={mixto ? !puedeConfirmarMixto : !puedeConfirmar}
            className="flex-1 bg-th-s2 hover:bg-th-s3 disabled:opacity-40 text-th-t font-bold py-3 rounded-xl text-sm transition-colors btn-touch border border-th-b3"
          >
            Solo cobrar
          </button>
          <button
            onClick={() => confirmar(true)}
            disabled={mixto ? !puedeConfirmarMixto : !puedeConfirmar}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-th-s2 disabled:text-th-t4 text-white font-bold py-3 rounded-xl text-sm transition-colors btn-touch"
          >
            Cobrar e imprimir
          </button>
        </div>
      </div>
    </div>
  )
}
