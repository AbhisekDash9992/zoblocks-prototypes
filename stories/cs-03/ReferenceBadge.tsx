/* oxlint-disable react/only-export-components -- Keep the local reference data with its only renderer within the approved file scope. */
import type { CSSProperties } from 'react'
import { SquareDashed, X, type LucideIcon } from 'lucide-react'
import './badge-reference.css'

// Designer-supplied root colors; foregrounds are local contrast choices, with
// unverified Figma bindings. This is a Storybook reference, not a production API.
export const sourceColors = {
  Default: { fill: '#F2F3F5', border: '#D1D5DC', solid: '#6A7282', foreground: '#4A5565' },
  Info: { fill: '#F2F8FF', border: '#BEDBFF', solid: '#155DFC', foreground: '#1447E6' },
  Success: { fill: '#F0FDF4', border: '#B9F8CF', solid: '#008236', foreground: '#006B2C' },
  Warning: { fill: '#FFFBEB', border: '#FEE685', solid: '#BB4D00', foreground: '#8F3B00' },
  Danger: { fill: '#FEF2F2', border: '#FFC9C9', solid: '#E7000B', foreground: '#B42318' },
} as const

export const badgeTypes = ['Outlined', 'Flat', 'Solid'] as const
export type BadgeType = typeof badgeTypes[number]
export type BadgeColor = keyof typeof sourceColors
export const badgeColors = Object.keys(sourceColors) as BadgeColor[]
export const badgeCombinations = badgeTypes.flatMap(type => badgeColors.map(color => ({ type, color })))

export function referenceColors(type: BadgeType, name: BadgeColor) {
  const color = sourceColors[name]
  return {
    fill: type === 'Solid' ? color.solid : color.fill,
    foreground: type === 'Solid' ? '#FFFFFF' : color.foreground,
    border: type === 'Outlined' ? color.border : undefined,
  }
}

export function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const a = luminance(foreground), b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export function ReferenceBadge({ type, color, label, iconStart = false, close = false, leadingIcon: LeadingIcon = SquareDashed, onRemove }: {
  type: BadgeType; color: BadgeColor; label: string
  // Local Storybook reference only; the parent owns removal, not a production API.
  iconStart?: boolean; close?: boolean; leadingIcon?: LucideIcon
  onRemove?: () => void
}) {
  if (!label.trim()) return <p className="cs03-empty">Enter a meaningful label in Controls to show the Badge. Empty labels have no informational meaning.</p>
  const colors = referenceColors(type, color)
  const style = {
    '--cs03-fill': colors.fill,
    '--cs03-foreground': colors.foreground,
    '--cs03-border': colors.border ?? 'transparent',
  } as CSSProperties
  return <span className={`cs03-badge cs03-badge-medium cs03-badge-round cs03-badge-${type.toLowerCase()}`} data-cs03-type={type} data-cs03-color={color} style={style}>
    {iconStart && <LeadingIcon className="cs03-badge-icon cs03-badge-leading" size={12} strokeWidth={2} aria-hidden="true" focusable="false" />}
    <span className="cs03-badge-label">{label}</span>
    {close && (onRemove
      ? <button className="cs03-remove" type="button" aria-label={`Remove ${label}`} onClick={onRemove}><X className="cs03-badge-icon cs03-badge-close" size={12} strokeWidth={2} aria-hidden="true" focusable="false" /></button>
      : <X className="cs03-badge-icon cs03-badge-close" size={12} strokeWidth={2} aria-hidden="true" focusable="false" />)}
  </span>
}
