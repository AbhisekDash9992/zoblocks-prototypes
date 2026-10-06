// One local overlay owner prevents stale tooltips behind pickers or view previews.
let owner: string | null = null
let exclusiveOwner: string | null = null
export function canClaimOverlay(id: string) { return exclusiveOwner === null || exclusiveOwner === id }
export function lockOverlay(id: string) { exclusiveOwner = id; claimOverlay(id) }
export function unlockOverlay(id: string) { if (exclusiveOwner === id) { exclusiveOwner = null; releaseOverlay(id) } }
export function claimOverlay(id: string | null) {
  if (exclusiveOwner !== null && id !== exclusiveOwner) return owner
  const previousOwner = owner
  owner = id
  window.dispatchEvent(new CustomEvent('dg-overlay-change', { detail: id }))
  return previousOwner
}
export function releaseOverlay(id: string) { if (owner === id) claimOverlay(null) }
