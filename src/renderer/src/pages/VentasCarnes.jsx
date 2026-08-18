import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, X, Landmark } from 'lucide-react'
import ModalPago from '../components/ModalPago'
import ModalPeso from '../components/ModalPeso'

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
        <p className="text-th-t font-bold text-center">{producto.nombre}</p>
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
  const [tickets, setTickets] = useState([])
  const [ticketActivoId, setTicketActivoId] = useState(null)
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [clientes, setClientes] = useState([])
  const [mostrarPago, setMostrarPago] = useState(false)
  const [productoPeso, setProductoPeso] = useState(null)
  const [productoOferta, setProductoOferta] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [nombreTmp, setNombreTmp] = useState('')

  useEffect(() => {
    window.api.listarCategorias().then(setCategorias)
    window.api.listarClientes().then(setClientes)
    cargarTickets()
  }, [])

  const cargarTickets = async () => {
    let ts = await window.api.ticketsListar()
    ts = ts.map((t) => ({
      ...t,
      items: (t.items || []).map((item) => ({ ...item, _cartId: ++cartIdCounter }))
    }))
    if (ts.length === 0) {
      const nuevo = await window.api.ticketsCrear('Mesa 1')
      ts = [{ ...nuevo, items: [] }]
    }
    setTickets(ts)
    setTicketActivoId(ts[0].id)
  }

  const cargarProductos = useCallback(async () => {
    const filtros = {}
    if (categoriaActiva) filtros.categoria_id = categoriaActiva
    if (busqueda) filtros.busqueda = busqueda
    setProductos(await window.api.listarProductos(filtros))
  }, [categoriaActiva, busqueda])

  useEffect(() => { cargarProductos() }, [cargarProductos])

  const ticketActivo = tickets.find((t) => t.id === ticketActivoId)
  const carrito = ticketActivo?.items || []

  const setCarrito = useCallback((updater) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketActivoId) return t
        const newItems = typeof updater === 'function' ? updater(t.items || []) : updater
        window.api.ticketsGuardar({ id: t.id, items: newItems.map(({ _cartId, ...rest }) => rest) })
        return { ...t, items: newItems }
      })
    )
  }, [ticketActivoId])

  const addToCartDirect = useCallback((producto, precio) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.id === producto.id && i.precio === precio)
      if (existente)
        return prev.map((i) =>
          i.id === producto.id && i.precio === precio ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      return [...prev, { ...producto, precio, cantidad: 1, _cartId: ++cartIdCounter }]
    })
  }, [setCarrito])

  const agregarAlCarrito = (producto) => {
    if (!ticketActivoId) return
    if (producto.venta_por_peso) { setProductoPeso(producto); return }
    if (producto.precio_oferta > 0) { setProductoOferta(producto); return }
    addToCartDirect(producto, producto.precio)
  }

  const cambiarCantidad = (cartId, cantidad) => {
    if (cantidad <= 0) setCarrito((prev) => prev.filter((i) => i._cartId !== cartId))
    else setCarrito((prev) => prev.map((i) => i._cartId === cartId ? { ...i, cantidad } : i))
  }

  const nuevoTicket = async () => {
    const num = tickets.length + 1
    const nuevo = await window.api.ticketsCrear(`Mesa ${num}`)
    setTickets((prev) => [...prev, { ...nuevo, items: [] }])
    setTicketActivoId(nuevo.id)
  }

  const cerrarTicket = async (id, e) => {
    e.stopPropagation()
    if (tickets.length === 1) return
    await window.api.ticketsEliminar(id)
    setTickets((prev) => {
      const restantes = prev.filter((t) => t.id !== id)
      if (ticketActivoId === id) setTicketActivoId(restantes[0].id)
      return restantes
    })
  }

  const iniciarRename = (e, id, nombre) => {
    e.stopPropagation()
    e.preventDefault()
    setEditandoId(id)
    setNombreTmp(nombre)
  }

  const confirmarRename = async () => {
    if (!nombreTmp.trim()) { setEditandoId(null); return }
    await window.api.ticketsRenombrar({ id: editandoId, nombre: nombreTmp.trim() })
    setTickets((prev) => prev.map((t) => t.id === editandoId ? { ...t, nombre: nombreTmp.trim() } : t))
    setEditandoId(null)
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
    await window.api.ticketsEliminar(ticketActivoId)
    let restantes = tickets.filter((t) => t.id !== ticketActivoId)
    if (restantes.length === 0) {
      const nuevo = await window.api.ticketsCrear('Mesa 1')
      restantes = [{ ...nuevo, items: [] }]
    }
    setTickets(restantes)
    setTicketActivoId(restantes[0].id)
    setMostrarPago(false)
    cargarProductos()
  }

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Panel izquierdo: lista de productos */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 border-r border-th-b2">
        <div className="px-2 pt-2 pb-1 space-y-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-th-t3" />
              <input
                type="text"
                placeholder="Buscar producto..."
                className="w-full bg-th-s border border-th-b2 rounded-xl pl-8 pr-3 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
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
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => setCategoriaActiva(null)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors btn-touch
                ${!categoriaActiva ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2 hover:bg-th-s2'}`}
            >Todos</button>
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoriaActiva(c.id === categoriaActiva ? null : c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors btn-touch
                  ${categoriaActiva === c.id ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2 hover:bg-th-s2'}`}
              >{c.nombre}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-touch px-2 pb-2 space-y-1">
          {productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-th-t3 text-sm">
              <p>No hay productos</p>
              <p className="text-xs mt-1">Agrega productos en el módulo Productos</p>
            </div>
          ) : productos.map((p) => (
            <button
              key={p.id}
              onClick={() => agregarAlCarrito(p)}
              className="w-full flex items-center px-3 py-2.5 bg-th-s hover:bg-th-s2 border border-th-b2 hover:border-blue-400 rounded-xl text-left btn-touch transition-colors"
            >
              <span className="flex-1 text-th-t text-sm font-medium truncate">{p.nombre}</span>
              {p.venta_por_peso && (
                <span className="text-xs text-th-t3 mr-2 shrink-0">kg</span>
              )}
              {p.precio_oferta > 0 ? (
                <span className="text-orange-500 font-bold text-sm mr-2 shrink-0">
                  ${Number(p.precio_oferta).toLocaleString('es-CO')}
                </span>
              ) : (
                <span className="text-blue-600 font-bold text-sm mr-2 shrink-0">
                  ${Number(p.precio).toLocaleString('es-CO')}
                </span>
              )}
              <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                +
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Panel derecho: tickets */}
      <div className="w-72 flex flex-col shrink-0 bg-th-bg">
        {/* Tabs de tickets */}
        <div className="flex items-center gap-1 px-2 pt-2 pb-1.5 overflow-x-auto no-scrollbar border-b border-th-b2">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setTicketActivoId(t.id)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors select-none
                ${ticketActivoId === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-th-s text-th-t2 hover:bg-th-s2 border border-th-b2'}`}
            >
              {editandoId === t.id ? (
                <input
                  autoFocus
                  value={nombreTmp}
                  onChange={(e) => setNombreTmp(e.target.value)}
                  onBlur={confirmarRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmarRename()
                    if (e.key === 'Escape') setEditandoId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 bg-transparent border-b border-current outline-none text-xs"
                />
              ) : (
                <span
                  onDoubleClick={(e) => iniciarRename(e, t.id, t.nombre)}
                  title="Doble clic para renombrar"
                >
                  {t.nombre}
                </span>
              )}
              {tickets.length > 1 && (
                <X
                  size={10}
                  onClick={(e) => cerrarTicket(t.id, e)}
                  className="opacity-60 hover:opacity-100 ml-0.5"
                />
              )}
            </div>
          ))}
          <button
            onClick={nuevoTicket}
            title="Nuevo ticket"
            className="shrink-0 w-7 h-7 flex items-center justify-center bg-th-s hover:bg-th-s2 border border-th-b2 rounded-lg text-th-t2 btn-touch transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Items del ticket activo */}
        <div className="flex-1 overflow-y-auto scroll-touch px-2 py-1.5 space-y-1">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-th-t4 text-xs">
              <p className="mb-1">Ticket vacío</p>
              <p>Toca un producto para agregar</p>
            </div>
          ) : carrito.map((item) => (
            <div key={item._cartId} className="bg-th-s rounded-xl px-2.5 py-2">
              <div className="flex justify-between items-start gap-1 mb-1.5">
                <span className="text-th-t text-xs font-semibold flex-1 leading-tight">{item.nombre}</span>
                <button
                  onClick={() => setCarrito((prev) => prev.filter((i) => i._cartId !== item._cartId))}
                  className="text-th-t4 hover:text-red-500 btn-touch shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => cambiarCantidad(item._cartId, item.cantidad - 1)}
                    className="bg-th-s2 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 text-th-t w-7 h-7 rounded-lg flex items-center justify-center btn-touch text-sm font-bold"
                  >−</button>
                  <span className="text-th-t font-bold text-sm w-5 text-center">{item.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(item._cartId, item.cantidad + 1)}
                    className="bg-th-s2 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 text-th-t w-7 h-7 rounded-lg flex items-center justify-center btn-touch text-sm font-bold"
                  >+</button>
                </div>
                <span className="text-blue-600 font-bold text-xs">
                  ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total y cobrar */}
        <div className="border-t border-th-b p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-th-t3 text-sm">Total</span>
            <span className="text-th-t font-bold text-xl">${total.toLocaleString('es-CO')}</span>
          </div>
          <button
            onClick={() => carrito.length > 0 && setMostrarPago(true)}
            disabled={carrito.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-th-s2 disabled:text-th-t4 text-white font-bold py-3 rounded-xl text-lg transition-colors btn-touch"
          >
            Cobrar · F12
          </button>
        </div>
      </div>

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
          onAgregar={(item) => {
            setCarrito((prev) => [...prev, { ...item, _cartId: ++cartIdCounter }])
            setProductoPeso(null)
          }}
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
