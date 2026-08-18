"""
Compila SmartPOS Carnes:
  dist-carnes/    SmartPOS Carnes Setup 1.0.0.exe   (version para carnicerias)
"""
import subprocess
from pathlib import Path

ROOT          = Path(__file__).parent
VENTAS        = ROOT / 'src/renderer/src/pages/Ventas.jsx'
VENTAS_CARNES = ROOT / 'src/renderer/src/pages/VentasCarnes.jsx'
BUILDER_YML   = ROOT / 'electron-builder.yml'

VENTAS_ORIG  = VENTAS.read_text(encoding='utf-8')
BUILDER_ORIG = BUILDER_YML.read_text(encoding='utf-8')

BUILDER_CARNES = (BUILDER_ORIG
    .replace('appId: com.smartpos.app',  'appId: com.smartpos.carnes')
    .replace('productName: SmartPOS',    'productName: SmartPOS Carnes')
    .replace('output: dist',             'output: dist-carnes'))

def main():
    print('=== Compilando SmartPOS Carnes ===')
    VENTAS.write_text(VENTAS_CARNES.read_text(encoding='utf-8'), encoding='utf-8')
    BUILDER_YML.write_text(BUILDER_CARNES, encoding='utf-8')
    try:
        result = subprocess.run('npm run package', shell=True, cwd=ROOT)
        if result.returncode == 0:
            print('\nInstalador generado en dist-carnes/')
        else:
            print('\nBuild fallido')
    finally:
        VENTAS.write_text(VENTAS_ORIG, encoding='utf-8')
        BUILDER_YML.write_text(BUILDER_ORIG, encoding='utf-8')
        print('Archivos originales restaurados')

if __name__ == '__main__':
    main()
