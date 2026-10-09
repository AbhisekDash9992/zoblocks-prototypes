export type CriteriaState = 'hidden' | 'summary' | 'editor'
export type DraftRule = { id: number; field: string; operator: string; value: string; range?: string }
export type BooleanRelationship = 'And' | 'Or'
// Only two levels: a Level 1 condition owns a flat set of Level 2 conditions.
// Optional nested sets also keep existing Batch 2 flat snapshots compatible.
export type AdvancedRule = DraftRule & { nested?: { relationship: BooleanRelationship; rows: DraftRule[] } }
export type AdvancedSnapshot = { relationship: BooleanRelationship; rows: AdvancedRule[] }
export type SortColumn = 'Client' | 'PHQ-9' | 'Risk Screen' | 'Disengagement' | 'Next Contact'
export type DirectSort = { column: SortColumn; direction: 'ascending' | 'descending' } | null
export type SortRule = { id: number; field: string; direction: string }
export type GroupField = 'Status' | 'Priority' | 'Assigned Provider' | 'Program' | 'PHQ-9' | 'Risk Screen' | 'Disengagement' | 'Next Contact'
export type GroupOrder = 'A to Z' | 'Z to A' | 'High to Low' | 'Low to High' | 'Newest to Oldest' | 'Oldest to Newest'
export type GroupRule = { id: number; field: GroupField; order: GroupOrder }
export type GroupSnapshot = GroupRule[]
export type GroupDraftRule = { id: number; field: GroupField | ''; order: GroupOrder | '' }
export type CriteriaEditorMode = 'advanced' | 'simple' | 'sort' | 'group'
export const initialGroupSnapshot: GroupSnapshot = [{ id: 1, field: 'Status', order: 'A to Z' }]
// Match the existing saved-view preview; this stack is separate from direct header sorting.
export const initialSortSnapshot: SortRule[] = [
  { id: 1, field: 'Priority', direction: 'High to Low' },
  { id: 2, field: 'Next Contact', direction: 'Oldest to Newest' },
]
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
  groupSnapshot: GroupSnapshot
  sortSnapshot: SortRule[]
  toolbarControls: 'expanded' | 'collapsed'
  heldArrivalsVisible: boolean
  caseloadVisible: boolean
  letThemInVisible: boolean
  showMoreRows: boolean
  density: 'baseline' | 'patient' | 'standard' | 'clinical'
  viewModified: boolean
  criteriaActive: boolean
  fullScreen: boolean
  activeEditor: 'none' | CriteriaEditorMode
  activeCriterion: 'none' | CriteriaEditorMode
  advancedSnapshot: AdvancedSnapshot
  simpleFilters: DraftRule[]
  activeSimpleId: number | null
  directSort: DirectSort
}

export const defaultDataGridState: DataGridPrototypeState = {
  criteriaState: 'summary',
  criteriaPreset: 'sampleCommitted',
  groupSnapshot: initialGroupSnapshot,
  sortSnapshot: initialSortSnapshot,
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
