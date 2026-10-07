import { useEffect } from 'react'
import { X } from 'lucide-react'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'

// A fresh removal event remounts this local feedback, cancelling the old timer.
export function UndoSnackbar({ message, onUndo, onClose }: { message: string; onUndo: () => void; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])
  return <div className="dg-snackbar">
    <span role="status">{message}</span>
    <PrototypeButton variant="text" className="dg-snackbar-undo" onClick={onUndo}>Undo</PrototypeButton>
    <PrototypeIconButton icon={X} label="Dismiss notification" tooltip={false} onClick={onClose} />
  </div>
}
