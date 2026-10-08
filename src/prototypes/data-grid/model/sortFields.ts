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
export function duplicateSortFields(rows: SortRule[]) {
  const selected = new Set<string>(), duplicates = new Set<string>()
  for (const { field } of rows) {
    if (field && selected.has(field)) duplicates.add(field)
    selected.add(field)
  }
  return [...duplicates]
}
export const validSort = (rows: SortRule[]) => rows.length > 0 && rows.every(completeSort) && duplicateSortFields(rows).length === 0
export const availableSortFields = (rows: SortRule[], id: number) => sortFields.filter(field => rows.some(row => row.id === id && row.field === field) || !rows.some(row => row.id !== id && row.field === field))
// Move one row; every other row keeps its relative order and its field/direction pair.
export function moveSortRule(rows: SortRule[], id: number, position: number) {
  const source = rows.findIndex(row => row.id === id)
  const destination = Math.max(0, Math.min(rows.length - 1, position))
  if (source < 0 || source === destination) return rows
  const next = [...rows]
  const [row] = next.splice(source, 1)
  next.splice(destination, 0, row)
  return next
}
// IDs identify controls; only the ordered field/direction values determine meaning.
export const sortMeaning = (rows: SortRule[]) => JSON.stringify(rows.map(({ field, direction }) => ({ field, direction })))
export const sortSummary = (rows: SortRule[]) => rows.length === 1 ? `Sort: ${rows[0].field}` : `Sort · ${rows.length} fields`
