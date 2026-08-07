import { NavLink } from 'react-router-dom'
import { ShoppingCart, Package, Users, BarChart2, Settings, Store, Sun, Moon, Warehouse } from 'lucide-react'
import { useAppContext } from '../context'

const links = [
  { to: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { to: '/productos', icon: Package, label: 'Productos' },
  { to: '/inventario', icon: Warehouse, label: 'Inventario' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/reportes', icon: BarChart2, label: 'Reportes' },
  { to: '/configuracion', icon: Settings, label: 'Config' }
]

export default function Navbar({ config }) {
  const { theme, toggleTheme } = useAppContext()

  return (
    <nav className="w-16 bg-th-bg border-r border-th-b flex flex-col items-center py-3 gap-1 shrink-0">
      <div className="mb-3 flex flex-col items-center">
        <div className="bg-blue-600 rounded-lg p-1.5 mb-1">
          <Store size={18} className="text-white" />
        </div>
        <span className="text-th-t4 text-center leading-tight max-w-[56px] truncate" style={{ fontSize: '9px' }}>
          {config?.nombre_negocio || 'POS'}
        </span>
      </div>

      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 w-14 py-2.5 rounded-xl transition-colors btn-touch
            ${isActive ? 'bg-blue-600 text-white' : 'text-th-t3 hover:bg-th-s2 hover:text-th-t'}`
          }
        >
          <Icon size={20} />
          <span style={{ fontSize: '10px' }} className="font-medium">{label}</span>
        </NavLink>
      ))}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="mt-auto text-th-t3 hover:text-th-t btn-touch p-2 rounded-xl hover:bg-th-s2 transition-colors"
        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </nav>
  )
}
