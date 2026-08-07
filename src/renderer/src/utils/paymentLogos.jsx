// Inline SVG logos for Colombian payment methods

export function NequiLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FF2079" />
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">N</text>
      <path d="M10 32 Q20 28 30 32" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function DaviplataLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#5B2D8E" />
      <rect x="4" y="4" width="32" height="32" rx="7" fill="#6D3AAF" />
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial, sans-serif">D</text>
    </svg>
  )
}

export function BreBLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#00A651" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">Bre</text>
      <text x="20" y="34" textAnchor="middle" fill="#FFD100" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">-B</text>
    </svg>
  )
}

export function BancolombiaLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FFD100" />
      <text x="20" y="27" textAnchor="middle" fill="#005B2E" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">BANCO</text>
    </svg>
  )
}

export function PSELogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0033A0" />
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">PSE</text>
    </svg>
  )
}

export function EfectivoLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#16A34A" />
      <rect x="6" y="13" width="28" height="14" rx="3" fill="white" opacity="0.9" />
      <circle cx="20" cy="20" r="4" fill="#16A34A" />
      <circle cx="9" cy="20" r="2" fill="#16A34A" opacity="0.5" />
      <circle cx="31" cy="20" r="2" fill="#16A34A" opacity="0.5" />
    </svg>
  )
}

export function TransferenciaLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#2563EB" />
      <path d="M8 16 L32 16 M26 10 L32 16 L26 22" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 24 L8 24 M14 18 L8 24 L14 30" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Map payment method names to logo components
const LOGO_MAP = {
  'nequi': NequiLogo,
  'daviplata': DaviplataLogo,
  'bre-b': BreBLogo,
  'breb': BreBLogo,
  'bancolombia': BancolombiaLogo,
  'pse': PSELogo,
  'efectivo': EfectivoLogo,
  'transferencia': TransferenciaLogo,
}

export function getPaymentLogo(nombre) {
  const key = nombre.toLowerCase().replace(/\s+/g, '')
  return LOGO_MAP[key] || null
}
