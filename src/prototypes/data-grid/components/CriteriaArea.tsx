import type { RefObject } from 'react'
import type { AdvancedSnapshot, CriteriaEditorMode, DataGridPrototypeState, DraftRule, SortRule } from '../model/dataGridPrototypeState'
import { CriteriaEditorShell } from './CriteriaEditorShell'
import { SortEditorShell } from './SortEditorShell'
import { CriteriaSummary } from './CriteriaSummary'

export type CriteriaEditorSession = { key: number; isNew: boolean; advanced: AdvancedSnapshot; simple: DraftRule | null; sort?: SortRule[]; transferSimpleId?: number; forceDirty?: boolean }
export function CriteriaArea({ state, session, addFilterRef, guardOpen, onKeep, onDiscard, onAdvanceSimple, onOpenEditor, onAddFilter, onCancel, onClear, onDirty, onApplyAdvanced, onApplySimple, onApplySort, onDeleteSimple, onRemoveSimple, onRemoveCriterion }: {
  addFilterRef: RefObject<HTMLButtonElement | null>; state: DataGridPrototypeState; session: CriteriaEditorSession | null
  guardOpen: boolean; onKeep: () => void; onDiscard: () => void; onAdvanceSimple: (row: DraftRule) => void
  onOpenEditor: (mode: CriteriaEditorMode, trigger: HTMLButtonElement, id?: number) => void
  onAddFilter: (trigger: HTMLButtonElement) => void; onCancel: () => void; onClear: () => void
  onDirty: (dirty: boolean) => void; onApplyAdvanced: (snapshot: AdvancedSnapshot) => void
  onApplySimple: (snapshot: DraftRule) => void; onApplySort: (snapshot: SortRule[]) => void; onDeleteSimple: () => void; onRemoveSimple: (id: number) => void; onRemoveCriterion: (kind: 'group' | 'sort' | 'advanced') => void
}) {
  if (state.criteriaState === 'hidden') return null
  return <div id="dg-criteria-area" className="dg-criteria-area">
    <div className="dg-criteria-surface">
      {state.criteriaState === 'editor' && (state.activeEditor === 'sort'
        ? <SortEditorShell key={session?.key ?? 'sort'} snapshot={session?.sort ?? state.sortSnapshot} guardOpen={guardOpen} onKeep={onKeep} onDiscard={onDiscard} onDirty={onDirty} onCancel={onCancel} onApply={onApplySort} onClear={() => onRemoveCriterion('sort')} />
        : state.activeEditor !== 'none' && <CriteriaEditorShell key={session?.key ?? state.activeEditor} guardOpen={guardOpen} onKeep={onKeep} onDiscard={onDiscard} onAdvanceSimple={onAdvanceSimple} hasAdvanced={state.advancedSnapshot.rows.length > 0} forceDirty={session?.forceDirty} mode={state.activeEditor} simpleFilters={state.simpleFilters} advanced={session?.advanced ?? state.advancedSnapshot} simple={session?.simple ?? state.simpleFilters[0] ?? null} isNew={session?.isNew} onDirty={onDirty} onCancel={onCancel} onApplyAdvanced={onApplyAdvanced} onApplySimple={onApplySimple} onDeleteSimple={onDeleteSimple} onDeleteAdvanced={() => onRemoveCriterion('advanced')} />)}
      <CriteriaSummary addFilterRef={addFilterRef} state={state} onOpenEditor={onOpenEditor} onAddFilter={onAddFilter} onClear={onClear} onRemoveSimple={onRemoveSimple} onRemoveCriterion={onRemoveCriterion} />
    </div>
  </div>
}
