import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

export type PrototypeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'text'
  size?: 24 | 32 | 40
  textTone?: 'primary' | 'secondary'
}
export const PrototypeButton = forwardRef<HTMLButtonElement, PrototypeButtonProps>(function PrototypeButton({ variant = 'secondary', size = 24, textTone = 'secondary', className = '', type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={`dg-button dg-button-${variant}${variant === 'text' ? ` dg-text-${textTone}` : ''} dg-size-${size} ${className}`} {...props} />
})
