import { ImageOff } from 'lucide-react'
import { useAppContext } from '../context'

export default function ProductoCard({ producto, onClick }) {
  const { userDataPath } = useAppContext()

  const imgSrc =
    userDataPath && producto.imagen
      ? `file:///${userDataPath.replace(/\\/g, '/')}/imagenes/${producto.imagen}`
      : null

  return (
    <button
      onClick={() => onClick(producto)}
      className="bg-th-s hover:bg-th-s2 border border-th-b2 hover:border-blue-500 rounded-xl overflow-hidden flex flex-col btn-touch transition-colors text-left w-full relative"
    >
      {producto.precio_oferta > 0 && (
        <span className="absolute top-1 right-1 bg-orange-500 text-white rounded-full z-10 font-bold leading-none" style={{ fontSize: '8px', padding: '2px 4px' }}>
          OFERTA
        </span>
      )}
      <div className="w-full bg-th-s2 flex items-center justify-center overflow-hidden" style={{ height: '80px' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={producto.nombre}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          style={{ display: imgSrc ? 'none' : 'flex' }}
          className="w-full h-full items-center justify-center text-th-t4"
        >
          <ImageOff size={28} />
        </div>
      </div>
      <div className="px-1.5 py-1">
        <p className="text-th-t font-semibold leading-tight line-clamp-2" style={{ fontSize: '11px' }}>
          {producto.nombre}
        </p>
        {producto.precio_oferta > 0 ? (
          <div>
            <p className="text-th-t4 line-through" style={{ fontSize: '10px' }}>
              ${Number(producto.precio).toLocaleString('es-CO')}
            </p>
            <p className="text-orange-500 font-bold" style={{ fontSize: '11px' }}>
              ${Number(producto.precio_oferta).toLocaleString('es-CO')}
            </p>
          </div>
        ) : (
          <p className="text-blue-600 font-bold mt-0.5" style={{ fontSize: '11px' }}>
            ${Number(producto.precio).toLocaleString('es-CO')}
          </p>
        )}
        {producto.stock !== undefined && producto.stock <= 5 && (
          <p className="text-orange-500" style={{ fontSize: '9px' }}>Stock: {producto.stock}</p>
        )}
      </div>
    </button>
  )
}
