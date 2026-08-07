import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Config
  getConfig: () => ipcRenderer.invoke('config:obtener'),
  saveConfig: (data) => ipcRenderer.invoke('config:guardar', data),

  // Productos
  listarProductos: (filtros) => ipcRenderer.invoke('productos:listar', filtros),
  crearProducto: (data) => ipcRenderer.invoke('productos:crear', data),
  actualizarProducto: (data) => ipcRenderer.invoke('productos:actualizar', data),
  eliminarProducto: (id) => ipcRenderer.invoke('productos:eliminar', id),

  // Categorias
  listarCategorias: () => ipcRenderer.invoke('categorias:listar'),
  crearCategoria: (nombre) => ipcRenderer.invoke('categorias:crear', nombre),
  eliminarCategoria: (id) => ipcRenderer.invoke('categorias:eliminar', id),

  // Ventas
  crearVenta: (data) => ipcRenderer.invoke('ventas:crear', data),
  listarVentas: (filtros) => ipcRenderer.invoke('ventas:listar', filtros),
  detalleVenta: (id) => ipcRenderer.invoke('ventas:detalle', id),

  // Clientes
  listarClientes: (busqueda) => ipcRenderer.invoke('clientes:listar', busqueda),
  crearCliente: (data) => ipcRenderer.invoke('clientes:crear', data),
  actualizarCliente: (data) => ipcRenderer.invoke('clientes:actualizar', data),
  eliminarCliente: (id) => ipcRenderer.invoke('clientes:eliminar', id),
  historialCliente: (id) => ipcRenderer.invoke('clientes:historial', id),

  // Reportes
  resumenReporte: (filtros) => ipcRenderer.invoke('reportes:resumen', filtros),
  ventasRecientes: () => ipcRenderer.invoke('reportes:ventasRecientes'),

  // Ruta de datos de la app
  getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),

  // Imágenes y archivos
  abrirSelectorImagen: () => ipcRenderer.invoke('dialog:openImage'),
  copiarImagen: (sourcePath) => ipcRenderer.invoke('image:copiar', sourcePath),

  // Medios de pago
  listarMediosPago: () => ipcRenderer.invoke('mediosPago:listar'),
  crearMedioPago: (nombre) => ipcRenderer.invoke('mediosPago:crear', nombre),
  eliminarMedioPago: (id) => ipcRenderer.invoke('mediosPago:eliminar', id),
  reordenarMediosPago: (ids) => ipcRenderer.invoke('mediosPago:reordenar', ids),

  // Báscula
  basculaListarPuertos: () => ipcRenderer.invoke('bascula:listarPuertos'),
  basculaConectar: (cfg) => ipcRenderer.invoke('bascula:conectar', cfg),
  basculaDesconectar: () => ipcRenderer.invoke('bascula:desconectar'),
  basculaEstado: () => ipcRenderer.invoke('bascula:estado'),
  basculaGetPeso: () => ipcRenderer.invoke('bascula:getPeso'),
  onBasculaPeso: (cb) => {
    const handler = (_, d) => cb(d)
    ipcRenderer.on('bascula:peso', handler)
    return () => ipcRenderer.removeListener('bascula:peso', handler)
  },
  onBasculaDesconectada: (cb) => {
    const handler = (_, d) => cb(d)
    ipcRenderer.on('bascula:desconectada', handler)
    return () => ipcRenderer.removeListener('bascula:desconectada', handler)
  },

  // Inventario
  inventarioResumen: () => ipcRenderer.invoke('inventario:resumen'),
  inventarioListar: (filtros) => ipcRenderer.invoke('inventario:listar', filtros),
  inventarioAjuste: (data) => ipcRenderer.invoke('inventario:ajuste', data),

  // Caja
  abrirCaja: () => ipcRenderer.invoke('caja:abrir'),

  // Ticket
  imprimirTicket: (html) => ipcRenderer.invoke('ticket:imprimir', html)
})
