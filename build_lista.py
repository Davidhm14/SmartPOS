"""
Compila SmartPOS Lista:
  dist-lista/    SmartPOS Lista Setup 1.0.0.exe   (listado + tickets/mesas pendientes)
"""
import subprocess
from pathlib import Path

ROOT        = Path(__file__).parent
VENTAS      = ROOT / 'src/renderer/src/pages/Ventas.jsx'
VENTAS_LISTA = ROOT / 'src/renderer/src/pages/VentasLista.jsx'
BUILDER_YML = ROOT / 'electron-builder.yml'

VENTAS_ORIG  = VENTAS.read_text(encoding='utf-8')
BUILDER_ORIG = BUILDER_YML.read_text(encoding='utf-8')

BUILDER_LISTA = (BUILDER_ORIG
    .replace('appId: com.smartpos.app',  'appId: com.smartpos.lista')
    .replace('productName: SmartPOS',    'productName: SmartPOS Lista')
    .replace('output: dist',             'output: dist-lista'))

def main():
    print('=== Compilando SmartPOS Lista ===')
    VENTAS.write_text(VENTAS_LISTA.read_text(encoding='utf-8'), encoding='utf-8')
    BUILDER_YML.write_text(BUILDER_LISTA, encoding='utf-8')
    try:
        result = subprocess.run('npm run package', shell=True, cwd=ROOT)
        if result.returncode == 0:
            print('\n✓ Instalador generado en dist-lista/')
        else:
            print('\n✗ Build fallido')
    finally:
        VENTAS.write_text(VENTAS_ORIG, encoding='utf-8')
        BUILDER_YML.write_text(BUILDER_ORIG, encoding='utf-8')
        print('✓ Archivos originales restaurados')

if __name__ == '__main__':
    main()
