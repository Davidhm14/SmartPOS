import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'

export default function Carrito({ items, onCambiarCantidad, onEliminar, onCobrar }) {
  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)

  return (
    <div className="w-60 bg-th-bg border-l border-th-b flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-th-b flex items-center gap-2">
        <ShoppingBag size={17} className="text-blue-500" />
        <h2 className="text-th-t font-bold">Carrito</h2>
        <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {items.reduce((s, i) => s + i.cantidad, 0)}
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 scroll-touch px-2 py-1.5 space-y-1.5">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-th-t4 text-xs">
            <ShoppingBag size={26} className="mb-1 opacity-30" />
            Toca un producto
          </div>
        )}
        {items.map((item) => (
          <div key={item._cartId} className="bg-th-s rounded-xl p-2.5">
            <div className="flex justify-between items-start gap-1">
              <span className="text-th-t text-xs font-medium leading-tight flex-1 line-clamp-2">{item.nombre}</span>
              <button
                onClick={() => onEliminar(item._cartId)}
                className="text-th-t4 hover:text-red-500 transition-colors btn-touch shrink-0 ml-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onCambiarCantidad(item._cartId, item.cantidad - 1)}
                  className="bg-th-s2 hover:bg-th-s3 text-th-t w-7 h-7 rounded-lg flex items-center justify-center btn-touch"
                >
                  <Minus size={12} />
                </button>
                <span className="text-th-t font-bold w-5 text-center text-sm">{item.cantidad}</span>
                <button
                  onClick={() => onCambiarCantidad(item._cartId, item.cantidad + 1)}
                  className="bg-th-s2 hover:bg-th-s3 text-th-t w-7 h-7 rounded-lg flex items-center justify-center btn-touch"
                >
                  <Plus size={12} />
                </button>
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
          onClick={onCobrar}
          disabled={items.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-th-s2 disabled:text-th-t4 text-white font-bold py-3 rounded-xl text-lg transition-colors btn-touch"
        >
          Cobrar
        </button>
      </div>
    </div>
  )
}
