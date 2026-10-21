import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'size-[26px]',
  md: 'size-8',
  lg: 'size-10',
}

export function BrandLogo({ className, size = 'sm' }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(SIZES[size], 'flex-none rounded-xl shadow-xs transition-transform hover:scale-105', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brandBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#184A80" />
          <stop offset="100%" stop-color="#0A2A4E" />
        </linearGradient>
        <linearGradient id="brandGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FBBF24" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
      </defs>
      {/* Base redondeada institucional */}
      <rect width="64" height="64" rx="16" fill="url(#brandBg)" />
      {/* Birrete académico estilizado con hojas / páginas */}
      <path d="M32 15L52 25L32 35L12 25L32 15Z" fill="#FFFFFF" />
      {/* Escudo / libro inferior en oro */}
      <path
        d="M22 28.5V38.5C22 43.5 26.5 47.5 32 49C37.5 47.5 42 43.5 42 38.5V28.5L32 33.5L22 28.5Z"
        fill="url(#brandGold)"
      />
      {/* Detalle interior */}
      <path d="M32 24.5L43 30L32 35.5L21 30L32 24.5Z" fill="#FFFFFF" fillOpacity="0.9" />
      {/* Borla académica */}
      <path d="M48 27V36C48 37 46.5 38 45.5 38" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="45.5" cy="38" r="2" fill="#FBBF24" />
    </svg>
  )
}
