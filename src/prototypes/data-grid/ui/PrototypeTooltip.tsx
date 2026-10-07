import { useEffect, useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { canClaimOverlay, claimOverlay, releaseOverlay } from './overlayState'

// Event-driven visibility: click/leave/blur dismiss even when focus remains.
export function PrototypeTooltip({ content, shortcut, children, bounded = false }: { content: string; shortcut?: string; children: ReactElement; bounded?: boolean }) {
  const id = useId()
  const anchor = useRef<HTMLSpanElement>(null)
  const suppressed = useRef(false)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const close = () => { setOpen(false); releaseOverlay(id) }
  const show = () => {
    if (suppressed.current || !canClaimOverlay(id)) return
    const rect = anchor.current?.getBoundingClientRect()
    if (!rect) return
    claimOverlay(id)
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)), top: bounded ? Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 188)) : rect.bottom + 6 })
    setOpen(true)
  }
  useEffect(() => {
    const changed = (event: Event) => { if ((event as CustomEvent).detail !== id) setOpen(false) }
    window.addEventListener('dg-overlay-change', changed)
    return () => { window.removeEventListener('dg-overlay-change', changed); releaseOverlay(id) }
  }, [id])
  useEffect(() => {
    if (!open) return
    const controls = anchor.current?.querySelectorAll('button')
    controls?.forEach(control => control.setAttribute('aria-describedby', id))
    const dismiss = () => { setOpen(false); releaseOverlay(id) }
    window.addEventListener('scroll', dismiss, true)
    return () => { controls?.forEach(control => control.removeAttribute('aria-describedby')); window.removeEventListener('scroll', dismiss, true) }
  }, [open, id])
  return <span ref={anchor} className="dg-tooltip-anchor" onMouseEnter={() => { suppressed.current = false; show() }} onMouseLeave={() => { suppressed.current = false; close() }} onFocus={show} onBlur={() => { suppressed.current = false; close() }} onPointerDownCapture={() => { suppressed.current = true; close() }} onClickCapture={() => { suppressed.current = true; close() }} onKeyDown={event => { if (['Escape', 'Enter', ' '].includes(event.key)) { suppressed.current = true; close() } }}>
    {children}
    {open && createPortal(<div id={id} role="tooltip" className={`dg-tooltip${shortcut ? ' dg-tooltip-shortcut' : ''}${bounded ? ' dg-tooltip-bounded' : ''}`} style={position}>{shortcut ? <><span className="dg-tooltip-label">{content}</span><span className="dg-tooltip-key">{shortcut}</span></> : content}</div>, document.body)}
  </span>
}
