import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { canClaimOverlay, claimOverlay, releaseOverlay } from './overlayState'

// Event-driven visibility: click/leave/blur dismiss even when focus remains.
export function PrototypeTooltip({ content, shortcut, children, bounded = false, popupOpen = false, portalClassName }: { content: string; shortcut?: string; children: ReactElement; bounded?: boolean; popupOpen?: boolean; portalClassName?: string }) {
  const id = useId()
  const anchor = useRef<HTMLSpanElement>(null)
  const tooltip = useRef<HTMLDivElement>(null)
  const suppressed = useRef(false)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const close = () => { setOpen(false); releaseOverlay(id) }
  const show = () => {
    if (popupOpen || suppressed.current || !canClaimOverlay(id, 'passive')) return
    const rect = anchor.current?.getBoundingClientRect()
    if (!rect) return
    claimOverlay(id, 'passive')
    setOpen(true)
  }
  useLayoutEffect(() => {
    if (!open || popupOpen || !tooltip.current) return
    const place = () => {
      const trigger = anchor.current?.getBoundingClientRect()
      const surface = tooltip.current?.getBoundingClientRect()
      if (!trigger || !surface) return
      const gutter = 8, gap = 6
      const maxLeft = Math.max(gutter, window.innerWidth - gutter - surface.width)
      // Keep left alignment normally; align the right edges on a collision.
      const preferredLeft = trigger.left + surface.width <= window.innerWidth - gutter ? trigger.left : trigger.right - surface.width
      const left = Math.max(gutter, Math.min(preferredLeft, maxLeft))
      const below = trigger.bottom + gap, above = trigger.top - gap - surface.height
      // Prefer below, then above. If neither fits, clamp on the roomier side.
      const preferredTop = below + surface.height <= window.innerHeight - gutter ? below
        : above >= gutter ? above
        : window.innerHeight - gutter - below >= trigger.top - gap - gutter ? below : above
      const top = Math.max(gutter, Math.min(preferredTop, window.innerHeight - gutter - surface.height))
      setPosition(previous => previous.left === left && previous.top === top ? previous : { left, top })
    }
    // Layout measurement and React's synchronous update finish before paint.
    place()
    const observer = new ResizeObserver(place)
    observer.observe(tooltip.current)
    window.addEventListener('resize', place)
    return () => { observer.disconnect(); window.removeEventListener('resize', place) }
  }, [open, popupOpen, content, shortcut, bounded, portalClassName])
  useLayoutEffect(() => {
    if (!popupOpen) return
    // Keep suppression through popup dismissal and programmatic focus restore.
    // A subsequent real hover or blur/focus interaction re-arms this tooltip.
    suppressed.current = true
    releaseOverlay(id)
  }, [popupOpen, id])
  useEffect(() => {
    const changed = (event: Event) => { if ((event as CustomEvent).detail !== id) setOpen(false) }
    window.addEventListener('dg-overlay-change', changed)
    return () => { window.removeEventListener('dg-overlay-change', changed); releaseOverlay(id) }
  }, [id])
  useEffect(() => {
    if (!open || popupOpen) return
    const controls = anchor.current?.querySelectorAll('button')
    controls?.forEach(control => control.setAttribute('aria-describedby', id))
    const dismiss = () => { setOpen(false); releaseOverlay(id) }
    window.addEventListener('scroll', dismiss, true)
    return () => { controls?.forEach(control => control.removeAttribute('aria-describedby')); window.removeEventListener('scroll', dismiss, true) }
  }, [open, popupOpen, id])
  return <span ref={anchor} className="dg-tooltip-anchor" onMouseEnter={() => { suppressed.current = popupOpen; show() }} onMouseLeave={() => { suppressed.current = popupOpen; close() }} onFocus={show} onBlur={() => { suppressed.current = popupOpen; close() }} onPointerDownCapture={() => { suppressed.current = true; close() }} onClickCapture={() => { suppressed.current = true; close() }} onKeyDown={event => { if (['Escape', 'Enter', ' '].includes(event.key)) { suppressed.current = true; close() } }}>
    {children}
    {open && !popupOpen && createPortal(<div ref={tooltip} id={id} role="tooltip" className={`dg-tooltip${shortcut ? ' dg-tooltip-shortcut' : ''}${bounded ? ' dg-tooltip-bounded' : ''}${portalClassName ? ` ${portalClassName}` : ''}`} style={position}>{shortcut ? <><span className="dg-tooltip-label">{content}</span><span className="dg-tooltip-key">{shortcut}</span></> : content}</div>, document.body)}
  </span>
}
