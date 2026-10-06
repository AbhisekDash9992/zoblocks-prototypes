import type { AdvancedSnapshot, DataGridPrototypeState, DraftRule } from '../model/dataGridPrototypeState'
import { CriteriaEditorShell } from './CriteriaEditorShell'
import { CriteriaSummary } from './CriteriaSummary'

export type FilterEditorSession = { key: number; isNew: boolean; advanced: AdvancedSnapshot; simple: DraftRule | null }
export function CriteriaArea({ state, session, onOpenEditor, onAddFilter, onCancel, onClear, onDirty, onApplyAdvanced, onApplySimple, onDeleteSimple, onRemoveSimple }: {
  state: DataGridPrototypeState; session: FilterEditorSession | null
  onOpenEditor: (mode: 'advanced' | 'simple', trigger: HTMLButtonElement, id?: number) => void
  onAddFilter: (trigger: HTMLButtonElement) => void; onCancel: () => void; onClear: () => void
  onDirty: (dirty: boolean) => void; onApplyAdvanced: (snapshot: AdvancedSnapshot) => void
  onApplySimple: (snapshot: DraftRule) => void; onDeleteSimple: () => void; onRemoveSimple: (id: number) => void
}) {
  if (state.criteriaState === 'hidden') return null
  return <div id="dg-criteria-area" className="dg-criteria-area">
    <div className="dg-criteria-surface">
      {state.criteriaState === 'editor' && state.activeEditor !== 'none' && <CriteriaEditorShell key={session?.key ?? state.activeEditor} mode={state.activeEditor} advanced={session?.advanced ?? state.advancedSnapshot} simple={session?.simple ?? state.simpleFilters[0] ?? null} isNew={session?.isNew} onDirty={onDirty} onCancel={onCancel} onApplyAdvanced={onApplyAdvanced} onApplySimple={onApplySimple} onDeleteSimple={onDeleteSimple} />}
      <CriteriaSummary state={state} onOpenEditor={onOpenEditor} onAddFilter={onAddFilter} onClear={onClear} onRemoveSimple={onRemoveSimple} />
    </div>
  </div>
}
