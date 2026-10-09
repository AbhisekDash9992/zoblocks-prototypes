import { useEffect, useLayoutEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { claimOverlay, releaseOverlay } from './overlayState'

// Shared local overlay shell; options and multi-value content remain bounded.
export function PrototypeMenu({ id, label, trigger, position, onClose, children, role = 'listbox', keepTriggerFocus = false, className = '', restoreFocusOnOutside = false, focusPolicy = 'first-control', dismissalPolicy = 'default' }: {
  id: string; label: string; trigger: RefObject<HTMLElement | null>; position: { left: number; top: number; width: number }; onClose: (restoreFocus: boolean) => void; children: ReactNode; role?: 'listbox' | 'dialog'; keepTriggerFocus?: boolean; className?: string; restoreFocusOnOutside?: boolean; focusPolicy?: 'first-control' | 'surface'; dismissalPolicy?: 'default' | 'explicit'
}) {
  const popup = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const menu = popup.current
    if (!menu) return
    const place = () => {
      const { height, width } = menu.getBoundingClientRect()
      const anchor = trigger.current?.getBoundingClientRect()
      const below = anchor ? anchor.bottom + 4 : position.top
      const top = below + height <= window.innerHeight - 8 ? below : anchor ? anchor.top - height - 4 : below
      menu.style.top = Math.max(8, Math.min(top, window.innerHeight - height - 8)) + 'px'
      menu.style.left = Math.max(8, Math.min(anchor?.left ?? position.left, window.innerWidth - width - 8)) + 'px'
    }
    place()
    window.addEventListener('resize', place)
    if (dismissalPolicy === 'explicit') window.addEventListener('scroll', place, true)
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  })
  useEffect(() => {
    claimOverlay(id, dismissalPolicy === 'explicit' ? 'persistent' : 'explicit')
    const pointer = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) onClose(restoreFocusOnOutside) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(true) } }
    const scroll = (event: Event) => { if (!popup.current?.contains(event.target as Node)) onClose(false) }
    const changed = (event: Event) => { if ((event as CustomEvent).detail !== id) onClose(false) }
    window.addEventListener('dg-overlay-change', changed)
    document.addEventListener('pointerdown', pointer); document.addEventListener('keydown', key)
    if (dismissalPolicy === 'default') window.addEventListener('scroll', scroll, true)
    if (!keepTriggerFocus) {
      const destination = focusPolicy === 'surface' ? popup.current : popup.current?.querySelector<HTMLElement>('input, [aria-selected="true"], button')
      destination?.focus({ preventScroll: true })
    }
    return () => {
      window.removeEventListener('dg-overlay-change', changed); document.removeEventListener('pointerdown', pointer); document.removeEventListener('keydown', key)
      window.removeEventListener('scroll', scroll, true); releaseOverlay(id)
    }
  }, [id, trigger, onClose, keepTriggerFocus, restoreFocusOnOutside, focusPolicy, dismissalPolicy])
  return createPortal(<div ref={popup} id={id} role={role} aria-label={label} tabIndex={focusPolicy === 'surface' ? -1 : undefined} className={`dg-picker ${className}`} style={{ ...position, left: Math.max(8, Math.min(position.left, window.innerWidth - position.width - 8)) }} onKeyDown={event => {
    if (event.target instanceof HTMLInputElement) return
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')]
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); items[(index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus() }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); items[event.key === 'Home' ? 0 : items.length - 1]?.focus() }
  }}>{children}</div>, document.body)
}
