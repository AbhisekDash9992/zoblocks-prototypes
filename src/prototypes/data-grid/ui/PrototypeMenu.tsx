import { useEffect, useLayoutEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { claimOverlay, releaseOverlay } from './overlayState'

// Shared local overlay shell; options and multi-value content remain bounded.
export function PrototypeMenu({ id, label, trigger, position, onClose, children, role = 'listbox', keepTriggerFocus = false }: {
  id: string; label: string; trigger: RefObject<HTMLElement | null>; position: { left: number; top: number; width: number }; onClose: (restoreFocus: boolean) => void; children: ReactNode; role?: 'listbox' | 'dialog'; keepTriggerFocus?: boolean
}) {
  const popup = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const menu = popup.current
    if (!menu) return
    const height = menu.getBoundingClientRect().height
    menu.style.top = Math.max(8, Math.min(position.top, window.innerHeight - height - 8)) + 'px'
  })
  useEffect(() => {
    claimOverlay(id)
    const pointer = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) onClose(false) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(true) } }
    const scroll = (event: Event) => { if (!popup.current?.contains(event.target as Node)) onClose(false) }
    const changed = (event: Event) => { if ((event as CustomEvent).detail !== id) onClose(false) }
    window.addEventListener('dg-overlay-change', changed)
    document.addEventListener('pointerdown', pointer); document.addEventListener('keydown', key)
    window.addEventListener('scroll', scroll, true)
    if (!keepTriggerFocus) popup.current?.querySelector<HTMLElement>('input, [aria-selected="true"], button')?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('dg-overlay-change', changed); document.removeEventListener('pointerdown', pointer); document.removeEventListener('keydown', key)
      window.removeEventListener('scroll', scroll, true); releaseOverlay(id)
    }
  }, [id, trigger, onClose, keepTriggerFocus])
  return createPortal(<div ref={popup} id={id} role={role} aria-label={label} className="dg-picker" style={{ ...position, left: Math.max(8, Math.min(position.left, window.innerWidth - position.width - 8)) }} onKeyDown={event => {
    if (event.target instanceof HTMLInputElement) return
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')]
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); items[(index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus() }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); items[event.key === 'Home' ? 0 : items.length - 1]?.focus() }
  }}>{children}</div>, document.body)
}
