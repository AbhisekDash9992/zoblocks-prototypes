import { cloneElement, forwardRef, type ButtonHTMLAttributes, type ReactElement, type SVGProps } from 'react'
import '../oxygen-reference-tokens/tokens.css'
import './button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text-primary' | 'text-secondary'
export type ButtonShape = 'square' | 'round'
export type ButtonSize = 'large' | 'medium' | 'small'
export type ButtonIcon = ReactElement<SVGProps<SVGSVGElement>>

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  shape?: ButtonShape
  size?: ButtonSize
  /** Meaningful visible text is required. Icon-only actions belong to CS-01. */
  label: string
  /** Decorative SVG elements, for example <Plus />. Never interactive content. */
  leadingIcon?: ButtonIcon
  trailingIcon?: ButtonIcon
}

function DecorativeIcon({ icon }: { icon: ButtonIcon }) {
  return <span className="ox-button__icon" aria-hidden="true">
    {cloneElement(icon, { 'aria-hidden': true, focusable: 'false', tabIndex: -1, style: { ...icon.props.style, width: '100%', height: '100%', color: 'inherit' } })}
  </span>
}

/** Light reference only: mount inside an explicit data-oxygen-mode="light" scope. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary', shape = 'square', size = 'medium', label, leadingIcon, trailingIcon,
  type = 'button', className, ...nativeProps
}, ref) {
  // Do not accidentally turn a cleared label into an unnamed icon-only action.
  if (!label.trim()) return null
  return <button {...nativeProps} ref={ref} type={type}
    className={['ox-button', `ox-button--${variant}`, `ox-button--${shape}`, `ox-button--${size}`, className].filter(Boolean).join(' ')}>
    {leadingIcon && <DecorativeIcon icon={leadingIcon} />}
    <span className="ox-button__label">{label}</span>
    {trailingIcon && <DecorativeIcon icon={trailingIcon} />}
  </button>
})
