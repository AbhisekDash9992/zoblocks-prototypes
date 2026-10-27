import type { CSSProperties } from 'react'
import { SquareDashed, X, type LucideIcon } from 'lucide-react'
import { referenceColors, referenceCloseColors, type BadgeColor, type BadgeType } from './referenceValues'
import './badge.css'

export interface BadgeProps {
  type: BadgeType
  color: BadgeColor
  label: string
  iconStart?: boolean
  close?: boolean
  leadingIcon?: LucideIcon
  onRemove?: () => void
  className?: string
}

/** Portable designer-reference renderer, not a production-certified API.
 * Source Shape/Size are fixed Round/Medium. Context overrides affect geometry,
 * never that identity. Lucide artwork and component variable bindings are unverified.
 * Keep legacy cs03 class hooks so accepted reference consumers remain compatible.
 */
export function Badge({ type, color, label, iconStart = false, close = false,
  leadingIcon: LeadingIcon = SquareDashed, onRemove, className }: BadgeProps) {
  if (!label.trim()) return null
  const colors = referenceColors(type, color)
  const closeColors = referenceCloseColors(type, color)
  const style = {
    '--cs03-fill': colors.fill,
    '--cs03-foreground': colors.foreground,
    '--cs03-border': colors.border ?? 'transparent',
    '--cs03-close-rest': closeColors.rest,
    '--cs03-close-hover': closeColors.hover,
  } as CSSProperties
  return <span className={[`cs03-badge cs03-badge-medium cs03-badge-round cs03-badge-${type.toLowerCase()}`, className].filter(Boolean).join(' ')}
    data-cs03-type={type} data-cs03-color={color} data-source-shape="Round" data-source-size="Medium" style={style}>
    {iconStart && <LeadingIcon className="cs03-badge-icon cs03-badge-leading" size={12} strokeWidth={2} aria-hidden="true" focusable="false" />}
    <span className="cs03-badge-label">{label}</span>
    {close && (onRemove
      ? <button className="cs03-remove" type="button" aria-label={`Remove ${label}`} onClick={onRemove}><X className="cs03-badge-icon cs03-badge-close" size={12} strokeWidth={2} aria-hidden="true" focusable="false" /></button>
      : <X className="cs03-badge-icon cs03-badge-close" size={12} strokeWidth={2} aria-hidden="true" focusable="false" />)}
  </span>
}
