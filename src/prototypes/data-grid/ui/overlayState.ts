// One local overlay owner prevents stale tooltips behind pickers or view previews.
let owner: string | null = null
let exclusiveOwner: string | null = null
// Opt-in configuration popovers resist hover claims, but explicit overlays and
// dirty guards can still replace them. Other pickers keep their existing policy.
let persistentOwner: string | null = null
type OverlayIntent = 'explicit' | 'passive' | 'persistent'
export function canClaimOverlay(id: string, intent: OverlayIntent = 'explicit') {
  return (exclusiveOwner === null || exclusiveOwner === id) && (intent !== 'passive' || persistentOwner === null || persistentOwner === id)
}
export function lockOverlay(id: string) { exclusiveOwner = id; claimOverlay(id) }
export function unlockOverlay(id: string) { if (exclusiveOwner === id) { exclusiveOwner = null; releaseOverlay(id) } }
export function claimOverlay(id: string | null, intent: OverlayIntent = 'explicit') {
  if (exclusiveOwner !== null && id !== exclusiveOwner) return owner
  if (id !== null && !canClaimOverlay(id, intent)) return owner
  const previousOwner = owner
  owner = id
  persistentOwner = intent === 'persistent' ? id : null
  window.dispatchEvent(new CustomEvent('dg-overlay-change', { detail: id }))
  return previousOwner
}
export function releaseOverlay(id: string) { if (owner === id) claimOverlay(null) }
