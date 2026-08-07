import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppContext } from './context'
import Navbar from './components/Navbar'
import Setup from './components/Setup'
import LicenseGate from './components/LicenseGate'
import Ventas from './pages/Ventas'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import Inventario from './pages/Inventario'

export default function App() {
  const [setupDone, setSetupDone] = useState(null)
  const [config, setConfig] = useState({})
  const [userDataPath, setUserDataPath] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('pos-theme') || 'dark')

  useEffect(() => {
    window.api.getConfig().then((cfg) => {
      setConfig(cfg)
      setSetupDone(cfg.setup_done === '1')
    })
    window.api.getUserDataPath().then(setUserDataPath)
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('pos-theme', next)
      return next
    })
  }

  if (setupDone === null) {
    return (
      <div className={`flex items-center justify-center h-full bg-th-bg ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="text-th-t3 text-xl">Cargando...</div>
      </div>
    )
  }

  if (!setupDone) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <Setup onComplete={() => {
          window.api.getConfig().then((cfg) => { setConfig(cfg); setSetupDone(true) })
        }} />
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ userDataPath, theme, toggleTheme }}>
      <div className={`h-full ${theme === 'dark' ? 'dark' : ''}`}>
        <LicenseGate>
          <HashRouter>
            <div className="flex h-full overflow-hidden bg-th-bg">
              <Navbar config={config} />
              <main className="flex-1 overflow-hidden bg-th-bg">
                <Routes>
                  <Route path="/" element={<Navigate to="/ventas" replace />} />
                  <Route path="/ventas" element={<Ventas config={config} />} />
                  <Route path="/productos" element={<Productos />} />
                  <Route path="/inventario" element={<Inventario />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route
                    path="/configuracion"
                    element={<Configuracion config={config} onSave={(cfg) => setConfig(cfg)} />}
                  />
                </Routes>
              </main>
            </div>
          </HashRouter>
        </LicenseGate>
      </div>
    </AppContext.Provider>
  )
}
