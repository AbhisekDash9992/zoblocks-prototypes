import { useEffect, useId, useRef, useState } from 'react'
import { Ellipsis, GripVertical, Layers, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { GroupDraftRule, GroupSnapshot } from '../model/dataGridPrototypeState'
import { completeGroup, groupFields, groupMeaning, groupOrders, groupStarter, isGroupField, isGroupOrder, validGroup } from '../model/groupFields'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { PrototypeSelect } from '../ui/PrototypeSelect'
import { claimOverlay } from '../ui/overlayState'
import { DirtyNavigationGuard } from './DirtyNavigationGuard'
import { useSortReorder } from './useSortReorder'

export function GroupEditorShell({ snapshot, guardOpen, onKeep, onDiscard, onDirty, onCancel, onApply, onClear }: {
  snapshot: GroupSnapshot; guardOpen: boolean; onKeep: () => void; onDiscard: () => void
  onDirty: (dirty: boolean) => void; onCancel: () => void; onApply: (rows: GroupSnapshot) => void; onClear: () => void
}) {
  const [initial] = useState<GroupDraftRule[]>(() => snapshot.length ? structuredClone(snapshot) : [groupStarter(1)])
  const [draft, setDraft] = useState(initial)
  const [autoOpenId, setAutoOpenId] = useState<number | null>(snapshot.length ? null : initial[0].id)
  const nextId = useRef(Math.max(...initial.map(row => row.id)) + 1)
  const editor = useRef<HTMLElement>(null)
  const stack = useRef<HTMLDivElement>(null)
  const sourceFocus = useRef<HTMLElement | null>(null)
  const instructionsId = useId()
  const [announcement, setAnnouncement] = useState('')
  const [keyboardFocusId, setKeyboardFocusId] = useState<number | null>(null)
  const pointerFocusing = useRef(false)
  const dirty = groupMeaning(draft) !== groupMeaning(initial)
  const clearing = snapshot.length > 0 && draft.length === 1 && !draft[0].field
  useEffect(() => { onDirty(dirty) }, [dirty, onDirty])
  const repairFocus = (id?: number) => requestAnimationFrame(() => {
    claimOverlay(null)
    editor.current?.querySelector<HTMLButtonElement>(id === undefined ? '.dg-rule-field' : `[data-group-id="${id}"] .dg-rule-field`)?.focus({ preventScroll: true })
  })
  const reset = () => {
    setAutoOpenId(null)
    setDraft([groupStarter(nextId.current++)])
    repairFocus()
  }
  const update = (id: number, patch: Partial<GroupDraftRule>) => setDraft(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row))
  const move = (id: number, position: number) => {
    const source = draft.findIndex(row => row.id === id)
    if (source < 0 || !completeGroup(draft[source])) return
    const destination = Math.max(0, Math.min(draft.length - 1, position))
    const next = [...draft]
    const [row] = next.splice(source, 1)
    next.splice(destination, 0, row)
    setDraft(next)
    setAnnouncement(`${row.field} ${source === destination ? 'remains at' : 'moved to'} precedence ${destination + 1} of ${next.length}.`)
    requestAnimationFrame(() => {
      const target = editor.current?.querySelector<HTMLElement>(`[data-group-id="${id}"]`)
      if (!target || !stack.current) return
      const bounds = stack.current.getBoundingClientRect(), rect = target.getBoundingClientRect()
      if (rect.bottom > bounds.bottom) stack.current.scrollTop += rect.bottom - bounds.bottom
      else if (rect.top < bounds.top) stack.current.scrollTop -= bounds.top - rect.top
      target.querySelector<HTMLButtonElement>('.dg-sort-handle')?.focus({ preventScroll: true })
    })
  }
  const { preview, begin } = useSortReorder(stack, move, () => setAnnouncement('Reorder cancelled. Group order unchanged.'), '.dg-group-row', 'data-group-id')
  const otherRows = preview ? draft.filter(row => row.id !== preview.id) : []
  const beforeId = preview ? otherRows[preview.position]?.id : undefined
  const afterId = preview && beforeId === undefined ? otherRows.at(-1)?.id : undefined
  return <section ref={editor} className="dg-editor dg-editor-group" aria-labelledby="dg-editor-title" tabIndex={-1} onFocusCapture={event => {
    if (event.target instanceof HTMLElement && event.currentTarget.contains(event.target) && !event.target.closest('.dg-guard-dialog')) sourceFocus.current = event.target
  }}>
    <header className="dg-editor-header"><div className="dg-editor-title-group"><Layers size={16} aria-hidden="true" /><h2 id="dg-editor-title">Group By</h2><PrototypeIconButton className="dg-ai-action" icon={Sparkles} label="AI Group (deferred)" disabled /></div><div>
      <PrototypeButton className="dg-editor-action" variant="text" onClick={onCancel}>Cancel</PrototypeButton>
      <PrototypeButton className={`dg-editor-action dg-apply${clearing ? ' dg-destructive' : ''}`} variant="primary" size={24} disabled={!clearing && (!dirty || !validGroup(draft))} onClick={() => clearing ? onClear() : validGroup(draft) && onApply(structuredClone(draft))}>{clearing ? 'Clear group' : 'Apply'}</PrototypeButton>
    </div></header>
    <div className={`dg-editor-workspace${guardOpen ? ' dg-editor-guarded' : ''}`}>
      <div className="dg-conditions" role="region" aria-label="Group conditions" tabIndex={0}>
        <div className="dg-conditions-heading"><div><h3>Group by</h3><p>Group rows are applied from top to bottom.</p></div></div>
        <span id={instructionsId} className="dg-sort-assistive">Use Arrow Up or Arrow Down to move this Group row. Escape cancels a pointer drag. Tab moves to the next control.</span>
        <span className="dg-sort-assistive" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
        <div ref={stack} className="dg-condition-stack">
          {draft.map((row, index) => <div className="dg-rule-row dg-group-row" key={row.id} data-group-id={row.id} data-drag-source={preview?.id === row.id || undefined} data-drop-before={beforeId === row.id || undefined} data-drop-after={afterId === row.id || undefined} role="group" aria-label={`Group field ${index + 1}`}>
            {completeGroup(row) ? <PrototypeButton variant="ghost" className="dg-sort-precedence dg-sort-handle" data-keyboard-focus={keyboardFocusId === row.id || undefined} aria-label={`Reorder ${row.field}, rank ${index + 1} of ${draft.length}. Use Arrow Up or Arrow Down to move.`} aria-describedby={instructionsId} onPointerDown={event => {
              if (event.button !== 0 || !event.isPrimary) return
              setKeyboardFocusId(null)
              pointerFocusing.current = true
              begin(event, row, index)
              pointerFocusing.current = false
            }} onFocus={event => {
              if (!pointerFocusing.current && event.currentTarget.matches(':focus-visible')) setKeyboardFocusId(row.id)
            }} onBlur={() => setKeyboardFocusId(null)} onKeyDown={event => {
              if (event.key !== 'Tab') setKeyboardFocusId(row.id)
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); claimOverlay(null); move(row.id, index + (event.key === 'ArrowUp' ? -1 : 1)) }
            }}><span className="dg-sort-rank" aria-hidden="true">{index + 1}</span><GripVertical className="dg-sort-grip" size={14} aria-hidden="true" /></PrototypeButton>
              : <span className="dg-sort-precedence" aria-label={`Precedence ${index + 1}`}>{index + 1}</span>}
            <div className="dg-rule-controls">
              <PrototypeSelect className="dg-rule-field" searchable autoOpen={autoOpenId === row.id} label={`Field for group ${index + 1}`} placeholder="Select field" value={row.field} options={groupFields} onChange={field => {
                if (!isGroupField(field)) return
                update(row.id, { field, order: row.field === field ? row.order : groupOrders[field][0] })
                setAutoOpenId(null)
              }} />
              {row.field && <><PrototypeSelect className="dg-rule-operator" label={`Order for group ${index + 1}`} value={row.order} options={groupOrders[row.field]} onChange={order => {
                if (isGroupOrder(order)) update(row.id, { order })
              }} /><PrototypeIconButton icon={Ellipsis} label="More group options (deferred)" disabled /></>}
              <PrototypeIconButton className="dg-rule-delete" icon={Trash2} label="Remove Group" onClick={() => {
                if (draft.length === 1) reset()
                else {
                  setAutoOpenId(null)
                  setDraft(rows => rows.filter(item => item.id !== row.id))
                  repairFocus(draft[index + 1]?.id ?? draft[index - 1].id)
                }
              }} />
            </div>
          </div>)}
          <div className="dg-workspace-actions"><PrototypeButton variant="text" className="dg-editor-add" disabled={!validGroup(draft)} onClick={() => {
            const id = nextId.current++
            setDraft(rows => [...rows, groupStarter(id)])
            setAutoOpenId(id)
          }}><Plus size={14} aria-hidden="true" />Add Subgroup</PrototypeButton>
            {draft.length >= 2 && <><span className="dg-summary-divider" aria-hidden="true" /><PrototypeButton className="dg-conditions-action" variant="text" onClick={reset}>Clear all</PrototypeButton></>}
          </div>
        </div>
      </div>
      {guardOpen && <DirtyNavigationGuard subject="group" sourceFocus={sourceFocus} onKeep={onKeep} onDiscard={onDiscard} />}
    </div>
    {preview && <div className="dg-sort-drag-preview" aria-hidden="true" style={{ left: Math.max(8, Math.min(preview.x + 12, window.innerWidth - 248)), top: Math.max(8, Math.min(preview.y + 12, window.innerHeight - 40)) }}>{draft.find(row => row.id === preview.id)?.field}</div>}
  </section>
}
