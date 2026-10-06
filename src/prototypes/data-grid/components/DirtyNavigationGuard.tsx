import { useId, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { lockOverlay, unlockOverlay } from '../ui/overlayState'
import { PrototypeButton } from '../ui/PrototypeButton'

export function DirtyNavigationGuard({ sourceFocus, onKeep, onDiscard }: {
  sourceFocus: RefObject<HTMLElement | null>; onKeep: () => void; onDiscard: () => void
}) {
  const id = useId()
  const dialog = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(true)
  useLayoutEffect(() => {
    const panel = dialog.current
    if (!panel) return
    const source = sourceFocus.current
    lockOverlay(id)
    // Keep the header/Summary visible while making only the guard interactive.
    const blocked = new Map<HTMLElement, boolean>()
    let branch: HTMLElement = panel
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          blocked.set(sibling, sibling.inert)
          sibling.inert = true
        }
      }
      branch = branch.parentElement
      if (branch === document.body) break
    }
    panel.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    const key = (event: KeyboardEvent) => {
      const actions = [...panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopImmediatePropagation(); onKeep()
      } else if (event.key === 'Tab') {
        event.preventDefault()
        const index = actions.indexOf(document.activeElement as HTMLButtonElement)
        actions[(index + (event.shiftKey ? actions.length - 1 : 1)) % actions.length]?.focus({ preventScroll: true })
      }
    }
    const focus = (event: FocusEvent) => {
      if (!panel.contains(event.target as Node)) panel.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    }
    document.addEventListener('keydown', key, true)
    document.addEventListener('focusin', focus)
    return () => {
      document.removeEventListener('keydown', key, true)
      document.removeEventListener('focusin', focus)
      blocked.forEach((inert, element) => { element.inert = inert })
      unlockOverlay(id)
      if (restoreFocus.current) {
        if (source?.isConnected) source.focus({ preventScroll: true })
      }
    }
  }, [id, sourceFocus, onKeep])
  return <div className="dg-guard-overlay">
    <div ref={dialog} className="dg-guard-dialog" role="dialog" aria-modal="true" aria-label="Unsaved filter changes" aria-describedby={id}>
      <p id={id}>Discard unsaved filter changes?</p>
      <div className="dg-guard-actions">
        <PrototypeButton onClick={onKeep}>Keep editing</PrototypeButton>
        <PrototypeButton variant="primary" onClick={() => { restoreFocus.current = false; onDiscard() }}>Discard changes</PrototypeButton>
      </div>
    </div>
  </div>
}
