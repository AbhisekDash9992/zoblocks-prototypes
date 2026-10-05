import { useRef, useState } from 'react'
import { CalendarRange, Plus, Trash2 } from 'lucide-react'
import { syntheticGridData } from '../data/syntheticGridData'
import type { AdvancedSnapshot, DraftRule } from '../model/dataGridPrototypeState'
import { PrototypeSelect } from '../ui/PrototypeSelect'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { PrototypeInput } from '../ui/PrototypeInput'

// Representative field/operator options, not a clinical query matrix.
const fields = ['Status', 'Priority', 'Client', 'Risk Screen', 'PHQ-9', 'Next Contact']
const operators: Record<string, string[]> = {
  Status: ['is', 'is not'], Priority: ['is', 'is not', 'is any of'], Client: ['is', 'is not'],
  'Risk Screen': ['is', 'is not'], 'PHQ-9': ['equals', 'greater than', 'less than'], 'Next Contact': ['is', 'before', 'after'],
}
const values: Record<string, string[]> = {
  Status: ['Active', 'Inactive', 'Awaiting'], Priority: ['High', 'Medium', 'Low'],
  Client: syntheticGridData.map(record => record.name),
  'Risk Screen': ['Passive ideation', 'Ideation with plan', 'Ideation, no plan', 'None reported'],
  'Next Contact': ['Last 1 day', 'Last 7 days', 'Last 1 month', 'Date range'],
}
function complete(row: DraftRule) {
  return Boolean(row.field && row.operator && row.value.trim() && (row.value !== 'Date range' || row.range?.trim()) && (row.field !== 'PHQ-9' || Number.isFinite(Number(row.value))))
}
type Props = {
  mode: 'advanced' | 'simple'; advanced: AdvancedSnapshot; simple: DraftRule | null
  onCancel: () => void; onApplyAdvanced: (snapshot: AdvancedSnapshot) => void
  onApplySimple: (snapshot: DraftRule) => void; onDeleteSimple: () => void
}
export function CriteriaEditorShell({ mode, advanced, simple, onCancel, onApplyAdvanced, onApplySimple, onDeleteSimple }: Props) {
  const [initial] = useState<AdvancedSnapshot>(() => mode === 'advanced' ? structuredClone(advanced) : { relationship: 'And', rows: simple ? [{ ...simple }] : [] })
  const [draft, setDraft] = useState<AdvancedSnapshot>(initial)
  const [autoOpenId, setAutoOpenId] = useState<number | null>(null)
  const nextId = useRef(Math.max(0, ...draft.rows.map(row => row.id)) + 1)
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)
  const incomplete = draft.rows.some(row => !complete(row))
  const valid = draft.rows.length > 0 && !incomplete
  const update = (id: number, patch: Partial<DraftRule>) => setDraft(current => ({ ...current, rows: current.rows.map(row => row.id === id ? { ...row, ...patch } : row) }))
  const controls = (row: DraftRule, index: number) => <div className="dg-rule-controls">
    {mode === 'advanced' ? <PrototypeSelect className="dg-rule-field" autoOpen={row.id === autoOpenId} label={`Field for condition ${index + 1}`} value={row.field} placeholder="Select field" options={fields} onChange={field => update(row.id, { field, operator: operators[field][0], value: '', range: undefined })} /> : <PrototypeInput className="dg-rule-field dg-readonly-field" aria-label="Simple filter field" value="Status" readOnly />}
    {row.field && <>
      <PrototypeSelect className="dg-rule-operator" label={`Operator for condition ${index + 1}`} value={row.operator} options={operators[row.field]} onChange={operator => update(row.id, { operator, value: '', range: undefined })} />
      {row.field === 'PHQ-9' ? <PrototypeInput className="dg-rule-value dg-numeric-input" type="number" aria-label={`Value for condition ${index + 1}`} placeholder="Enter number" value={row.value} onChange={event => update(row.id, { value: event.target.value })} /> : <PrototypeSelect className="dg-rule-value" label={`Value for condition ${index + 1}`} value={row.value} options={values[row.field]} multiple={row.field === 'Priority' && row.operator === 'is any of'} onChange={value => update(row.id, { value, range: value === 'Date range' ? '1 Oct 2026 – 7 Oct 2026' : undefined })} />}
      {row.field === 'Next Contact' && row.value === 'Date range' && <span className="dg-date-range-control"><CalendarRange size={16} aria-hidden="true" /><PrototypeInput className="dg-date-range" aria-label={`Date range for condition ${index + 1}`} value={row.range ?? ''} onChange={event => update(row.id, { range: event.target.value })} /></span>}
    </>}
    <PrototypeIconButton className="dg-rule-delete" icon={Trash2} label={`Delete condition ${index + 1}`} onClick={() => mode === 'simple' ? onDeleteSimple() : setDraft(current => ({ ...current, rows: current.rows.filter(item => item.id !== row.id) }))} />
  </div>
  return <section className={`dg-editor dg-editor-${mode}`} aria-labelledby="dg-editor-title">
    <header className="dg-editor-header"><h2 id="dg-editor-title">Filter</h2><div>
      <PrototypeButton variant="text" onClick={onCancel}>Cancel</PrototypeButton>
      <PrototypeButton className="dg-apply" variant="primary" size={32} disabled={!dirty || !valid} onClick={() => mode === 'advanced' ? onApplyAdvanced(structuredClone(draft)) : onApplySimple({ ...draft.rows[0] })}>Apply</PrototypeButton>
    </div></header>
    <div className={`dg-conditions${mode === 'simple' ? ' dg-simple-conditions' : ''}`} role="region" aria-label={mode === 'advanced' ? 'Representative conditions' : 'Existing simple criterion'} tabIndex={0}>
      {mode === 'advanced' && <><h3>Conditions</h3>{draft.rows.length > 0 && <p>{draft.relationship === 'And' ? 'All' : 'Any'} conditions below must match.</p>}</>}
      <div className="dg-condition-stack">
      {draft.rows.map((row, index) => mode === 'simple' ? <div key={row.id} className="dg-simple-rule">{controls(row, index)}</div> : <div className="dg-rule-row" key={row.id}>
        {draft.rows.length > 1 && <div className="dg-relationship">{index === 1 ? <PrototypeSelect compact label="Condition relationship" value={draft.relationship} options={['And', 'Or']} onChange={relationship => setDraft(current => ({ ...current, relationship: relationship as 'And' | 'Or' }))} /> : index === 0 ? 'Where' : draft.relationship.toLowerCase()}</div>}
        <div className="dg-rule-surface">{controls(row, index)}<PrototypeButton variant="text" className="dg-nested-filter" disabled={incomplete} aria-disabled={!incomplete || undefined}><Plus size={14} aria-hidden="true" />Add Nested Filter</PrototypeButton></div>
      </div>)}
      {mode === 'advanced' && <PrototypeButton variant="text" className="dg-editor-add" disabled={incomplete} onClick={() => {
        const id = nextId.current++
        setDraft(current => ({ ...current, rows: [...current.rows, { id, field: '', operator: '', value: '' }] }))
        setAutoOpenId(id)
      }}><Plus size={14} aria-hidden="true" />Add Filter</PrototypeButton>}
      </div>
    </div>
  </section>
}
