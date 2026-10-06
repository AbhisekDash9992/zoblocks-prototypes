import { useCallback, useId, useRef } from 'react'
import { PrototypeMenu } from '../ui/PrototypeMenu'
import { PrototypeButton } from '../ui/PrototypeButton'

export function DirtyNavigationPopover({ anchor, onKeep, onDiscard }: { anchor: HTMLElement; onKeep: () => void; onDiscard: () => void }) {
  const id = useId()
  const trigger = useRef(anchor)
  const rect = anchor.getBoundingClientRect()
  const close = useCallback(() => { onKeep(); if (anchor.isConnected) anchor.focus({ preventScroll: true }) }, [anchor, onKeep])
  return <PrototypeMenu id={id} label="Unsaved filter changes" role="dialog" trigger={trigger} position={{ left: rect.left, top: rect.bottom + 4, width: 260 }} onClose={close}>
    <p className="dg-picker-empty">Discard unsaved filter changes?</p>
    <PrototypeButton onClick={close}>Keep editing</PrototypeButton>
    <PrototypeButton onClick={onDiscard}>Discard changes</PrototypeButton>
  </PrototypeMenu>
}
