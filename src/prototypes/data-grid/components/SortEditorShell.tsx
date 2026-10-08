import { useEffect, useId, useRef, useState } from 'react'
import { GripVertical, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { SortRule } from '../model/dataGridPrototypeState'
import { availableSortFields, completeSort, duplicateSortFields, moveSortRule, sortDirections, sortFields, sortMeaning, sortStarter, validSort } from '../model/sortFields'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { PrototypeSelect } from '../ui/PrototypeSelect'
import { claimOverlay } from '../ui/overlayState'
import { DirtyNavigationGuard } from './DirtyNavigationGuard'
import { useSortReorder } from './useSortReorder'

export function SortEditorShell({ snapshot, guardOpen, onKeep, onDiscard, onDirty, onCancel, onApply, onClear }: {
  snapshot: SortRule[]; guardOpen: boolean; onKeep: () => void; onDiscard: () => void
  onDirty: (dirty: boolean) => void; onCancel: () => void; onApply: (rows: SortRule[]) => void; onClear: () => void
}) {
  const [initial] = useState(() => snapshot.length ? structuredClone(snapshot) : [sortStarter(1)])
  const [draft, setDraft] = useState(initial)
  const [autoOpenId, setAutoOpenId] = useState<number | null>(snapshot.length ? null : initial[0].id)
  const nextId = useRef(Math.max(...initial.map(row => row.id)) + 1)
  const editor = useRef<HTMLElement>(null)
  const stack = useRef<HTMLDivElement>(null)
  const sourceFocus = useRef<HTMLElement | null>(null)
  const instructionsId = useId()
  const validationId = useId()
  const [announcement, setAnnouncement] = useState('')
  const [aiNotice, setAiNotice] = useState(false)
  const dirty = sortMeaning(draft) !== sortMeaning(initial)
  const incomplete = draft.some(row => !completeSort(row))
  const duplicates = duplicateSortFields(draft)
  const allFieldsSelected = sortFields.every(field => draft.some(row => row.field === field))
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
  const focusHandle = (id: number) => requestAnimationFrame(() => {
    const row = editor.current?.querySelector<HTMLElement>(`[data-sort-id="${id}"]`)
    if (!row || !stack.current) return
    const bounds = stack.current.getBoundingClientRect(), target = row.getBoundingClientRect()
    if (target.bottom > bounds.bottom) stack.current.scrollTop += target.bottom - bounds.bottom
    else if (target.top < bounds.top) stack.current.scrollTop -= bounds.top - target.top
    row.querySelector<HTMLButtonElement>('.dg-sort-handle')?.focus({ preventScroll: true })
  })
  const move = (id: number, position: number) => {
    const next = moveSortRule(draft, id, position)
    const rank = next.findIndex(row => row.id === id)
    if (rank < 0) return
    setDraft(next)
    setAnnouncement(next === draft ? `${next[rank].field} remains at precedence ${rank + 1} of ${next.length}.` : `${next[rank].field} moved to precedence ${rank + 1} of ${next.length}.`)
    focusHandle(id)
  }
  const { preview, begin } = useSortReorder(stack, move, () => setAnnouncement('Reorder cancelled. Sort order unchanged.'))
  const otherRows = preview ? draft.filter(row => row.id !== preview.id) : []
  const beforeId = preview ? otherRows[preview.position]?.id : undefined
  const afterId = preview && beforeId === undefined ? otherRows.at(-1)?.id : undefined
  return <section ref={editor} className="dg-editor dg-editor-sort" aria-labelledby="dg-editor-title" tabIndex={-1} onFocusCapture={event => { if (event.target instanceof HTMLElement && event.currentTarget.contains(event.target) && !event.target.closest('.dg-guard-dialog')) sourceFocus.current = event.target }}>
    <header className="dg-editor-header"><div className="dg-editor-title-group"><h2 id="dg-editor-title">Sort</h2><PrototypeIconButton className="dg-ai-action" icon={Sparkles} label="AI Sort" onClick={() => setAiNotice(true)} /></div><div>
      <PrototypeButton className="dg-editor-action" variant="text" onClick={onCancel}>Cancel</PrototypeButton>
      <PrototypeButton className={`dg-editor-action dg-apply${clearing ? ' dg-destructive' : ''}`} variant="primary" size={24} disabled={!clearing && (!dirty || !validSort(draft))} onClick={() => clearing ? onClear() : validSort(draft) && onApply(structuredClone(draft))}>{clearing ? 'Clear sort' : 'Apply'}</PrototypeButton>
    </div></header>
    <div className={`dg-editor-workspace${guardOpen ? ' dg-editor-guarded' : ''}`}>
      <div className="dg-conditions" role="region" aria-label="Sort conditions" aria-describedby={duplicates.length ? validationId : undefined} tabIndex={0}>
        {aiNotice && <p className="dg-ai-notice" role="status">AI Sort is deferred in this prototype batch.</p>}
        {duplicates.length > 0 && <p id={validationId} role="alert">Each Sort field can be used only once. Choose a different field or remove the duplicate: {duplicates.join(', ')}.</p>}
        <span id={instructionsId} className="dg-sort-assistive">Use Arrow Up or Arrow Down to move this Sort row. Escape cancels a pointer drag. Tab moves to the next control.</span>
        <span className="dg-sort-assistive" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
        <div ref={stack} className="dg-condition-stack">
          {draft.map((row, index) => <div className="dg-rule-row dg-sort-row" key={row.id} data-sort-id={row.id} data-drag-source={preview?.id === row.id || undefined} data-drop-before={beforeId === row.id || undefined} data-drop-after={afterId === row.id || undefined} role="group" aria-label={`Sort rank ${index + 1}`}>
            {completeSort(row) ? <PrototypeButton variant="ghost" className="dg-sort-precedence dg-sort-handle" aria-label={`Reorder ${row.field}, rank ${index + 1} of ${draft.length}. Use Arrow Up or Arrow Down to move.`} aria-describedby={instructionsId} onPointerDown={event => begin(event, row, index)} onKeyDown={event => {
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); move(row.id, index + (event.key === 'ArrowUp' ? -1 : 1)) }
            }}><span className="dg-sort-rank" aria-hidden="true">{index + 1}</span><GripVertical className="dg-sort-grip" size={14} aria-hidden="true" /></PrototypeButton>
              : <span className="dg-sort-precedence" aria-label={`Precedence ${index + 1}`}>{index + 1}</span>}
            <div className="dg-rule-controls">
              <PrototypeSelect className="dg-rule-field" searchable state={duplicates.includes(row.field) ? 'error' : undefined} autoOpen={autoOpenId === row.id} label={`Field for sort ${index + 1}`} placeholder="Select field" value={row.field} options={availableSortFields(draft, row.id)} onChange={field => {
                // Selecting the same field leaves a deliberately chosen direction intact.
                update(row.id, { field, direction: row.field === field ? row.direction : sortDirections[field][0] })
                setAutoOpenId(null)
              }} />
              {row.field && <PrototypeSelect className="dg-rule-operator" label={`Direction for sort ${index + 1}`} value={row.direction} options={sortDirections[row.field]} onChange={direction => update(row.id, { direction })} />}
              {(draft.length > 1 || row.field) && <PrototypeIconButton className="dg-rule-delete" icon={Trash2} label="Remove Sort" onClick={() => {
                if (draft.length === 1) reset()
                else { setAutoOpenId(null); setDraft(rows => rows.filter(item => item.id !== row.id)); repairFocus() }
              }} />}
            </div>
          </div>)}
          <div className="dg-workspace-actions">
            <PrototypeButton variant="text" className="dg-editor-add" disabled={incomplete || allFieldsSelected} onClick={() => {
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
    {preview && <div className="dg-sort-drag-preview" aria-hidden="true" style={{ left: Math.max(8, Math.min(preview.x + 12, window.innerWidth - 248)), top: Math.max(8, Math.min(preview.y + 12, window.innerHeight - 40)) }}>{draft.find(row => row.id === preview.id)?.field}</div>}
  </section>
}
