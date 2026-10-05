import type { HTMLAttributes } from 'react'
export function PrototypeBadge({ tone = 'neutral', variant = 'flat', className = '', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'primary' | 'danger'; variant?: 'flat' | 'outlined' | 'solid' }) {
  return <span className={`dg-badge dg-badge-${tone} dg-badge-${variant} ${className}`} {...props} />
}
