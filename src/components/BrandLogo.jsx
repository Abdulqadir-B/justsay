import { AudioLines } from 'lucide-react'

const sizeStyles = {
  sm: {
    box: 'h-8 w-8 rounded-lg',
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
  md: {
    box: 'h-9 w-9 rounded-lg',
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
  lg: {
    box: 'h-12 w-12 rounded-xl',
    icon: 'h-6 w-6',
    text: 'text-xl',
  },
}

export default function BrandLogo({ size = 'sm', showName = true, className = '' }) {
  const styles = sizeStyles[size] ?? sizeStyles.sm

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`flex shrink-0 items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-100 ${styles.box}`}>
        <AudioLines className={styles.icon} />
      </span>
      {showName && (
        <span className={`${styles.text} font-semibold tracking-tight text-white`}>
          JustSay
        </span>
      )}
    </div>
  )
}