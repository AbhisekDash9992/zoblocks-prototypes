import { useEffect, useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { canClaimOverlay, claimOverlay, releaseOverlay } from './overlayState'

const configurations = [
  { group: 'Status', sort: ['Priority ↓', 'Next Contact ↑'], filters: ['Advanced filter · 3 rules', 'Status: Active'] },
  { group: 'None', sort: ['Next Contact ↑'], filters: ['Risk Screen = Passive ideation'] },
  { group: 'Status', sort: ['None'], filters: ['None'] },
]
export function ViewPreviewPopover({ index, children }: { index: number; children: ReactElement }) {
  const id = useId()
  const anchor = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const close = () => { clearTimeout(timer.current); setOpen(false); releaseOverlay(id) }
  const show = () => {
    if (!canClaimOverlay(id)) return
    clearTimeout(timer.current)
    const rect = anchor.current?.getBoundingClientRect()
    if (!rect) return
    claimOverlay(id); setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 268)), top: rect.bottom + 4 }); setOpen(true)
  }
  useEffect(() => {
    const changed = (event: Event) => { if ((event as CustomEvent).detail !== id) { clearTimeout(timer.current); setOpen(false) } }
    window.addEventListener('dg-overlay-change', changed)
    return () => { clearTimeout(timer.current); window.removeEventListener('dg-overlay-change', changed); releaseOverlay(id) }
  }, [id])
  const config = configurations[index]
  return <span ref={anchor} className="dg-tooltip-anchor" onMouseEnter={() => {
    if (!canClaimOverlay(id)) return
    clearTimeout(timer.current)
    // Reserve ownership before waiting: the previous chip cannot cancel this timer.
    const previousOwner = claimOverlay(id)
    if (previousOwner !== null) show()
    else timer.current = setTimeout(show, 200)
  }} onMouseLeave={() => { clearTimeout(timer.current); timer.current = setTimeout(close, 120) }} onFocus={show} onBlur={close} onClickCapture={close} onKeyDown={event => { if (event.key === 'Escape') close() }}>
    {children}
    {open && createPortal(<div role="region" aria-label={`View ${index + 1} saved configuration preview`} className="dg-view-preview" style={position} onMouseEnter={() => clearTimeout(timer.current)} onMouseLeave={close}><strong>View {index + 1}</strong><p>Saved view</p><dl><dt>Group</dt><dd>{config.group}</dd><dt>Sort</dt><dd>{config.sort.map(line => <div key={line}>{line}</div>)}</dd><dt>Filters</dt><dd>{config.filters.map(line => <div key={line}>{line}</div>)}</dd></dl></div>, document.body)}
  </span>
}
