import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { SortRule } from '../model/dataGridPrototypeState'
import { completeSort, sortDirections, sortFields, sortMeaning, sortStarter } from '../model/sortFields'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { PrototypeSelect } from '../ui/PrototypeSelect'
import { claimOverlay } from '../ui/overlayState'
import { DirtyNavigationGuard } from './DirtyNavigationGuard'

export function SortEditorShell({ snapshot, guardOpen, onKeep, onDiscard, onDirty, onCancel, onApply, onClear }: {
  snapshot: SortRule[]; guardOpen: boolean; onKeep: () => void; onDiscard: () => void
  onDirty: (dirty: boolean) => void; onCancel: () => void; onApply: (rows: SortRule[]) => void; onClear: () => void
}) {
  const [initial] = useState(() => snapshot.length ? structuredClone(snapshot) : [sortStarter(1)])
  const [draft, setDraft] = useState(initial)
  const [autoOpenId, setAutoOpenId] = useState<number | null>(snapshot.length ? null : initial[0].id)
  const nextId = useRef(Math.max(...initial.map(row => row.id)) + 1)
  const editor = useRef<HTMLElement>(null)
  const sourceFocus = useRef<HTMLElement | null>(null)
  const dirty = sortMeaning(draft) !== sortMeaning(initial)
  const incomplete = draft.some(row => !completeSort(row))
  const clearing = snapshot.length > 0 && draft.length === 1 && !draft[0].field
  useEffect(() => { onDirty(dirty) }, [dirty, onDirty])
  const repairFocus = () => requestAnimationFrame(() => {
    claimOverlay(null)
    const focused = document.activeElement
    if (!(focused instanceof HTMLElement) || !focused.isConnected || focused === document.body || focused.matches(':disabled')) editor.current?.focus({ preventScroll: true })
  })
  const reset = () => {
    setAutoOpenId(null)
    setDraft([sortStarter(nextId.current++)])
    repairFocus()
  }
  const update = (id: number, patch: Partial<SortRule>) => setDraft(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row))
  return <section ref={editor} className="dg-editor dg-editor-sort" aria-labelledby="dg-editor-title" tabIndex={-1} onFocusCapture={event => { if (event.target instanceof HTMLElement && event.currentTarget.contains(event.target) && !event.target.closest('.dg-guard-dialog')) sourceFocus.current = event.target }}>
    <header className="dg-editor-header"><h2 id="dg-editor-title">Sort</h2><div>
      <PrototypeButton className="dg-editor-action" variant="text" onClick={onCancel}>Cancel</PrototypeButton>
      <PrototypeButton className={`dg-editor-action dg-apply${clearing ? ' dg-destructive' : ''}`} variant="primary" size={24} disabled={!clearing && (!dirty || incomplete)} onClick={() => clearing ? onClear() : onApply(structuredClone(draft))}>{clearing ? 'Clear sort' : 'Apply'}</PrototypeButton>
    </div></header>
    <div className={`dg-editor-workspace${guardOpen ? ' dg-editor-guarded' : ''}`}>
      <div className="dg-conditions" role="region" aria-label="Sort conditions" tabIndex={0}>
        <div className="dg-condition-stack">
          {draft.map((row, index) => <div className="dg-rule-row dg-sort-row" key={row.id} role="group" aria-label={`Sort rank ${index + 1}`}>
            <span className="dg-sort-precedence" aria-label={`Precedence ${index + 1}`}>{index + 1}</span>
            <div className="dg-rule-controls">
              <PrototypeSelect className="dg-rule-field" searchable autoOpen={autoOpenId === row.id} label={`Field for sort ${index + 1}`} placeholder="Select field" value={row.field} options={sortFields} onChange={field => {
                // Selecting the same field leaves a deliberately chosen direction intact.
                update(row.id, { field, direction: row.field === field ? row.direction : sortDirections[field][0] })
                setAutoOpenId(null)
              }} />
              {row.field && <PrototypeSelect className="dg-rule-operator" label={`Direction for sort ${index + 1}`} value={row.direction} options={sortDirections[row.field]} onChange={direction => update(row.id, { direction })} />}
              {(draft.length > 1 || row.field) && <PrototypeIconButton className="dg-rule-delete" icon={Trash2} label={`Remove sort ${index + 1}`} onClick={() => {
                if (draft.length === 1) reset()
                else { setAutoOpenId(null); setDraft(rows => rows.filter(item => item.id !== row.id)); repairFocus() }
              }} />}
            </div>
          </div>)}
          <div className="dg-workspace-actions">
            <PrototypeButton variant="text" className="dg-editor-add" disabled={incomplete} onClick={() => {
              const id = nextId.current++
              setDraft(rows => [...rows, sortStarter(id)])
              setAutoOpenId(id)
            }}><Plus size={14} aria-hidden="true" />Add Sort</PrototypeButton>
            {draft.length >= 2 && <><span className="dg-summary-divider" aria-hidden="true" /><PrototypeButton className="dg-conditions-action" variant="text" onClick={reset}>Clear all</PrototypeButton></>}
          </div>
        </div>
      </div>
      {guardOpen && <DirtyNavigationGuard subject="sort" sourceFocus={sourceFocus} onKeep={onKeep} onDiscard={onDiscard} />}
    </div>
  </section>
}
