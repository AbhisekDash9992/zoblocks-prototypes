export type CriteriaState = 'hidden' | 'summary' | 'editor'
export type DraftRule = { id: number; field: string; operator: string; value: string; range?: string }
export type AdvancedSnapshot = { relationship: 'And' | 'Or'; rows: DraftRule[] }
export type SortColumn = 'Client' | 'PHQ-9' | 'Risk Screen' | 'Disengagement' | 'Next Contact'
export type DirectSort = { column: SortColumn; direction: 'ascending' | 'descending' } | null
export const initialAdvancedSnapshot: AdvancedSnapshot = {
  relationship: 'And', rows: [
    { id: 1, field: 'Status', operator: 'is', value: 'Active' },
    { id: 2, field: 'Priority', operator: 'is any of', value: 'High, Medium' },
    { id: 3, field: 'Next Contact', operator: 'is', value: 'Last 7 days' },
  ],
}
export type DataGridPrototypeState = {
  criteriaState: CriteriaState
  criteriaPreset: 'empty' | 'sampleCommitted'
  groupCommitted: boolean
  summarySortCommitted: boolean
  toolbarControls: 'expanded' | 'collapsed'
  heldArrivalsVisible: boolean
  caseloadVisible: boolean
  letThemInVisible: boolean
  showMoreRows: boolean
  density: 'baseline' | 'patient' | 'standard' | 'clinical'
  viewModified: boolean
  criteriaActive: boolean
  fullScreen: boolean
  activeEditor: 'none' | 'advanced' | 'simple'
  activeCriterion: 'none' | 'advanced' | 'simple'
  advancedSnapshot: AdvancedSnapshot
  simpleFilters: DraftRule[]
  activeSimpleId: number | null
  directSort: DirectSort
}

export const defaultDataGridState: DataGridPrototypeState = {
  criteriaState: 'summary',
  criteriaPreset: 'sampleCommitted',
  groupCommitted: true,
  summarySortCommitted: true,
  toolbarControls: 'expanded',
  heldArrivalsVisible: true,
  caseloadVisible: true,
  letThemInVisible: true,
  showMoreRows: false,
  density: 'baseline',
  viewModified: false,
  criteriaActive: true,
  fullScreen: false,
  activeEditor: 'none',
  activeCriterion: 'none',
  advancedSnapshot: initialAdvancedSnapshot,
  simpleFilters: [{ id: 1, field: 'Status', operator: 'is', value: 'Active' }],
  activeSimpleId: null,
  directSort: null,
}

export function withCriteriaState(state: DataGridPrototypeState, criteriaState: CriteriaState): DataGridPrototypeState {
  return {
    ...state, criteriaState,
    activeSimpleId: null,
    activeEditor: criteriaState === 'editor' ? 'advanced' : 'none',
    activeCriterion: criteriaState === 'editor' && state.advancedSnapshot.rows.length > 0 ? 'advanced' : 'none',
  }
}

export function revealFilterEntry(state: DataGridPrototypeState): DataGridPrototypeState {
  return withCriteriaState(state, 'summary')
}
