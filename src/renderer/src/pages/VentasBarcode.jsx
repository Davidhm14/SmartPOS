import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Landmark } from 'lucide-react'
import ProductoCard from '../components/ProductoCard'
import Carrito from '../components/Carrito'
import ModalPago from '../components/ModalPago'
import ModalPeso from '../components/ModalPeso'

const LETRAS = ['Todos','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']

let cartIdCounter = 0

function generarTicketHTML(config, items, total, metodo, cambio, fecha) {
  const ancho = config.tamano_papel === '58' ? '58mm' : '80mm'
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; font-size:12px; width:${ancho}; }
      .c { text-align:center; } .r { text-align:right; } .b { font-weight:bold; }
      .lg { font-size:14px; } .line { border-top:1px dashed #000; margin:4px 0; }
      table { width:100%; } td { padding:1px 0; vertical-align:top; }
      @media print { @page { margin:0; size:${ancho} auto; } }
    </style></head><body>
    <div class="c b lg">${config.nombre_negocio || 'POS'}</div>
    ${config.nit ? `<div class="c">NIT: ${config.nit}</div>` : ''}
    ${config.telefono ? `<div class="c">Tel: ${config.telefono}</div>` : ''}
    ${config.direccion ? `<div class="c">${config.direccion}</div>` : ''}
    <div class="line"></div>
    <div class="c">${fecha}</div>
    <div class="line"></div>
    <table>${items.map(i =>
      `<tr><td>${i.nombre} x${i.cantidad}<br/><span style="font-size:10px">$${Number(i.precio).toLocaleString('es-CO')} c/u</span></td>
       <td class="r b">$${(i.precio * i.cantidad).toLocaleString('es-CO')}</td></tr>`
    ).join('')}</table>
    <div class="line"></div>
    <table>
      <tr><td class="b lg">TOTAL</td><td class="r b lg">$${total.toLocaleString('es-CO')}</td></tr>
      <tr><td>${metodo}</td><td></td></tr>
      ${cambio > 0 ? `<tr><td>Cambio</td><td class="r">$${cambio.toLocaleString('es-CO')}</td></tr>` : ''}
    </table>
    <div class="line"></div>
    <div class="c">${config.footer_ticket || 'Gracias por su compra'}</div>
    <br/><br/></body></html>`
}

function PrecioSelector({ producto, onSeleccionar, onCerrar }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-40 p-4" onClick={onCerrar}>
      <div className="bg-th-s rounded-2xl w-full max-w-sm p-5 space-y-3 border border-th-b2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-th-t font-bold text-center">{producto.descripcion?.trim() || producto.nombre}</p>
        <p className="text-th-t3 text-sm text-center">Selecciona el precio de venta</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSeleccionar(producto, producto.precio)}
            className="bg-th-s2 hover:bg-th-s3 rounded-xl p-4 text-center btn-touch"
          >
            <p className="text-th-t3 text-xs mb-1">Precio normal</p>
            <p className="text-th-t font-bold text-xl">${Number(producto.precio).toLocaleString('es-CO')}</p>
          </button>
          <button
            onClick={() => onSeleccionar(producto, producto.precio_oferta)}
            className="bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-xl p-4 text-center btn-touch"
          >
            <p className="text-orange-600 text-xs font-semibold mb-1">Precio oferta</p>
            <p className="text-orange-600 font-bold text-xl">${Number(producto.precio_oferta).toLocaleString('es-CO')}</p>
          </button>
        </div>
        <button onClick={onCerrar} className="w-full text-th-t3 text-sm py-2 btn-touch">Cancelar</button>
      </div>
    </div>
  )
}

export default function Ventas({ config }) {
  const [productos, setProductos] = useState([])
  const [todosProductos, setTodosProductos] = useState([])
  const [letraActiva, setLetraActiva] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [clientes, setClientes] = useState([])
  const [mostrarPago, setMostrarPago] = useState(false)
  const [productoPeso, setProductoPeso] = useState(null)
  const [productoOferta, setProductoOferta] = useState(null)
  const inputRef = useRef(null)

  const cargarProductos = useCallback(async () => {
    const filtros = {}
    if (busqueda) filtros.busqueda = busqueda
    const data = await window.api.listarProductos(filtros)
    setTodosProductos(data)
  }, [busqueda])

  useEffect(() => { cargarProductos() }, [cargarProductos])
  useEffect(() => { window.api.listarClientes().then(setClientes) }, [])

  useEffect(() => {
    if (letraActiva === 'Todos') {
      setProductos(todosProductos)
    } else {
      setProductos(todosProductos.filter((p) => {
        const display = (p.descripcion?.trim() || p.nombre || '').toUpperCase()
        return display.startsWith(letraActiva)
      }))
    }
  }, [letraActiva, todosProductos])

  useEffect(() => {
    if (busqueda) setLetraActiva('Todos')
  }, [busqueda])

  const addToCartDirect = (producto, precio) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.id === producto.id && i.precio === precio)
      if (existente) return prev.map((i) => i.id === producto.id && i.precio === precio ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { ...producto, precio, cantidad: 1, _cartId: ++cartIdCounter }]
    })
    if (busqueda) { setBusqueda(''); inputRef.current?.focus() }
  }

  const handleSearchKeyDown = async (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const term = busqueda.trim()
    if (!term) return
    const data = await window.api.listarProductos({ busqueda: term })
    if (!data.length) return
    const termUpper = term.toUpperCase()
    const exacto = data.find(
      (p) =>
        (p.descripcion?.trim() || '').toUpperCase() === termUpper ||
        p.nombre.toUpperCase() === termUpper
    )
    const producto = exacto ?? (data.length === 1 ? data[0] : null)
    if (producto) agregarAlCarrito(producto)
  }

  const agregarAlCarrito = (producto) => {
    if (producto.venta_por_peso) { setProductoPeso(producto); return }
    if (producto.precio_oferta > 0) { setProductoOferta(producto); return }
    addToCartDirect(producto, producto.precio)
  }

  const agregarPesado = (item) => {
    setCarrito((prev) => [...prev, { ...item, _cartId: ++cartIdCounter }])
  }

  const cambiarCantidad = (cartId, cantidad) => {
    if (cantidad <= 0) setCarrito((prev) => prev.filter((i) => i._cartId !== cartId))
    else setCarrito((prev) => prev.map((i) => i._cartId === cartId ? { ...i, cantidad } : i))
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F12') {
        e.preventDefault()
        if (carrito.length > 0 && !mostrarPago && !productoPeso) setMostrarPago(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [carrito.length, mostrarPago, productoPeso])

  const handleConfirmarPago = async ({ metodo_pago, efectivo_recibido, cambio, cliente_id, imprimir }) => {
    const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)
    await window.api.crearVenta({ items: carrito, total, metodo_pago, efectivo_recibido, cambio, cliente_id })
    if (imprimir) {
      const html = generarTicketHTML(config, carrito, total, metodo_pago, cambio, new Date().toLocaleString('es-CO'))
      await window.api.imprimirTicket(html)
    } else {
      window.api.abrirCaja()
    }
    setCarrito([])
    setMostrarPago(false)
    cargarProductos()
  }

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="px-2 pt-2 pb-1 space-y-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-th-t3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar por codigo o descripcion..."
                className="w-full bg-th-s border border-th-b2 rounded-xl pl-8 pr-3 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <button
              onClick={() => window.api.abrirCaja()}
              title="Abrir caja sin venta"
              className="shrink-0 bg-th-s border border-th-b2 hover:bg-th-s2 text-th-t2 hover:text-th-t rounded-xl px-3 flex items-center gap-1.5 btn-touch transition-colors"
            >
              <Landmark size={15} />
              <span className="text-xs font-medium">Abrir caja</span>
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {LETRAS.map((l) => (
              <button
                key={l}
                onClick={() => { setLetraActiva(l); setBusqueda('') }}
                className={`shrink-0 min-w-[28px] px-1.5 py-1.5 rounded-lg text-xs font-bold transition-colors btn-touch
                  ${letraActiva === l ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2 hover:bg-th-s2'}`}
              >
                {l === 'Todos' ? 'Todo' : l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 scroll-touch px-2 pb-2">
          {productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-th-t3 text-sm">
              <p>No hay productos</p>
              <p className="text-xs mt-1">Agrega productos en el modulo Productos</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
              {productos.map((p) => (
                <ProductoCard key={p.id} producto={p} onClick={agregarAlCarrito} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Carrito
        items={carrito}
        onCambiarCantidad={cambiarCantidad}
        onEliminar={(cartId) => setCarrito((prev) => prev.filter((i) => i._cartId !== cartId))}
        onCobrar={() => setMostrarPago(true)}
      />

      {mostrarPago && (
        <ModalPago
          total={total}
          clientes={clientes}
          onConfirmar={handleConfirmarPago}
          onCerrar={() => setMostrarPago(false)}
        />
      )}

      {productoPeso && (
        <ModalPeso
          producto={productoPeso}
          onAgregar={agregarPesado}
          onCerrar={() => setProductoPeso(null)}
        />
      )}

      {productoOferta && (
        <PrecioSelector
          producto={productoOferta}
          onSeleccionar={(p, precio) => { addToCartDirect(p, precio); setProductoOferta(null) }}
          onCerrar={() => setProductoOferta(null)}
        />
      )}
    </div>
  )
}
