import type { DataGridPrototypeState } from '../model/dataGridPrototypeState'
import { defaultDataGridState, withCriteriaState } from '../model/dataGridPrototypeState'
import { PrototypeSwitch as ReviewSwitch } from '../ui/PrototypeSwitch'
import { PrototypeButton } from '../ui/PrototypeButton'

export function PrototypeStateControls({ state, onChange }: { state: DataGridPrototypeState; onChange: (state: DataGridPrototypeState, reset?: boolean) => void }) {
  return <aside className="dg-review" aria-labelledby="dg-review-title">
    <div className="dg-review-heading"><h2 id="dg-review-title">Prototype controls</h2><span>Review only</span><PrototypeButton onClick={() => onChange({ ...defaultDataGridState }, true)}>Reset to default</PrototypeButton></div>
    <div className="dg-review-columns"><div className="dg-review-fields">
      <label>Criteria<select value={state.criteriaState} onChange={event => onChange(withCriteriaState(state, event.target.value as DataGridPrototypeState['criteriaState']))}><option value="hidden">Hidden</option><option value="summary">Summary</option><option value="editor">Editor</option></select></label>
      <ReviewSwitch label="Sample committed summary" checked={state.criteriaPreset === 'sampleCommitted'} onChange={checked => onChange({ ...state, criteriaPreset: checked ? 'sampleCommitted' : 'empty', groupSnapshot: checked ? structuredClone(defaultDataGridState.groupSnapshot) : [], sortSnapshot: checked ? structuredClone(defaultDataGridState.sortSnapshot) : [], advancedSnapshot: checked ? structuredClone(defaultDataGridState.advancedSnapshot) : { relationship: 'And', rows: [] }, simpleFilters: checked ? structuredClone(defaultDataGridState.simpleFilters) : [], criteriaActive: checked, activeEditor: (state.activeEditor === 'sort' || state.activeEditor === 'group') ? 'advanced' : state.activeEditor, activeCriterion: checked && state.criteriaState === 'editor' ? 'advanced' : 'none' })} />
      <ReviewSwitch label="Toolbar expanded" checked={state.toolbarControls === 'expanded'} onChange={checked => onChange({ ...state, toolbarControls: checked ? 'expanded' : 'collapsed' })} />
      <ReviewSwitch label="View modified" checked={state.viewModified} onChange={checked => onChange({ ...state, viewModified: checked })} />
      <ReviewSwitch label="Caseload context visible" checked={state.caseloadVisible} onChange={checked => onChange({ ...state, caseloadVisible: checked })} />
      <ReviewSwitch label="Held arrivals visible" checked={state.heldArrivalsVisible} onChange={checked => onChange({ ...state, heldArrivalsVisible: checked })} />
      <ReviewSwitch label="Let them in action visible" checked={state.letThemInVisible} onChange={checked => onChange({ ...state, letThemInVisible: checked })} />
      <ReviewSwitch label="Show 5 more rows" checked={state.showMoreRows} onChange={checked => onChange({ ...state, showMoreRows: checked })} />
      <label>Density<select value={state.density} onChange={event => onChange({ ...state, density: event.target.value as DataGridPrototypeState['density'] })}><option value="baseline">Figma baseline</option><option value="patient">Patient</option><option value="standard">Standard</option><option value="clinical">Clinical</option></select></label>
      <ReviewSwitch label="Full-screen candidate" checked={state.fullScreen} onChange={checked => onChange({ ...state, fullScreen: checked })} />
    </div>
    <div className="dg-review-notes">
      <p>Representative Advanced, Simple, Sort and Group criterion editing. Apply commits a local snapshot when dirty and valid. Advanced supports top-level and directly nested conditions. Criteria workspace edits do not change table rows.</p>
      <p>Toolbar Filter and Summary Add Filter share the field picker. Field selection opens one Simple rule with its Value control ready. AI Filter remains deferred. Use Criteria Editor to review the Advanced sample.</p>
      <p>Synthetic people and visual states only, with no clinical threshold or scheduling contract. Summary chips and tooltips are independent representative committed examples.</p>
      <p>Review viewport: 720px. Conditions cap: 240px Simple / 360px Advanced. Density comparison: Figma baseline 42px, Patient 52px, Standard 40px, Clinical 30px. These are local review values, not production tokens.</p>
      <p>Toolbar Sort and View Settings → Sort open the same ordered Sort workspace. Drag a row's leading grip or focus it and use Arrow Up / Arrow Down to change draft precedence. Direct header sorting reorders synthetic rows using one column and remains separate; integration is deferred. Search, Saved View editing, other View Settings and Let them in remain previews. Summary removals and Clear All support Undo.</p>
      <p>Toolbar Group, View Settings → Group and the Group Summary chip open the shared Group By workspace. One field with an automatic type-aware order can be applied. Add Subgroup, More configuration and AI Group are disabled pending later batches; table grouping remains deferred.</p>
      <p>Narrow-width product behavior remains unresolved; horizontal containment is for review. This code is not production ZoBlocks implementation.</p>
    </div></div>
  </aside>
}
