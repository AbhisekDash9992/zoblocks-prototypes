import type { AdvancedSnapshot, DraftRule } from './dataGridPrototypeState'
import { starterRule } from './filterFields'

export function advancedLeaves(snapshot: AdvancedSnapshot): DraftRule[] {
  return snapshot.rows.flatMap(row => [row, ...(row.nested?.rows ?? [])])
}

export function meaningfulRule(row: DraftRule) {
  return Boolean(row.field || row.operator || row.value || row.range)
}

export function advancedStarter(id: number): AdvancedSnapshot {
  return { relationship: 'And', rows: [starterRule(id)] }
}

export function isAdvancedStarter(snapshot: AdvancedSnapshot) {
  return snapshot.rows.length === 1 && !meaningfulRule(snapshot.rows[0]) && !snapshot.rows[0].nested?.rows.length
}

const ruleMeaning = (row: DraftRule) => `${row.field} ${row.operator} ${row.value === 'Date range' ? row.range ?? row.value : row.value}`

export function advancedMeaning(snapshot: AdvancedSnapshot) {
  // A parent condition must match along with its nested set. Each nested set
  // has its own relationship; parentheses preserve that scope in the summary.
  const expression = snapshot.rows.map(row => {
    const nested = row.nested
    const meaning = ruleMeaning(row)
    return nested?.rows.length
      ? `(${meaning} AND\n(${nested.rows.map(ruleMeaning).join(` ${nested.relationship.toUpperCase()} `)}))`
      : meaning
  }).join(` ${snapshot.relationship.toUpperCase()}\n`)
  // A local display budget bounds long committed expressions, not their data.
  return expression.length > 900 ? `${expression.slice(0, 897)}…` : expression
}
