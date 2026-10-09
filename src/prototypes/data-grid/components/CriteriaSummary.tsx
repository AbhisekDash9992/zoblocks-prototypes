import type { RefObject } from 'react'
import { advancedLeaves, advancedMeaning } from '../model/advancedFilter'
import { ArrowUpDown, Filter, Layers, Plus, X } from 'lucide-react'
import type { CriteriaEditorMode, DataGridPrototypeState } from '../model/dataGridPrototypeState'
import { sortSummary } from '../model/sortFields'
import { groupSummary } from '../model/groupFields'
import { PrototypeTooltip } from '../ui/PrototypeTooltip'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeBadge } from '../ui/PrototypeBadge'

export function CriteriaSummary({ state, onOpenEditor, onAddFilter, onClear, onRemoveSimple, onRemoveCriterion, addFilterRef }: { addFilterRef: RefObject<HTMLButtonElement | null>; state: DataGridPrototypeState; onOpenEditor: (mode: CriteriaEditorMode, trigger: HTMLButtonElement, id?: number) => void; onAddFilter: (trigger: HTMLButtonElement) => void; onClear: () => void; onRemoveSimple: (id: number) => void; onRemoveCriterion: (kind: 'group' | 'sort' | 'advanced') => void }) {
  const meaning = advancedMeaning(state.advancedSnapshot)
  const ruleCount = advancedLeaves(state.advancedSnapshot).length
  const hasSort = state.sortSnapshot.length > 0
  const hasGroup = state.groupSnapshot.length > 0
  const hasCriteria = hasGroup || hasSort || state.advancedSnapshot.rows.length > 0 || state.simpleFilters.length > 0
  return <div className="dg-summary" aria-label="Criteria summary" tabIndex={-1}>
    {hasGroup &&
      <PrototypeTooltip bounded content={`Group by:\n${state.groupSnapshot.map((row, index) => `${index + 1}. ${row.field}: ${row.order}`).join('\n')}`}><PrototypeBadge tone="primary" variant={state.activeCriterion === 'group' ? 'solid' : 'outlined'} className={`dg-chip${state.activeCriterion === 'group' ? ' dg-chip-selected' : ''}`}><button type="button" className="dg-chip-open" aria-label={groupSummary(state.groupSnapshot)} aria-pressed={state.activeCriterion === 'group'} onClick={event => onOpenEditor('group', event.currentTarget)}><Layers size={14} aria-hidden="true" />{groupSummary(state.groupSnapshot)}</button><button type="button" aria-label="Remove group criterion" onClick={() => onRemoveCriterion('group')}><X size={12} aria-hidden="true" /></button></PrototypeBadge></PrototypeTooltip>}
    {hasSort && <PrototypeTooltip bounded content={`Sort by:\n${state.sortSnapshot.map((row, index) => `${index + 1}. ${row.field}: ${row.direction}`).join('\n')}`}><PrototypeBadge tone="primary" variant={state.activeCriterion === 'sort' ? 'solid' : 'outlined'} className={`dg-chip${state.activeCriterion === 'sort' ? ' dg-chip-selected' : ''}`}><button type="button" className="dg-chip-open" aria-pressed={state.activeCriterion === 'sort'} onClick={event => onOpenEditor('sort', event.currentTarget)}><ArrowUpDown size={14} aria-hidden="true" />{sortSummary(state.sortSnapshot)}</button><button type="button" aria-label="Remove sort criterion" onClick={() => onRemoveCriterion('sort')}><X size={12} aria-hidden="true" /></button></PrototypeBadge></PrototypeTooltip>}
    {(hasGroup || hasSort) && <span className="dg-summary-divider" aria-hidden="true" />}
      {state.advancedSnapshot.rows.length > 0 && <PrototypeTooltip bounded content={`Advanced filter\n${meaning}`}><PrototypeBadge tone="primary" variant={state.activeCriterion === 'advanced' ? 'solid' : 'outlined'} className={`dg-chip${state.activeCriterion === 'advanced' ? ' dg-chip-selected' : ''}`}><button type="button" className="dg-chip-open" aria-pressed={state.activeCriterion === 'advanced'} onClick={event => onOpenEditor('advanced', event.currentTarget)}><Filter size={14} aria-hidden="true" />Advanced filter · {ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}</button><button type="button" aria-label="Remove advanced filter criterion" onClick={() => onRemoveCriterion('advanced')}><X size={12} aria-hidden="true" /></button></PrototypeBadge></PrototypeTooltip>}
      {state.simpleFilters.map(simple => <PrototypeTooltip key={simple.id} content={`${simple.field} ${simple.operator} ${simple.value}`}><PrototypeBadge tone="primary" variant={state.activeCriterion === 'simple' && state.activeSimpleId === simple.id ? 'solid' : 'outlined'} className={`dg-chip${state.activeCriterion === 'simple' && state.activeSimpleId === simple.id ? ' dg-chip-selected' : ''}`}><button type="button" className="dg-chip-open" aria-label={`${simple.field} ${simple.operator} ${simple.value}`} aria-pressed={state.activeCriterion === 'simple' && state.activeSimpleId === simple.id} onClick={event => onOpenEditor('simple', event.currentTarget, simple.id)}>{simple.field}: {simple.value}</button><button type="button" aria-label={`Remove ${simple.field} criterion`} onClick={() => onRemoveSimple(simple.id)}><X size={12} aria-hidden="true" /></button></PrototypeBadge></PrototypeTooltip>)}
    {state.criteriaState !== 'editor' && <PrototypeButton variant="text" ref={addFilterRef} className="dg-add-filter" onClick={event => onAddFilter(event.currentTarget)}><Plus size={14} aria-hidden="true" />Add Filter</PrototypeButton>}
    {hasCriteria && state.criteriaState === 'summary' && <PrototypeButton variant="text" className="dg-clear" onClick={onClear}>Clear All</PrototypeButton>}
  </div>
}
