import type { DataGridPrototypeState } from '../model/dataGridPrototypeState'
import { CriteriaEditorShell } from './CriteriaEditorShell'
import { CriteriaSummary } from './CriteriaSummary'
import type { AdvancedSnapshot, DraftRule } from '../model/dataGridPrototypeState'

export function CriteriaArea({ state, onOpenEditor, onAddFilter, onCancel, onClear, onApplyAdvanced, onApplySimple, onDeleteSimple }: { state: DataGridPrototypeState; onOpenEditor: (mode: 'advanced' | 'simple') => void; onAddFilter: () => void; onCancel: () => void; onClear: () => void; onApplyAdvanced: (snapshot: AdvancedSnapshot) => void; onApplySimple: (snapshot: DraftRule) => void; onDeleteSimple: () => void }) {
  if (state.criteriaState === 'hidden') return null
  return <div id="dg-criteria-area" className="dg-criteria-area">
    <div className="dg-criteria-surface">
      {state.criteriaState === 'editor' && state.activeEditor !== 'none' && <CriteriaEditorShell key={state.activeEditor} mode={state.activeEditor} advanced={state.advancedSnapshot} simple={state.simpleSnapshot} onCancel={onCancel} onApplyAdvanced={onApplyAdvanced} onApplySimple={onApplySimple} onDeleteSimple={onDeleteSimple} />}
      <CriteriaSummary state={state} onOpenEditor={onOpenEditor} onAddFilter={onAddFilter} onClear={onClear} />
    </div>
  </div>
}
