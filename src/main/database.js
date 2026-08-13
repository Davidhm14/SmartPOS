import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'

let db

export function getDb() {
  return db
}

export function initDatabase() {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) mkdirSync(userDataPath, { recursive: true })

  const dbPath = join(userDataPath, 'pos.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  try { db.exec('ALTER TABLE productos ADD COLUMN venta_por_peso INTEGER DEFAULT 0') } catch (_) {}
  try { db.exec('ALTER TABLE productos ADD COLUMN precio_kg REAL DEFAULT 0') } catch (_) {}
  try { db.exec('ALTER TABLE productos ADD COLUMN precio_costo REAL DEFAULT 0') } catch (_) {}
  try { db.exec('ALTER TABLE productos ADD COLUMN precio_oferta REAL DEFAULT 0') } catch (_) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL DEFAULT 0,
      categoria_id INTEGER,
      imagen TEXT,
      stock INTEGER DEFAULT 0,
      descripcion TEXT,
      activo INTEGER DEFAULT 1,
      venta_por_peso INTEGER DEFAULT 0,
      precio_kg REAL DEFAULT 0,
      precio_costo REAL DEFAULT 0,
      precio_oferta REAL DEFAULT 0,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      fecha_registro TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      total REAL NOT NULL,
      metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
      efectivo_recibido REAL DEFAULT 0,
      cambio REAL DEFAULT 0,
      notas TEXT,
      fecha TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id INTEGER,
      nombre_snap TEXT NOT NULL,
      precio_snap REAL NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (venta_id) REFERENCES ventas(id),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );

    CREATE TABLE IF NOT EXISTS config (
      clave TEXT PRIMARY KEY,
      valor TEXT
    );

    CREATE TABLE IF NOT EXISTS medios_pago (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      activo INTEGER DEFAULT 1,
      orden INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS movimientos_inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER,
      nombre_snap TEXT NOT NULL,
      tipo TEXT NOT NULL,
      cantidad REAL NOT NULL,
      motivo TEXT,
      stock_antes REAL NOT NULL,
      stock_despues REAL NOT NULL,
      fecha TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );

    CREATE TABLE IF NOT EXISTS tickets_pendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL DEFAULT 'Ticket',
      items TEXT NOT NULL DEFAULT '[]',
      creado TEXT DEFAULT (datetime('now','localtime'))
    );
  `)

  // Default payment methods
  const mpCheck = db.prepare('SELECT COUNT(*) as n FROM medios_pago').get()
  if (mpCheck.n === 0) {
    const insertMp = db.prepare('INSERT INTO medios_pago (nombre, orden) VALUES (?, ?)')
    const defaults = ['Efectivo', 'Nequi', 'Daviplata', 'Bre-B', 'Transferencia']
    db.transaction(() => defaults.forEach((n, i) => insertMp.run(n, i)))()
  }

  // Default config if not set
  const configCheck = db.prepare("SELECT valor FROM config WHERE clave = 'nombre_negocio'").get()
  if (!configCheck) {
    const insertConfig = db.prepare("INSERT OR IGNORE INTO config (clave, valor) VALUES (?, ?)")
    const insertMany = db.transaction((items) => items.forEach((i) => insertConfig.run(i[0], i[1])))
    const today = new Date()
    const installDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    insertMany([
      ['nombre_negocio', ''],
      ['nit', ''],
      ['telefono', ''],
      ['direccion', ''],
      ['footer_ticket', 'Gracias por su compra'],
      ['tamano_papel', '80'],
      ['setup_done', '0'],
      ['install_date', installDate],
      ['license_activated', '0']
    ])
  }

  return db
}
