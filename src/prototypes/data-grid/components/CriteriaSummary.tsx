import { ArrowUpDown, Filter, Layers, Plus, X } from 'lucide-react'
import type { DataGridPrototypeState } from '../model/dataGridPrototypeState'
import { PrototypeTooltip } from '../ui/PrototypeTooltip'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeBadge } from '../ui/PrototypeBadge'

export function CriteriaSummary({ state, onOpenEditor, onAddFilter, onClear }: { state: DataGridPrototypeState; onOpenEditor: (mode: 'advanced' | 'simple') => void; onAddFilter: () => void; onClear: () => void }) {
  const advancedMeaning = state.advancedSnapshot.rows.map(row => `${row.field} ${row.operator} ${row.value}${row.range ? ' · ' + row.range : ''}`).join(` ${state.advancedSnapshot.relationship.toUpperCase()}\n`)
  const simple = state.simpleSnapshot
  return <div className="dg-summary" aria-label="Criteria summary">
    {state.criteriaPreset === 'sampleCommitted' && <>
      <PrototypeTooltip content="Group by: Status"><PrototypeBadge tone="primary" variant="outlined" className="dg-chip"><button type="button" className="dg-chip-open" aria-label="Group by: Status"><Layers size={14} aria-hidden="true" />Group</button><button type="button" aria-label="Remove group criterion" aria-disabled="true"><X size={12} aria-hidden="true" /></button></PrototypeBadge></PrototypeTooltip>
      <PrototypeTooltip content="Sort by: 2 options"><PrototypeBadge tone="primary" variant="outlined" className="dg-chip"><button type="button" className="dg-chip-open" aria-label="Sort by: 2 options"><ArrowUpDown size={14} aria-hidden="true" />Sort</button><button type="button" aria-label="Remove sort criterion" aria-disabled="true"><X size={12} aria-hidden="true" /></button></PrototypeBadge></PrototypeTooltip>
      <span className="dg-summary-divider" aria-hidden="true" />
      {state.advancedSnapshot.rows.length > 0 && <PrototypeTooltip content={`Advanced filter\n${advancedMeaning}`}><PrototypeBadge tone="primary" variant={state.activeCriterion === 'advanced' ? 'solid' : 'outlined'} className={`dg-chip${state.activeCriterion === 'advanced' ? ' dg-chip-selected' : ''}`}><button type="button" className="dg-chip-open" aria-pressed={state.activeCriterion === 'advanced'} onClick={() => onOpenEditor('advanced')}><Filter size={14} aria-hidden="true" />Advanced filter · {state.advancedSnapshot.rows.length} {state.advancedSnapshot.rows.length === 1 ? 'rule' : 'rules'}</button><button type="button" aria-label="Remove advanced filter criterion" aria-disabled="true"><X size={12} aria-hidden="true" /></button></PrototypeBadge></PrototypeTooltip>}
      {simple && <PrototypeTooltip content={`${simple.field} ${simple.operator} ${simple.value}`}><PrototypeBadge tone="primary" variant={state.activeCriterion === 'simple' ? 'solid' : 'outlined'} className={`dg-chip${state.activeCriterion === 'simple' ? ' dg-chip-selected' : ''}`}><button type="button" className="dg-chip-open" aria-label={`${simple.field} ${simple.operator} ${simple.value}`} aria-pressed={state.activeCriterion === 'simple'} onClick={() => onOpenEditor('simple')}>{simple.field}: {simple.value}</button><button type="button" aria-label="Remove status criterion" aria-disabled="true"><X size={12} aria-hidden="true" /></button></PrototypeBadge></PrototypeTooltip>}
    </>}
    {state.criteriaState !== 'editor' && <PrototypeButton variant="text" className="dg-add-filter" onClick={onAddFilter}><Plus size={14} aria-hidden="true" />Add Filter</PrototypeButton>}
    {state.criteriaPreset === 'sampleCommitted' && state.criteriaState === 'summary' && <PrototypeButton variant="text" className="dg-clear" onClick={onClear}>Clear All</PrototypeButton>}
  </div>
}
