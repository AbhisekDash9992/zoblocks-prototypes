// Designer-reference values, not production tokens. Root colors are sampled;
// foregrounds remain the accepted local choices with unverified Figma bindings.
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

// Accepted local Close roles, separate from label roles and source bindings.
const closeColors: Record<BadgeColor, { rest: string; hover: string }> = {
  Default: { rest: '#4A5565', hover: '#101828' },
  Info: { rest: '#2B7FFF', hover: '#1447E6' },
  Success: { rest: '#008236', hover: '#016630' },
  Warning: { rest: '#E17100', hover: '#BB4D00' },
  Danger: { rest: '#FB2C36', hover: '#C10007' },
}
const solidCloseColors = { rest: 'rgb(255 255 255 / 85%)', hover: '#FFFFFF' }

export function referenceCloseColors(type: BadgeType, name: BadgeColor) {
  return type === 'Solid' ? solidCloseColors : closeColors[name]
}
