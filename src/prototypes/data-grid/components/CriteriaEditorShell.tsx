import { DirtyNavigationGuard } from './DirtyNavigationGuard'
import { useEffect, useRef, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { completeRule as complete, starterRule } from '../model/filterFields'
import { advancedLeaves, advancedStarter, isAdvancedStarter, meaningfulRule } from '../model/advancedFilter'
import type { AdvancedSnapshot, BooleanRelationship, DraftRule } from '../model/dataGridPrototypeState'
import { PrototypeSelect } from '../ui/PrototypeSelect'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { claimOverlay } from '../ui/overlayState'
import { FilterRuleControls } from './FilterRuleControls'

type Props = {
  mode: 'advanced' | 'simple'; advanced: AdvancedSnapshot; simple: DraftRule | null
  guardOpen: boolean; onKeep: () => void; onDiscard: () => void; onAdvanceSimple: (row: DraftRule) => void
  hasAdvanced: boolean; forceDirty?: boolean
  simpleFilters: DraftRule[]; isNew?: boolean; onDirty: (dirty: boolean) => void
  onCancel: () => void; onApplyAdvanced: (snapshot: AdvancedSnapshot) => void
  onApplySimple: (snapshot: DraftRule) => void; onDeleteSimple: () => void; onDeleteAdvanced: () => void
}
export function CriteriaEditorShell({ mode, advanced, simple, simpleFilters, guardOpen, onKeep, onDiscard, onAdvanceSimple, hasAdvanced, forceDirty = false, isNew = false, onDirty, onCancel, onApplyAdvanced, onApplySimple, onDeleteSimple, onDeleteAdvanced }: Props) {
  const [initial] = useState<AdvancedSnapshot>(() => mode === 'advanced'
    ? advanced.rows.length ? structuredClone(advanced) : advancedStarter(1)
    : { relationship: 'And', rows: [{ ...(simple ?? starterRule(1)) }] })
  const [draft, setDraft] = useState<AdvancedSnapshot>(initial)
  const [autoOpenId, setAutoOpenId] = useState<number | null>(mode === 'advanced' && !initial.rows[0].field ? initial.rows[0].id : null)
  const [valueOpenId, setValueOpenId] = useState<number | null>(isNew && mode === 'simple' ? initial.rows[0].id : null)
  const [aiNotice, setAiNotice] = useState(false)
  const sourceFocus = useRef<HTMLElement | null>(null)
  const editor = useRef<HTMLElement>(null)
  const numericInput = useRef<HTMLInputElement>(null)
  const nextId = useRef(Math.max(0, ...advancedLeaves(initial).map(row => row.id)) + 1)
  const dirty = forceDirty || JSON.stringify(draft) !== JSON.stringify(initial)
  useEffect(() => { onDirty(dirty) }, [dirty, onDirty])
  useEffect(() => { if (valueOpenId !== null) numericInput.current?.focus({ preventScroll: true }) }, [valueOpenId])
  const leaves = advancedLeaves(draft)
  const incomplete = leaves.some(row => !complete(row))
  const fieldConflict = mode === 'simple' && simpleFilters.some(filter => filter.field === draft.rows[0].field && filter.id !== draft.rows[0].id)
  const valid = draft.rows.length > 0 && !incomplete && !fieldConflict
  const clearingSimple = mode === 'simple' && !isNew && !draft.rows[0].field
  const clearingAdvanced = mode === 'advanced' && hasAdvanced && isAdvancedStarter(draft)
  const clearing = clearingSimple || clearingAdvanced
  const update = (id: number, patch: Partial<DraftRule>) => setDraft(current => ({ ...current, rows: current.rows.map(row => ({
    ...row, ...(row.id === id ? patch : {}),
    ...(row.nested ? { nested: { ...row.nested, rows: row.nested.rows.map(child => child.id === id ? { ...child, ...patch } : child) } } : {}),
  })) }))
  const repairRuleFocus = () => requestAnimationFrame(() => {
    claimOverlay(null)
    const focused = document.activeElement
    if (!(focused instanceof HTMLElement) || !focused.isConnected || focused === document.body) editor.current?.focus({ preventScroll: true })
  })
  const resetDraft = () => {
    setAutoOpenId(null); setValueOpenId(null)
    setDraft(advancedStarter(nextId.current++))
    repairRuleFocus()
  }
  const remove = (id: number, parentId?: number) => {
    setAutoOpenId(null); setValueOpenId(null)
    const resetId = parentId === undefined && mode === 'advanced' && draft.rows.length === 1 ? nextId.current++ : null
    setDraft(current => {
      if (parentId === undefined) return resetId !== null ? advancedStarter(resetId) : { ...current, rows: mode === 'simple' ? [starterRule(id)] : current.rows.filter(row => row.id !== id) }
      return { ...current, rows: current.rows.map(row => {
        if (row.id !== parentId || !row.nested) return row
        const children = row.nested.rows.filter(child => child.id !== id)
        const { nested, ...rule } = row
        return children.length ? { ...rule, nested: { ...nested, rows: children } } : rule
      }) }
    })
    repairRuleFocus()
  }
  const controls = (row: DraftRule, context: string, canDelete: boolean, parentId?: number) => <FilterRuleControls
    row={row} context={context} mode={mode} simpleFilters={simpleFilters} autoOpenId={autoOpenId} valueOpenId={valueOpenId} numericInput={numericInput}
    onUpdate={patch => update(row.id, patch)} onFieldChosen={() => { setAutoOpenId(null); setValueOpenId(mode === 'simple' ? row.id : null) }}
    onOperatorChosen={() => setValueOpenId(mode === 'simple' ? row.id : null)} canDelete={canDelete} onDelete={() => remove(row.id, parentId)} />
  const relationship = (index: number, count: number, value: BooleanRelationship, label: string, onChange: (value: BooleanRelationship) => void, firstLabel = 'Where') => count > 1 && <div className="dg-relationship" aria-hidden={index === 0 && !firstLabel || undefined}>
    {index === 1 ? <PrototypeSelect compact label={label} value={value} options={['And', 'Or']} onChange={next => onChange(next as BooleanRelationship)} /> : index === 0 ? firstLabel : value.toLowerCase()}
  </div>
  const addNested = (parentId: number) => {
    if (incomplete) return
    const id = nextId.current++
    setDraft(current => ({ ...current, rows: current.rows.map(row => row.id === parentId ? { ...row, nested: { relationship: row.nested?.relationship ?? 'And', rows: [...(row.nested?.rows ?? []), starterRule(id)] } } : row) }))
    setAutoOpenId(id)
  }
  return <section ref={editor} className={`dg-editor dg-editor-${mode}`} aria-labelledby="dg-editor-title" tabIndex={-1} onFocusCapture={event => { if (event.target instanceof HTMLElement && event.currentTarget.contains(event.target) && !event.target.closest('.dg-guard-dialog')) sourceFocus.current = event.target }}>
    <header className="dg-editor-header"><div className="dg-editor-title-group"><h2 id="dg-editor-title">Filter</h2><PrototypeIconButton className="dg-ai-action" icon={Sparkles} label="AI Filter" onClick={() => setAiNotice(true)} /></div><div>
      <PrototypeButton className="dg-editor-action" variant="text" onClick={onCancel}>Cancel</PrototypeButton>
      <PrototypeButton className={`dg-editor-action dg-apply${clearing ? ' dg-destructive' : ''}`} variant="primary" size={24} disabled={!clearing && ((!dirty && !isNew) || !valid)} onClick={() => clearingAdvanced ? onDeleteAdvanced() : clearingSimple ? onDeleteSimple() : mode === 'advanced' ? onApplyAdvanced(structuredClone(draft)) : onApplySimple({ ...draft.rows[0] })}>{clearingAdvanced ? 'Clear advanced filter' : clearingSimple ? 'Clear filter' : 'Apply'}</PrototypeButton>
    </div></header>
    <div className={`dg-editor-workspace${guardOpen ? ' dg-editor-guarded' : ''}`}>
    <div className={`dg-conditions${mode === 'simple' ? ' dg-simple-conditions' : ''}`} role="region" aria-label={mode === 'advanced' ? 'Advanced filter conditions' : 'Simple filter rule'} tabIndex={0}>
      {aiNotice && <p className="dg-ai-notice" role="status">AI Filter is deferred in this prototype batch.</p>}
      <div className="dg-conditions-heading"><div><h3>Conditions</h3><p>{mode === 'simple' ? 'One condition.' : `${draft.relationship === 'And' ? 'All' : 'Any'} conditions below must match.`}</p></div>
        {mode === 'simple' ? <PrototypeButton className="dg-conditions-action" variant="text" textTone="primary" disabled={!valid} onClick={() => onAdvanceSimple({ ...draft.rows[0] })}>{hasAdvanced ? 'Add to Advanced Filter' : 'Convert to Advanced Filter'}</PrototypeButton>
          : leaves.filter(meaningfulRule).length >= 2 && <PrototypeButton className="dg-conditions-action" variant="text" onClick={resetDraft}>Clear all</PrototypeButton>}
      </div>
      {fieldConflict && <p role="status">This field already has a Simple filter. Choose another field.</p>}
      <div className="dg-condition-stack">
      {draft.rows.map((row, index) => mode === 'simple' ? <div key={row.id} className="dg-simple-rule">{controls(row, `condition ${index + 1}`, true)}</div> : <div className="dg-rule-row" key={row.id}>
        {relationship(index, draft.rows.length, draft.relationship, 'Level 1 condition relationship', value => setDraft(current => ({ ...current, relationship: value })), row.nested?.rows.length ? '' : 'Where')}
        <div className="dg-rule-surface">
          <div className="dg-internal-rules" role="group" aria-label={`Conditions inside Level 1 surface ${index + 1}`}>
            {[row, ...(row.nested?.rows ?? [])].map((rule, internalIndex) => <div className={`dg-rule-row dg-internal-row${internalIndex > 0 ? ' dg-nested-row' : ''}`} key={rule.id}>
              {relationship(internalIndex, 1 + (row.nested?.rows.length ?? 0), row.nested?.relationship ?? 'And', `Level 2 relationship for Level 1 condition ${index + 1}`, value => setDraft(current => ({ ...current, rows: current.rows.map(item => item.id === row.id && item.nested ? { ...item, nested: { ...item.nested, relationship: value } } : item) })))}
              {internalIndex === 0
                ? controls(rule, `Level 1 condition ${index + 1}`, meaningfulRule(rule) || draft.rows.length > 1 || Boolean(row.nested?.rows.length))
                : controls(rule, `Level 2 condition ${internalIndex} in Level 1 condition ${index + 1}`, true, row.id)}
            </div>)}
          </div>
          {complete(row) && <PrototypeButton variant="text" className="dg-nested-filter" aria-label={`Add Nested Filter to Level 1 condition ${index + 1}`} disabled={incomplete} onClick={() => addNested(row.id)}><Plus size={14} aria-hidden="true" />Add Nested Filter</PrototypeButton>}
        </div>
      </div>)}
      {mode === 'advanced' && <PrototypeButton variant="text" className="dg-editor-add" disabled={incomplete} onClick={() => {
        const id = nextId.current++
        setDraft(current => ({ ...current, rows: [...current.rows, starterRule(id)] }))
        setAutoOpenId(id)
      }}><Plus size={14} aria-hidden="true" />Add Filter</PrototypeButton>}
      </div>
    </div>
    {guardOpen && <DirtyNavigationGuard sourceFocus={sourceFocus} onKeep={onKeep} onDiscard={onDiscard} />}
    </div>
  </section>
}
