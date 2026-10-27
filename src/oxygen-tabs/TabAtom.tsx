import { cloneElement, forwardRef, type ButtonHTMLAttributes, type ReactElement, type SVGProps } from 'react'
import { Badge } from '../oxygen-badge/Badge'
import '../oxygen-reference-tokens/tokens.css'
import './tabs.css'

export type TabAtomVariant = 'underline' | 'pill-gray' | 'pill-brand' | 'pill-brand-underline'
export type TabIcon = ReactElement<SVGProps<SVGSVGElement>>

interface TabVisualProps {
  variant?: TabAtomVariant
  label: string
  selected?: boolean
  leadingIcon?: TabIcon
  trailingIcon?: TabIcon
  /** Noninteractive Round/Outlined/Medium/Default Badge with Tabs-context geometry. */
  badge?: string
}

export interface TabAtomProps extends TabVisualProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type' | 'disabled'> {}

function DecorativeIcon({ icon }: { icon: TabIcon }) {
  return <span className="ox-tab__icon" aria-hidden="true">
    {/* A negative tabindex still makes SVGs pointer-focusable in Chromium. */}
    {cloneElement(icon, { 'aria-hidden': true, focusable: 'false', tabIndex: undefined,
      style: { ...icon.props.style, width: '100%', height: '100%', color: 'inherit' } })}
  </span>
}

function TabContent({ label, leadingIcon, trailingIcon, badge }: TabVisualProps) {
  return <span className="ox-tab__content">
    {leadingIcon && <DecorativeIcon icon={leadingIcon} />}
    <span className="ox-tab__label">{label}</span>
    {badge?.trim() && <Badge type="Outlined" color="Default" label={badge} iconStart={false} close={false} className="ox-tab__badge" />}
    {trailingIcon && <DecorativeIcon icon={trailingIcon} />}
  </span>
}

/** Noninteractive source composition: same visuals, no button/tab/panel semantics. */
export function TabAtomSpecimen({ variant = 'underline', label, selected = false, ...content }: TabVisualProps) {
  if (!label.trim()) return null
  return <span className={`ox-tab ox-tab--${variant} ox-tab--specimen`} data-selected={selected ? 'true' : 'false'}
    data-reference-state={selected ? 'active' : 'inactive'}>
    <TabContent label={label} {...content} />
  </span>
}

/** Light reference atom. Tabs supplies tab semantics; standalone comparisons are ordinary buttons. */
export const TabAtom = forwardRef<HTMLButtonElement, TabAtomProps>(function TabAtom({
  variant = 'underline', label, selected = false, leadingIcon, trailingIcon, badge, className, ...nativeProps
}, ref) {
  if (!label.trim()) return null
  return <button {...nativeProps} ref={ref} type="button" data-selected={selected ? 'true' : 'false'}
    className={['ox-tab', `ox-tab--${variant}`, className].filter(Boolean).join(' ')}>
    <TabContent label={label} leadingIcon={leadingIcon} trailingIcon={trailingIcon} badge={badge} />
  </button>
})
