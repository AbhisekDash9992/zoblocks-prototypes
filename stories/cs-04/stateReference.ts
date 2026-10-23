import buttonCss from '../../src/oxygen-button/button.css?inline'

// Only Storybook creates these selectors. Copy declarations from the actual
// pseudo-state rules, so static comparisons cannot acquire a separate recipe.
export const referenceStateCss = ['hover', 'focus-visible'].map(pseudo => {
  const selector = `.ox-button:${pseudo}:not(:disabled)`
  const rule = buttonCss.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`))
  if (!rule) throw new Error(`CS-04 reference rule missing: ${pseudo}`)
  return `.cs04-reference [data-cs04-reference="${pseudo}"] .ox-button:not(:disabled) {${rule[1]}}`
}).join('\n')
