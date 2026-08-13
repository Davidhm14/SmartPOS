"""
Compila las dos versiones de SmartPOS:
  dist/              SmartPOS Setup 1.0.0.exe          (original con categorias)
  dist-barcode/      SmartPOS Barcode Setup 1.0.0.exe  (abecedario + codigo de barras)
"""
import subprocess, sys
from pathlib import Path

ROOT = Path(__file__).parent

PRODUCTOS_IPC      = ROOT / 'src/main/ipc/productos.js'
CARD               = ROOT / 'src/renderer/src/components/ProductoCard.jsx'
VENTAS             = ROOT / 'src/renderer/src/pages/Ventas.jsx'
VENTAS_BARCODE_SRC = ROOT / 'src/renderer/src/pages/VentasBarcode.jsx'
BUILDER_YML        = ROOT / 'electron-builder.yml'

# ══ Contenidos leidos del disco ══════════════════════════════════════════════
PRODUCTOS_IPC_ORIG = PRODUCTOS_IPC.read_text(encoding='utf-8')
CARD_ORIG          = CARD.read_text(encoding='utf-8')
VENTAS_ORIG        = VENTAS.read_text(encoding='utf-8')
BUILDER_ORIG       = BUILDER_YML.read_text(encoding='utf-8')
VENTAS_BARCODE     = VENTAS_BARCODE_SRC.read_text(encoding='utf-8')

# ══ electron-builder para version BARCODE ════════════════════════════════════
BUILDER_BARCODE = (BUILDER_ORIG
    .replace('appId: com.smartpos.app',  'appId: com.smartpos.barcode')
    .replace('productName: SmartPOS',    'productName: SmartPOS Barcode')
    .replace('output: dist',             'output: dist-barcode'))

# ══ productos IPC para BARCODE (busqueda incluye descripcion) ════════════════
PRODUCTOS_IPC_BARCODE = PRODUCTOS_IPC_ORIG.replace(
    "AND p.nombre LIKE ?\n      params.push(`%${filtros.busqueda}%`)",
    "AND (p.nombre LIKE ? OR p.descripcion LIKE ?)\n      params.push(`%${filtros.busqueda}%`, `%${filtros.busqueda}%`)"
)

# ══ ProductoCard para BARCODE (muestra descripcion como nombre) ══════════════
CARD_BARCODE = CARD_ORIG.replace(
    "{producto.nombre}",
    "{producto.descripcion?.trim() || producto.nombre}"
)

# ══════════════════════════════════════════════════════════════════════════════
def run(cmd):
    print(f'\n>>> {cmd}')
    r = subprocess.run(cmd, shell=True, cwd=ROOT)
    if r.returncode != 0:
        sys.exit(r.returncode)

def write(path, text):
    Path(path).write_text(text, encoding='utf-8')

# ══════════════════════════════════════════════════════════════════════════════
print('\n=== [1/2] Compilando SmartPOS Barcode ===')
write(BUILDER_YML,   BUILDER_BARCODE)
write(PRODUCTOS_IPC, PRODUCTOS_IPC_BARCODE)
write(CARD,          CARD_BARCODE)
write(VENTAS,        VENTAS_BARCODE)
try:
    run('npm run package')
finally:
    write(BUILDER_YML, BUILDER_ORIG)

# ══════════════════════════════════════════════════════════════════════════════
print('\n=== Restaurando archivos originales ===')
write(PRODUCTOS_IPC, PRODUCTOS_IPC_ORIG)
write(CARD,          CARD_ORIG)
write(VENTAS,        VENTAS_ORIG)

# ══════════════════════════════════════════════════════════════════════════════
print('\n=== [2/2] Compilando SmartPOS (original) ===')
run('npm run package')

print('\nListo.')
print(f'  Original : dist\\SmartPOS Setup 1.0.0.exe')
print(f'  Barcode  : dist-barcode\\SmartPOS Barcode Setup 1.0.0.exe')
