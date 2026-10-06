import { useCallback, useId, useRef, useState } from 'react'
import { filterFields } from '../model/filterFields'
import { PrototypeInput } from '../ui/PrototypeInput'
import { PrototypeMenu } from '../ui/PrototypeMenu'

export function AddFilterPopover({ anchor, onClose, onField, onAdvanced }: {
  anchor: HTMLButtonElement; onClose: () => void; onField: (field: string) => void; onAdvanced: () => void
}) {
  const id = useId()
  const trigger = useRef(anchor)
  const [query, setQuery] = useState('')
  const [aiNotice, setAiNotice] = useState(false)
  const rect = anchor.getBoundingClientRect()
  const close = useCallback((restoreFocus: boolean) => {
    onClose()
    if (restoreFocus && anchor.isConnected) anchor.focus({ preventScroll: true })
  }, [anchor, onClose])
  const fields = filterFields.filter(field => field.toLowerCase().includes(query.toLowerCase()))
  return <PrototypeMenu id={id} label="Add Filter" role="dialog" trigger={trigger}
    position={{ left: rect.left, top: rect.bottom + 4, width: 240 }} onClose={close}>
    <PrototypeInput className="dg-picker-search" aria-label="Search fields" placeholder="Search fields…" value={query} onChange={event => setQuery(event.target.value)} />
    <div className="dg-picker-section-header"><span className="dg-picker-heading">Fields</span></div>
    {fields.map(field => <button type="button" key={field} onClick={() => onField(field)}>{field}</button>)}
    {fields.length === 0 && <p className="dg-picker-empty">No matching fields</p>}
    <hr className="dg-picker-divider" />
    <button type="button" onClick={() => setAiNotice(true)}>AI Filter</button>
    <button type="button" onClick={onAdvanced}>Advanced Filter</button>
    {aiNotice && <p className="dg-picker-empty" role="status">AI Filter is deferred in this prototype batch.</p>}
  </PrototypeMenu>
}
