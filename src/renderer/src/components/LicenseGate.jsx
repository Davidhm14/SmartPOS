import { useState, useEffect } from 'react'
import { Key, ShieldCheck, Lock, AlertTriangle } from 'lucide-react'

const VALID_KEY = 'SmartByteCol2026@'

function diasDesde(fechaStr) {
  if (!fechaStr) return 0
  const [y, m, d] = fechaStr.split('-').map(Number)
  const desde = new Date(y, m - 1, d)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.floor((hoy - desde) / 86400000)
}

export default function LicenseGate({ children }) {
  const [estado, setEstado] = useState(null) // null | 'activo' | 'trial' | 'expirado'
  const [diasRestantes, setDiasRestantes] = useState(0)
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)

  useEffect(() => {
    window.api.getConfig().then(async (cfg) => {
      if (cfg.license_activated === '1') {
        setEstado('activo')
        return
      }

      let installDate = cfg.install_date
      if (!installDate) {
        const hoy = new Date()
        installDate = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
        await window.api.saveConfig({ install_date: installDate })
      }

      const dias = diasDesde(installDate)
      const restantes = Math.max(0, 3 - dias)
      setDiasRestantes(restantes)
      setEstado(restantes > 0 ? 'trial' : 'expirado')
      setMostrarModal(true)
    })
  }, [])

  const activar = async () => {
    setError('')
    if (clave.trim() !== VALID_KEY) {
      setError('Clave incorrecta. Verifica e intenta de nuevo.')
      return
    }
    await window.api.saveConfig({ license_activated: '1' })
    setExito(true)
    setTimeout(() => setEstado('activo'), 1500)
  }

  // Cargando o ya activo
  if (estado === null || estado === 'activo') return children

  // Modal de activación (trial o expirado)
  const bloqueado = estado === 'expirado'

  return (
    <>
      {/* App siempre visible en trial; bloqueada solo si expiró */}
      <div className={bloqueado ? 'pointer-events-none select-none opacity-20 h-full' : 'h-full'}>
        {children}
      </div>

      {/* Overlay */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4">
          <div className="bg-th-s rounded-2xl w-full max-w-sm shadow-2xl border border-th-b2">
            {/* Header */}
            <div className="flex flex-col items-center pt-6 pb-4 px-6 border-b border-th-b2">
              <div className={`rounded-2xl p-3 mb-3 ${bloqueado ? 'bg-red-600' : 'bg-blue-600'}`}>
                {bloqueado ? <Lock size={28} className="text-white" /> : <Key size={28} className="text-white" />}
              </div>
              <h2 className="text-th-t font-bold text-lg text-center">
                {bloqueado ? 'Licencia requerida' : 'Activar SmartPOS'}
              </h2>
              {!bloqueado && (
                <div className="flex items-center gap-1.5 mt-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-xl text-sm">
                  <AlertTriangle size={14} />
                  {diasRestantes === 1
                    ? 'Queda 1 día de prueba'
                    : `Quedan ${diasRestantes} días de prueba`}
                </div>
              )}
              {bloqueado && (
                <p className="text-th-t3 text-sm text-center mt-1">
                  El período de 3 días de prueba ha finalizado.
                  Ingresa tu clave para continuar.
                </p>
              )}
            </div>

            <div className="p-5 space-y-3">
              {exito ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <ShieldCheck size={44} className="text-green-500" />
                  <p className="text-th-t font-bold text-lg">¡Activado con éxito!</p>
                  <p className="text-th-t3 text-sm">SmartPOS está listo para usar.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-th-t2 mb-1">Clave de activación</label>
                    <input
                      autoFocus
                      type="password"
                      className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Ingresa tu clave..."
                      value={clave}
                      onChange={(e) => { setClave(e.target.value); setError('') }}
                      onKeyDown={(e) => e.key === 'Enter' && activar()}
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                  </div>

                  <button
                    onClick={activar}
                    disabled={!clave.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-th-s2 disabled:text-th-t4 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                  >
                    Activar licencia
                  </button>

                  {!bloqueado && (
                    <button
                      onClick={() => setMostrarModal(false)}
                      className="w-full bg-th-s2 hover:bg-th-s3 text-th-t3 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      Continuar en modo prueba ({diasRestantes} {diasRestantes === 1 ? 'día' : 'días'})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
