import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ImageOff, Search, Tag, X, PlusCircle } from 'lucide-react'
import { useAppContext } from '../context'

function ModalProducto({ producto, categorias: initCats, onGuardar, onCerrar }) {
  const { userDataPath } = useAppContext()
  const toImgSrc = (f) =>
    userDataPath && f ? `file:///${userDataPath.replace(/\\/g, '/')}/imagenes/${f}` : null

  const [form, setForm] = useState(
    producto
      ? { ...producto }
      : { nombre: '', precio: '', precio_costo: '', precio_oferta: '', categoria_id: '', imagen: '', stock: 0, descripcion: '', venta_por_peso: 0, precio_kg: 0 }
  )
  const [imagenPreview, setImagenPreview] = useState(
    producto?.imagen ? toImgSrc(producto.imagen) : null
  )
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState(initCats)
  const [nuevaCat, setNuevaCat] = useState('')
  const [mostrarNuevaCat, setMostrarNuevaCat] = useState(false)
  const [creandoCat, setCreandoCat] = useState(false)

  const seleccionarImagen = async () => {
    const sourcePath = await window.api.abrirSelectorImagen()
    if (!sourcePath) return
    const filename = await window.api.copiarImagen(sourcePath)
    setForm((f) => ({ ...f, imagen: filename }))
    setImagenPreview(toImgSrc(filename))
  }

  const crearCategoria = async () => {
    if (!nuevaCat.trim()) return
    setCreandoCat(true)
    try {
      const result = await window.api.crearCategoria(nuevaCat.trim())
      const cats = await window.api.listarCategorias()
      setCategorias(cats)
      setForm((f) => ({ ...f, categoria_id: result.id }))
      setNuevaCat('')
      setMostrarNuevaCat(false)
    } finally {
      setCreandoCat(false)
    }
  }

  const guardar = async () => {
    if (!form.nombre.trim() || !form.precio) return
    setLoading(true)
    try {
      await onGuardar({
        ...form,
        precio: Number(form.precio),
        precio_costo: Number(form.precio_costo || 0),
        precio_oferta: Number(form.precio_oferta || 0),
        stock: Number(form.stock || 0),
        venta_por_peso: form.venta_por_peso ? 1 : 0,
        precio_kg: Number(form.precio_kg || 0)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-th-s rounded-2xl w-full max-w-lg shadow-2xl border border-th-b2 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-th-b2">
          <h2 className="text-th-t font-bold text-xl">
            {producto ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onCerrar} className="text-th-t3 hover:text-th-t btn-touch">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Imagen */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={seleccionarImagen}
              className="w-28 h-28 bg-th-s2 hover:bg-th-s3 rounded-2xl border-2 border-dashed border-th-b3 hover:border-blue-500 flex flex-col items-center justify-center overflow-hidden transition-colors btn-touch"
            >
              {imagenPreview ? (
                <img src={imagenPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageOff size={26} className="text-th-t3 mb-1" />
                  <span className="text-xs text-th-t3">Agregar foto</span>
                </>
              )}
            </button>
            {imagenPreview && (
              <button
                onClick={() => { setForm((f) => ({ ...f, imagen: '' })); setImagenPreview(null) }}
                className="text-xs text-th-t3 hover:text-red-500 btn-touch"
              >
                Quitar imagen
              </button>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm text-th-t2 mb-1">Nombre / Código de barras *</label>
            <input
              className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t focus:outline-none focus:border-blue-500"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del producto"
            />
          </div>

          {/* Precios */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-th-t2 mb-1">Precio venta *</label>
              <input
                type="number" min="0"
                className="w-full bg-th-s2 border border-th-b3 rounded-xl px-3 py-3 text-th-t focus:outline-none focus:border-blue-500"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-th-t2 mb-1">Precio costo</label>
              <input
                type="number" min="0"
                className="w-full bg-th-s2 border border-th-b3 rounded-xl px-3 py-3 text-th-t focus:outline-none focus:border-blue-500"
                value={form.precio_costo}
                onChange={(e) => setForm({ ...form, precio_costo: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-th-t2 mb-1">Precio oferta</label>
              <input
                type="number" min="0"
                className="w-full bg-th-s2 border border-th-b3 rounded-xl px-3 py-3 text-th-t focus:outline-none focus:border-blue-500"
                value={form.precio_oferta}
                onChange={(e) => setForm({ ...form, precio_oferta: e.target.value })}
                placeholder="0 = sin oferta"
              />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm text-th-t2 mb-1">Stock inicial</label>
            <input
              type="number" min="0"
              className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t focus:outline-none focus:border-blue-500"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>

          {/* Categoría con creación inline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-th-t2">Categoría</label>
              <button
                onClick={() => setMostrarNuevaCat((v) => !v)}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 btn-touch"
              >
                <PlusCircle size={13} /> Nueva categoría
              </button>
            </div>
            {mostrarNuevaCat && (
              <div className="flex gap-2 mb-2">
                <input
                  className="flex-1 bg-th-s2 border border-blue-500 rounded-xl px-3 py-2 text-th-t text-sm focus:outline-none"
                  placeholder="Nombre de la categoría"
                  value={nuevaCat}
                  onChange={(e) => setNuevaCat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && crearCategoria()}
                  autoFocus
                />
                <button
                  onClick={crearCategoria}
                  disabled={!nuevaCat.trim() || creandoCat}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-th-s2 text-white text-sm px-4 rounded-xl btn-touch font-semibold"
                >
                  {creandoCat ? '...' : 'Crear'}
                </button>
                <button onClick={() => setMostrarNuevaCat(false)} className="text-th-t3 btn-touch px-2">
                  <X size={16} />
                </button>
              </div>
            )}
            <select
              className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t focus:outline-none focus:border-blue-500"
              value={form.categoria_id}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm text-th-t2 mb-1">Descripción</label>
            <textarea
              className="w-full bg-th-s2 border border-th-b3 rounded-xl px-4 py-3 text-th-t focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción opcional"
            />
          </div>

          {/* Venta por peso */}
          <div className="bg-th-s2 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm((f) => ({ ...f, venta_por_peso: f.venta_por_peso ? 0 : 1 }))}
                className={`relative w-12 h-6 rounded-full transition-colors btn-touch
                  ${form.venta_por_peso ? 'bg-blue-600' : 'bg-th-s3'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                  ${form.venta_por_peso ? 'translate-x-6' : ''}`} />
              </div>
              <span className="text-th-t2 text-sm font-medium">Producto vendido por peso (kg)</span>
            </label>
            {!!form.venta_por_peso && (
              <div>
                <label className="block text-xs text-th-t3 mb-1">Precio por kilogramo</label>
                <input
                  type="number" min="0"
                  className="w-full bg-th-s border border-th-b3 rounded-xl px-4 py-2.5 text-th-t focus:outline-none focus:border-blue-500"
                  value={form.precio_kg}
                  onChange={(e) => setForm({ ...form, precio_kg: e.target.value })}
                  placeholder="0"
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-th-s2 hover:bg-th-s3 text-th-t font-semibold py-3 rounded-xl btn-touch">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={!form.nombre.trim() || !form.precio || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-th-s2 disabled:text-th-t4 text-white font-bold py-3 rounded-xl btn-touch"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Productos() {
  const { userDataPath } = useAppContext()
  const imgSrc = (filename) =>
    userDataPath && filename
      ? `file:///${userDataPath.replace(/\\/g, '/')}/imagenes/${filename}`
      : null

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [modalProducto, setModalProducto] = useState(null)

  const cargar = async () => {
    const filtros = {}
    if (categoriaActiva) filtros.categoria_id = categoriaActiva
    if (busqueda) filtros.busqueda = busqueda
    const [prods, cats] = await Promise.all([
      window.api.listarProductos(filtros),
      window.api.listarCategorias()
    ])
    setProductos(prods)
    setCategorias(cats)
  }

  useEffect(() => { cargar() }, [busqueda, categoriaActiva])

  const guardarProducto = async (data) => {
    if (data.id) await window.api.actualizarProducto(data)
    else await window.api.crearProducto(data)
    setModalProducto(null)
    cargar()
  }

  const eliminarProducto = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    await window.api.eliminarProducto(id)
    cargar()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-th-b">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-th-t font-bold text-2xl flex-1">Productos</h1>
          <button
            onClick={() => setModalProducto({})}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold btn-touch"
          >
            <Plus size={16} /> Nuevo producto
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-t3" />
            <input
              className="w-full bg-th-s border border-th-b2 rounded-xl pl-9 pr-4 py-2 text-th-t text-sm focus:outline-none focus:border-blue-500"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setCategoriaActiva(null)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium btn-touch
                ${!categoriaActiva ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2'}`}
            >
              Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoriaActiva(c.id === categoriaActiva ? null : c.id)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium btn-touch
                  ${categoriaActiva === c.id ? 'bg-blue-600 text-white' : 'bg-th-s text-th-t2'}`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 scroll-touch p-4">
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-th-t4 gap-3">
            <p className="text-lg">No hay productos</p>
            <button
              onClick={() => setModalProducto({})}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold btn-touch"
            >
              Agregar primer producto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {productos.map((p) => (
              <div key={p.id} className="bg-th-s border border-th-b2 rounded-xl p-3 flex items-center gap-4">
                <div className="w-14 h-14 bg-th-s2 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                  {p.imagen ? (
                    <img src={imgSrc(p.imagen)} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff size={20} className="text-th-t4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-th-t font-semibold truncate">{p.nombre}</p>
                  <p className="text-th-t3 text-sm">{p.categoria_nombre || 'Sin categoría'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-blue-600 font-bold text-sm">${Number(p.precio).toLocaleString('es-CO')}</span>
                    {p.precio_costo > 0 && (
                      <span className="text-th-t4 text-xs">Costo: ${Number(p.precio_costo).toLocaleString('es-CO')}</span>
                    )}
                    {p.precio_oferta > 0 && (
                      <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                        Oferta: ${Number(p.precio_oferta).toLocaleString('es-CO')}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock <= 5 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400' : 'bg-th-s2 text-th-t3'}`}>
                      Stock: {p.stock}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setModalProducto(p)}
                    className="bg-th-s2 hover:bg-blue-600 hover:text-white text-th-t p-2 rounded-xl btn-touch transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => eliminarProducto(p.id)}
                    className="bg-th-s2 hover:bg-red-600 hover:text-white text-th-t p-2 rounded-xl btn-touch transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalProducto !== null && (
        <ModalProducto
          producto={modalProducto.id ? modalProducto : null}
          categorias={categorias}
          onGuardar={guardarProducto}
          onCerrar={() => setModalProducto(null)}
        />
      )}
    </div>
  )
}
