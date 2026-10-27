/* oxlint-disable react/only-export-components -- Keep the local reference data with its only renderer within the approved file scope. */
import { Badge, type BadgeProps } from '../../src/oxygen-badge/Badge'
import './badge-reference.css'

// Compatibility exports keep the accepted stories/tables on one value source.
export { sourceColors, badgeTypes, badgeColors, badgeCombinations, referenceColors } from '../../src/oxygen-badge/referenceValues'
export type { BadgeType, BadgeColor } from '../../src/oxygen-badge/referenceValues'

export function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const a = luminance(foreground), b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Story-only feedback adapter; visual rendering is shared with TabAtom. */
export function ReferenceBadge(props: Omit<BadgeProps, 'className'>) {
  if (!props.label.trim()) return <p className="cs03-empty">Enter a meaningful label in Controls to show the Badge. Empty labels have no informational meaning.</p>
  return <Badge {...props} />
}
