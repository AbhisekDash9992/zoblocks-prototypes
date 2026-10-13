import type { LucideIcon } from 'lucide-react'
import type { PrototypeButtonProps } from './PrototypeButton'
import { PrototypeButton } from './PrototypeButton'
import { PrototypeTooltip } from './PrototypeTooltip'

type Props = PrototypeButtonProps & {
  icon: LucideIcon
  label: string
  applied?: boolean
  tooltip?: boolean
  tooltipPopupOpen?: boolean
  shortcut?: string
  // Designer reference only: fixed Small / Square. Existing callers do not opt in.
  referenceType?: 'ghost' | 'ghost-primary'
  referenceGlyphSize?: 14 | 16
}

export function PrototypeIconButton({ icon: Icon, label, applied = false, tooltip = true, tooltipPopupOpen = false, shortcut, className = '', referenceType, referenceGlyphSize = 16, ...props }: Props) {
  const button = referenceType
    ? <PrototypeButton {...props} variant="ghost" size={24} className={`dg-icon-action ${className}`} aria-label={label} data-cs01-type={referenceType}><span className="cs01-icon-slot" aria-hidden="true"><Icon size={referenceGlyphSize} aria-hidden="true" /></span></PrototypeButton>
    : <PrototypeButton variant="ghost" className={`dg-icon-action${applied ? ' dg-applied' : ''} ${className}`} aria-label={label} {...props}><Icon size={16} aria-hidden="true" /></PrototypeButton>
  return tooltip ? <PrototypeTooltip content={label} shortcut={shortcut} popupOpen={tooltipPopupOpen}>{button}</PrototypeTooltip> : button
}
