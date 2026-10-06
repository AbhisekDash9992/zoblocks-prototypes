import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'

// A fresh removal event remounts this local feedback, cancelling the old timer.
export function UndoSnackbar({ message, onUndo, onClose }: { message: string; onUndo: () => void; onClose: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const remaining = useRef(6000)
  useEffect(() => {
    if (hovered || focused) return
    const started = Date.now()
    const timer = setTimeout(onClose, remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (Date.now() - started))
    }
  }, [hovered, focused, onClose])
  return <div className="dg-snackbar" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <span role="status">{message}</span>
    <PrototypeButton variant="text" className="dg-snackbar-undo" onClick={onUndo}>Undo</PrototypeButton>
    <PrototypeIconButton icon={X} label="Dismiss notification" tooltip={false} onClick={onClose} />
  </div>
}
