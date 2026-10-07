import { DirtyNavigationGuard } from './DirtyNavigationGuard'
import { useEffect, useRef, useState } from 'react'
import { CalendarRange, Plus, Sparkles, Trash2 } from 'lucide-react'
import { filterFields as fields, filterOperators as operators, filterValues as values, completeRule as complete, starterRule } from '../model/filterFields'
import type { AdvancedSnapshot, DraftRule } from '../model/dataGridPrototypeState'
import { PrototypeSelect } from '../ui/PrototypeSelect'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { PrototypeInput } from '../ui/PrototypeInput'

type Props = {
  mode: 'advanced' | 'simple'; advanced: AdvancedSnapshot; simple: DraftRule | null
  guardOpen: boolean; onKeep: () => void; onDiscard: () => void; onAdvanceSimple: (row: DraftRule) => void
  hasAdvanced: boolean; forceDirty?: boolean
  simpleFilters: DraftRule[]; isNew?: boolean; onDirty: (dirty: boolean) => void
  onCancel: () => void; onApplyAdvanced: (snapshot: AdvancedSnapshot) => void
  onApplySimple: (snapshot: DraftRule) => void; onDeleteSimple: () => void
}
export function CriteriaEditorShell({ mode, advanced, simple, simpleFilters, guardOpen, onKeep, onDiscard, onAdvanceSimple, hasAdvanced, forceDirty = false, isNew = false, onDirty, onCancel, onApplyAdvanced, onApplySimple, onDeleteSimple }: Props) {
  const [initial] = useState<AdvancedSnapshot>(() => mode === 'advanced' ? structuredClone(advanced) : { relationship: 'And', rows: [{ ...(simple ?? starterRule(1)) }] })
  const [draft, setDraft] = useState<AdvancedSnapshot>(initial)
  const [autoOpenId, setAutoOpenId] = useState<number | null>(isNew && mode === 'advanced' && !initial.rows[0]?.field ? initial.rows[0]?.id ?? null : null)
  const [valueOpenId, setValueOpenId] = useState<number | null>(isNew && mode === 'simple' ? initial.rows[0].id : null)
  const [aiNotice, setAiNotice] = useState(false)
  const sourceFocus = useRef<HTMLElement | null>(null)
  const numericInput = useRef<HTMLInputElement>(null)
  const nextId = useRef(Math.max(0, ...draft.rows.map(row => row.id)) + 1)
  const dirty = forceDirty || JSON.stringify(draft) !== JSON.stringify(initial)
  useEffect(() => { onDirty(dirty) }, [dirty, onDirty])
  useEffect(() => { if (valueOpenId !== null) numericInput.current?.focus({ preventScroll: true }) }, [valueOpenId])
  const incomplete = draft.rows.some(row => !complete(row))
  const fieldConflict = mode === 'simple' && simpleFilters.some(filter => filter.field === draft.rows[0].field && filter.id !== draft.rows[0].id)
  const valid = draft.rows.length > 0 && !incomplete && !fieldConflict
  const clearing = mode === 'simple' && !isNew && !draft.rows[0].field
  const update = (id: number, patch: Partial<DraftRule>) => setDraft(current => ({ ...current, rows: current.rows.map(row => row.id === id ? { ...row, ...patch } : row) }))
  const controls = (row: DraftRule, index: number) => <div className="dg-rule-controls">
    <PrototypeSelect className="dg-rule-field" autoOpen={row.id === autoOpenId} label={`Field for condition ${index + 1}`} value={row.field} placeholder="Select field" options={mode === 'simple' ? fields.filter(field => !simpleFilters.some(filter => filter.field === field && filter.id !== row.id)) : fields} onChange={field => { update(row.id, { ...starterRule(row.id, field), operator: mode === 'advanced' ? operators[field][0] : starterRule(row.id, field).operator, range: undefined }); setAutoOpenId(null); setValueOpenId(mode === 'simple' ? row.id : null) }} />
    {row.field && <>
      <PrototypeSelect className="dg-rule-operator" label={`Operator for condition ${index + 1}`} value={row.operator} options={operators[row.field]} onChange={operator => { update(row.id, { operator, value: '', range: undefined }); setValueOpenId(mode === 'simple' ? row.id : null) }} />
      {row.field === 'PHQ-9' ? <PrototypeInput ref={numericInput} className="dg-rule-value dg-numeric-input" type="number" aria-label={`Value for condition ${index + 1}`} placeholder="Enter number" value={row.value} onChange={event => update(row.id, { value: event.target.value })} /> : <PrototypeSelect key={`${row.field}-${row.operator}`} autoOpen={row.id === valueOpenId} className="dg-rule-value" label={`Value for condition ${index + 1}`} value={row.value} options={values[row.field]} multiple={row.field === 'Priority' && row.operator === 'is any of'} onChange={value => update(row.id, { value, range: value === 'Date range' ? '1 Oct 2026 – 7 Oct 2026' : undefined })} />}
      {row.field === 'Next Contact' && row.value === 'Date range' && <span className="dg-date-range-control"><CalendarRange size={16} aria-hidden="true" /><PrototypeInput className="dg-date-range" aria-label={`Date range for condition ${index + 1}`} value={row.range ?? ''} onChange={event => update(row.id, { range: event.target.value })} /></span>}
    </>}
    <PrototypeIconButton className="dg-rule-delete" icon={Trash2} label="Remove condition" onClick={() => { setAutoOpenId(null); setValueOpenId(null); setDraft(current => ({ ...current, rows: mode === 'simple' ? [starterRule(row.id)] : current.rows.filter(item => item.id !== row.id) })) }} />
  </div>
  return <section className={`dg-editor dg-editor-${mode}`} aria-labelledby="dg-editor-title" tabIndex={-1} onFocusCapture={event => { if (event.target instanceof HTMLElement && event.currentTarget.contains(event.target) && !event.target.closest('.dg-guard-dialog')) sourceFocus.current = event.target }}>
    <header className="dg-editor-header"><div className="dg-editor-title-group"><h2 id="dg-editor-title">Filter</h2><PrototypeIconButton className="dg-ai-action" icon={Sparkles} label="AI Filter" onClick={() => setAiNotice(true)} /></div><div>
      <PrototypeButton className="dg-editor-action" variant="text" onClick={onCancel}>Cancel</PrototypeButton>
      <PrototypeButton className={`dg-editor-action dg-apply${clearing ? ' dg-destructive' : ''}`} variant="primary" size={24} disabled={!clearing && ((!dirty && !isNew) || !valid)} onClick={() => clearing ? onDeleteSimple() : mode === 'advanced' ? onApplyAdvanced(structuredClone(draft)) : onApplySimple({ ...draft.rows[0] })}>{clearing ? 'Clear filter' : 'Apply'}</PrototypeButton>
    </div></header>
    <div className={`dg-editor-workspace${guardOpen ? ' dg-editor-guarded' : ''}`}>
    <div className={`dg-conditions${mode === 'simple' ? ' dg-simple-conditions' : ''}`} role="region" aria-label={mode === 'advanced' ? 'Representative conditions' : 'Simple filter rule'} tabIndex={0}>
      {aiNotice && <p className="dg-ai-notice" role="status">AI Filter is deferred in this prototype batch.</p>}
      {mode === 'simple' && <div className="dg-conditions-heading"><div><h3>Conditions</h3><p>One condition.</p></div><PrototypeButton className="dg-conditions-action" variant="text" textTone="primary" disabled={!valid} onClick={() => onAdvanceSimple({ ...draft.rows[0] })}>{hasAdvanced ? 'Add to Advanced Filter' : 'Convert to Advanced Filter'}</PrototypeButton></div>}
      {mode === 'advanced' && <><h3>Conditions</h3>{draft.rows.length > 0 && <p>{draft.relationship === 'And' ? 'All' : 'Any'} conditions below must match.</p>}</>}
      {fieldConflict && <p role="status">This field already has a Simple filter. Choose another field.</p>}
      <div className="dg-condition-stack">
      {draft.rows.map((row, index) => mode === 'simple' ? <div key={row.id} className="dg-simple-rule">{controls(row, index)}</div> : <div className="dg-rule-row" key={row.id}>
        {draft.rows.length > 1 && <div className="dg-relationship">{index === 1 ? <PrototypeSelect compact label="Condition relationship" value={draft.relationship} options={['And', 'Or']} onChange={relationship => setDraft(current => ({ ...current, relationship: relationship as 'And' | 'Or' }))} /> : index === 0 ? 'Where' : draft.relationship.toLowerCase()}</div>}
        <div className="dg-rule-surface">{controls(row, index)}<PrototypeButton variant="text" className="dg-nested-filter" disabled={incomplete}><Plus size={14} aria-hidden="true" />Add Nested Filter</PrototypeButton></div>
      </div>)}
      {mode === 'advanced' && <PrototypeButton variant="text" className="dg-editor-add" disabled={incomplete} onClick={() => {
        const id = nextId.current++
        setDraft(current => ({ ...current, rows: [...current.rows, { id, field: '', operator: '', value: '' }] }))
        setAutoOpenId(id)
      }}><Plus size={14} aria-hidden="true" />Add Filter</PrototypeButton>}
      </div>
    </div>
    {guardOpen && <DirtyNavigationGuard sourceFocus={sourceFocus} onKeep={onKeep} onDiscard={onDiscard} />}
    </div>
  </section>
}
