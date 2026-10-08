import { filterFields } from './filterFields'
import type { SortRule } from './dataGridPrototypeState'

export const sortFields = filterFields
// Text labels sort alphabetically; do not infer clinical severity ordering.
export const sortDirections: Record<string, string[]> = {
  Status: ['A to Z', 'Z to A'],
  Priority: ['High to Low', 'Low to High'],
  Client: ['A to Z', 'Z to A'],
  'Risk Screen': ['A to Z', 'Z to A'],
  'PHQ-9': ['High to Low', 'Low to High'],
  'Next Contact': ['Newest to Oldest', 'Oldest to Newest'],
}
export const sortStarter = (id: number): SortRule => ({ id, field: '', direction: '' })
export const completeSort = (row: SortRule) => Boolean(sortDirections[row.field]?.includes(row.direction))
// IDs identify controls; only the ordered field/direction values determine meaning.
export const sortMeaning = (rows: SortRule[]) => JSON.stringify(rows.map(({ field, direction }) => ({ field, direction })))
export const sortSummary = (rows: SortRule[]) => rows.length === 1 ? `Sort: ${rows[0].field}` : `Sort · ${rows.length} fields`
