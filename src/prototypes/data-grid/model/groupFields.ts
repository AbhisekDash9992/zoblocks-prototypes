import type { GroupDraftRule, GroupField, GroupOrder, GroupRule, GroupSnapshot } from './dataGridPrototypeState'

// 05G's representative Group catalog. Label fields stay alphabetical; numerical
// measures sort by value without assigning clinical severity or thresholds.
export const groupFields: GroupField[] = ['Status', 'Priority', 'Assigned Provider', 'Program', 'PHQ-9', 'Risk Screen', 'Disengagement', 'Next Contact']
export const groupOrders: Record<GroupField, GroupOrder[]> = {
  Status: ['A to Z', 'Z to A'],
  Priority: ['High to Low', 'Low to High'],
  'Assigned Provider': ['A to Z', 'Z to A'],
  Program: ['A to Z', 'Z to A'],
  'PHQ-9': ['High to Low', 'Low to High'],
  'Risk Screen': ['A to Z', 'Z to A'],
  Disengagement: ['High to Low', 'Low to High'],
  'Next Contact': ['Newest to Oldest', 'Oldest to Newest'],
}
export const isGroupField = (field: string): field is GroupField => groupFields.some(item => item === field)
export const isGroupOrder = (order: string): order is GroupOrder => Object.values(groupOrders).some(options => options.some(item => item === order))
export const groupStarter = (id: number): GroupDraftRule => ({ id, field: '', order: '' })
export const completeGroup = (row: GroupDraftRule): row is GroupRule => Boolean(row.field && row.order && groupOrders[row.field].some(order => order === row.order))
// No approved depth or uniqueness restriction: retain the full existing catalog.
export const validGroup = (rows: GroupDraftRule[]): rows is GroupSnapshot => rows.length > 0 && rows.every(completeGroup)
export const groupMeaning = (rows: GroupDraftRule[]) => JSON.stringify(rows.map(({ field, order }) => ({ field, order })))
export const groupSummary = (rows: GroupSnapshot) => rows.length === 1 ? `Group by: ${rows[0].field}` : `Group · ${rows.length} fields`
