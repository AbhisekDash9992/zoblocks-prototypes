// One local overlay owner prevents stale tooltips behind pickers or view previews.
let owner: string | null = null
export function claimOverlay(id: string | null) {
  const previousOwner = owner
  owner = id
  window.dispatchEvent(new CustomEvent('dg-overlay-change', { detail: id }))
  return previousOwner
}
export function releaseOverlay(id: string) { if (owner === id) claimOverlay(null) }
