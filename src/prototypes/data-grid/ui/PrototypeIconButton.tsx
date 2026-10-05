import type { LucideIcon } from 'lucide-react'
import type { PrototypeButtonProps } from './PrototypeButton'
import { PrototypeButton } from './PrototypeButton'
import { PrototypeTooltip } from './PrototypeTooltip'

export function PrototypeIconButton({ icon: Icon, label, applied = false, tooltip = true, className = '', ...props }: PrototypeButtonProps & { icon: LucideIcon; label: string; applied?: boolean; tooltip?: boolean }) {
  const button = <PrototypeButton variant="ghost" className={`dg-icon-action${applied ? ' dg-applied' : ''} ${className}`} aria-label={label} {...props}><Icon size={16} aria-hidden="true" /></PrototypeButton>
  return tooltip ? <PrototypeTooltip content={label}>{button}</PrototypeTooltip> : button
}
