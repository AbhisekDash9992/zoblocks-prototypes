import { syntheticGridData } from '../data/syntheticGridData'
import type { DraftRule } from './dataGridPrototypeState'

// Established representative Batch 1 patterns; not a clinical query schema.
export const filterFields = ['Status', 'Priority', 'Client', 'Risk Screen', 'PHQ-9', 'Next Contact']
export const filterOperators: Record<string, string[]> = {
  Status: ['is', 'is not'], Priority: ['is', 'is not', 'is any of'], Client: ['is', 'is not'],
  'Risk Screen': ['is', 'is not'], 'PHQ-9': ['equals', 'greater than', 'less than'], 'Next Contact': ['is', 'before', 'after'],
}
export const filterValues: Record<string, string[]> = {
  Status: ['Active', 'Inactive', 'Awaiting'], Priority: ['High', 'Medium', 'Low'],
  Client: syntheticGridData.map(record => record.name),
  'Risk Screen': ['Passive ideation', 'Ideation with plan', 'Ideation, no plan', 'None reported'],
  'Next Contact': ['Last 1 day', 'Last 7 days', 'Last 1 month', 'Date range'],
}
export function starterRule(id: number, field = ''): DraftRule {
  return { id, field, operator: field === 'Priority' ? 'is any of' : filterOperators[field]?.[0] ?? '', value: '' }
}
export function completeRule(row: DraftRule) {
  return Boolean(filterOperators[row.field]?.includes(row.operator) && row.value.trim()
    && (row.value !== 'Date range' || row.range?.trim())
    && (row.field !== 'PHQ-9' || Number.isFinite(Number(row.value))))
}
