import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

export type PrototypeInputState = 'default' | 'active' | 'filled' | 'disabled' | 'error'

// Text and Dropdown share this task-local 32px boundary and state language.
export const PrototypeInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { state?: PrototypeInputState }>(function PrototypeInput({ state, disabled, value, className = '', ...props }, ref) {
  const inputState = disabled ? 'disabled' : state ?? (value !== undefined && value !== '' ? 'filled' : 'default')
  return <input ref={ref} {...props} value={value} disabled={inputState === 'disabled'} aria-invalid={inputState === 'error' || undefined} className={`dg-input dg-input-${inputState} ${className}`} />
})
