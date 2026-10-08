import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { SortRule } from '../model/dataGridPrototypeState'
import { claimOverlay } from '../ui/overlayState'

type Drag = { id: number; pointerId: number; handle: HTMLButtonElement; startY: number; y: number; x: number; active: boolean; position: number }
type Preview = { id: number; position: number; x: number; y: number }

// Local pointer interaction: preview a gap, then change the draft only on a valid drop.
export function useSortReorder(stack: RefObject<HTMLDivElement | null>, onMove: (id: number, position: number) => void, onCancel: () => void) {
  const drag = useRef<Drag | null>(null)
  const callbacks = useRef({ onMove, onCancel })
  const [preview, setPreview] = useState<Preview | null>(null)
  useEffect(() => { callbacks.current = { onMove, onCancel } }, [onMove, onCancel])
  useEffect(() => {
    let frame = 0
    const update = () => {
      const current = drag.current, panel = stack.current
      if (!current?.active || !panel) return
      const bounds = panel.getBoundingClientRect()
      // Autoscroll the Condition Stack only, with bounded speed near its edges.
      if (current.y < bounds.top + 24) panel.scrollTop -= Math.min(10, (bounds.top + 24 - current.y) / 3)
      else if (current.y > bounds.bottom - 24) panel.scrollTop += Math.min(10, (current.y - bounds.bottom + 24) / 3)
      const otherRows = [...panel.querySelectorAll<HTMLElement>('.dg-sort-row')].filter(row => Number(row.dataset.sortId) !== current.id)
      current.position = otherRows.filter(row => { const rect = row.getBoundingClientRect(); return current.y > rect.top + rect.height / 2 }).length
      setPreview({ id: current.id, position: current.position, x: current.x, y: current.y })
    }
    const tick = () => { update(); frame = requestAnimationFrame(tick) }
    const stop = (commit: boolean) => {
      const current = drag.current, panel = stack.current
      if (!current) return
      const bounds = panel?.getBoundingClientRect()
      const inside = bounds && current.y >= bounds.top && current.y <= bounds.bottom && current.x >= bounds.left && current.x <= bounds.right
      drag.current = null
      cancelAnimationFrame(frame)
      if (current.handle.hasPointerCapture(current.pointerId)) current.handle.releasePointerCapture(current.pointerId)
      panel?.classList.remove('dg-sort-dragging')
      setPreview(null)
      if (commit && current.active && inside) callbacks.current.onMove(current.id, current.position)
      else if (current.active) callbacks.current.onCancel()
    }
    const move = (event: PointerEvent) => {
      const current = drag.current
      if (!current || current.pointerId !== event.pointerId) return
      current.x = event.clientX; current.y = event.clientY
      if (!current.active && Math.abs(current.y - current.startY) >= 4) {
        current.active = true
        claimOverlay(null)
        stack.current?.classList.add('dg-sort-dragging')
        frame = requestAnimationFrame(tick)
      }
      if (current.active) { event.preventDefault(); update() }
    }
    const up = (event: PointerEvent) => { if (drag.current?.pointerId === event.pointerId) { move(event); stop(true) } }
    const cancel = () => stop(false)
    const key = (event: KeyboardEvent) => {
      if (!drag.current) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); stop(false) }
      else if (event.key === 'Tab') stop(false)
      else if (['ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key)) { event.preventDefault(); event.stopPropagation() }
    }
    const wheel = (event: WheelEvent) => {
      if (!drag.current?.active) return
      event.preventDefault()
      if (stack.current) stack.current.scrollTop += event.deltaY
      update()
    }
    const lost = (event: PointerEvent) => { if (drag.current?.pointerId === event.pointerId) stop(false) }
    document.addEventListener('pointermove', move, { passive: false })
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', cancel)
    document.addEventListener('lostpointercapture', lost)
    document.addEventListener('keydown', key, true)
    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('blur', cancel)
    return () => {
      stop(false)
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', cancel); document.removeEventListener('lostpointercapture', lost)
      document.removeEventListener('keydown', key, true); window.removeEventListener('wheel', wheel); window.removeEventListener('blur', cancel)
    }
  }, [stack])
  return {
    preview,
    begin: (event: ReactPointerEvent<HTMLButtonElement>, row: SortRule, position: number) => {
      if (event.button !== 0 || !event.isPrimary || drag.current) return
      event.preventDefault()
      event.currentTarget.focus({ preventScroll: true })
      event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = { id: row.id, pointerId: event.pointerId, handle: event.currentTarget, startY: event.clientY, y: event.clientY, x: event.clientX, active: false, position }
    },
  }
}
