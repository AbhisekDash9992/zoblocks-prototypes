import { useEffect, useRef, useState } from 'react'
import { Ellipsis, Layers, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { GroupDraftRule, GroupSnapshot } from '../model/dataGridPrototypeState'
import { groupFields, groupMeaning, groupOrders, groupStarter, isGroupField, isGroupOrder, validGroup } from '../model/groupFields'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { PrototypeSelect } from '../ui/PrototypeSelect'
import { claimOverlay } from '../ui/overlayState'
import { DirtyNavigationGuard } from './DirtyNavigationGuard'

export function GroupEditorShell({ snapshot, guardOpen, onKeep, onDiscard, onDirty, onCancel, onApply, onClear }: {
  snapshot: GroupSnapshot; guardOpen: boolean; onKeep: () => void; onDiscard: () => void
  onDirty: (dirty: boolean) => void; onCancel: () => void; onApply: (rows: GroupSnapshot) => void; onClear: () => void
}) {
  const [initial] = useState<GroupDraftRule[]>(() => snapshot.length ? structuredClone(snapshot) : [groupStarter(1)])
  const [draft, setDraft] = useState(initial)
  const [autoOpen, setAutoOpen] = useState(snapshot.length === 0)
  const editor = useRef<HTMLElement>(null)
  const sourceFocus = useRef<HTMLElement | null>(null)
  const dirty = groupMeaning(draft) !== groupMeaning(initial)
  const clearing = snapshot.length > 0 && draft.length === 1 && !draft[0].field
  useEffect(() => { onDirty(dirty) }, [dirty, onDirty])
  const reset = (id: number) => {
    setAutoOpen(false)
    setDraft([groupStarter(id)])
    requestAnimationFrame(() => {
      claimOverlay(null)
      editor.current?.querySelector<HTMLButtonElement>('.dg-rule-field')?.focus({ preventScroll: true })
    })
  }
  const update = (id: number, patch: Partial<GroupDraftRule>) => setDraft(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row))
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
        <div className="dg-condition-stack">
          {draft.map((row, index) => <div className="dg-rule-row dg-group-row" key={row.id} role="group" aria-label={`Group field ${index + 1}`}>
            <div className="dg-rule-controls">
              <PrototypeSelect className="dg-rule-field" searchable autoOpen={autoOpen && index === 0} label={`Field for group ${index + 1}`} placeholder="Select field" value={row.field} options={groupFields} onChange={field => {
                if (!isGroupField(field)) return
                update(row.id, { field, order: row.field === field ? row.order : groupOrders[field][0] })
                setAutoOpen(false)
              }} />
              {row.field && <><PrototypeSelect className="dg-rule-operator" label={`Order for group ${index + 1}`} value={row.order} options={groupOrders[row.field]} onChange={order => {
                if (isGroupOrder(order)) update(row.id, { order })
              }} /><PrototypeIconButton icon={Ellipsis} label="More group options (deferred)" disabled /></>}
              <PrototypeIconButton className="dg-rule-delete" icon={Trash2} label="Remove Group" onClick={() => reset(row.id)} />
            </div>
          </div>)}
          <div className="dg-workspace-actions"><PrototypeButton variant="text" className="dg-editor-add" disabled><Plus size={14} aria-hidden="true" />Add Subgroup</PrototypeButton></div>
        </div>
      </div>
      {guardOpen && <DirtyNavigationGuard subject="group" sourceFocus={sourceFocus} onKeep={onKeep} onDiscard={onDiscard} />}
    </div>
  </section>
}
