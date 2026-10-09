import { additionalSyntheticGridData, syntheticGridData } from '../data/syntheticGridData'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { DirectSort, SortColumn } from '../model/dataGridPrototypeState'
import { prototypeGridColumns } from '../model/dataGridPrototypeState'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { PrototypeBadge } from '../ui/PrototypeBadge'

export function PrototypeDataGrid({ showMoreRows, directSort, onSort }: { showMoreRows: boolean; directSort: DirectSort; onSort: (column: SortColumn) => void }) {
  const source = showMoreRows ? [...syntheticGridData, ...additionalSyntheticGridData] : syntheticGridData
  // Demo ordering only. Risk labels compare alphabetically; contact ranks are explicit local examples.
  const contactOrder = ['Today 13:45', 'Today 14:00', 'Today 15:30', 'Today 16:20', 'Today 17:10', 'Thu 11:30', 'Thu 16:00', 'Fri 10:00', 'Fri 18:20', 'Mon 09:15', 'Mon 19:00']
  const key = (record: (typeof source)[number]): string | number | null => {
    switch (directSort?.column) {
      case 'Client': return record.name
      case 'PHQ-9': return typeof record.phq9 === 'string' ? null : record.phq9.score
      case 'Risk Screen': return record.risk === 'Restricted' ? null : record.risk
      case 'Disengagement': return Number(record.disengagement)
      case 'Next Contact': return contactOrder.indexOf(record.nextContact)
      default: return null
    }
  }
  const records = directSort ? [...source].sort((a, b) => {
    const x = key(a), y = key(b)
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1
    const comparison = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
    return directSort.direction === 'ascending' ? comparison : -comparison
  }) : source
  return (
    <div className="dg-table-viewport" role="region" aria-label="Synthetic table, scrollable rows" tabIndex={0}>
    <table className="dg-table" aria-label="Synthetic caseload">
      <colgroup>{[200, 160, 200, 200, 160].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
      <thead><tr>{prototypeGridColumns.map(title => {
        const direction = directSort?.column === title ? directSort.direction : 'none'
        return <th key={title} scope="col" aria-sort={direction} className={title === 'Disengagement' || title === 'Next Contact' ? 'dg-align-right' : 'dg-align-left'}><span className="dg-header-content"><span className="dg-header-label">{title}</span><span className={`dg-header-sort${direction !== 'none' ? ' dg-header-sorted' : ''}`}><PrototypeIconButton tooltip={false} icon={direction === 'ascending' ? ArrowUp : direction === 'descending' ? ArrowDown : ArrowUpDown} label={`Sort ${title}`} applied={direction !== 'none'} onClick={event => { event.stopPropagation(); onSort(title) }} /></span></span></th>
      })}</tr></thead>
      <tbody>{records.map(record => (
        <tr key={record.id}>
          <td><div className="dg-client"><span className={`dg-avatar dg-avatar-${(Number(record.id.slice(-3)) - 1) % 4}`} aria-hidden="true">{record.name.split(' ').map(part => part[0]).join('')}</span><span><span className="dg-client-name">{record.name}</span><span className="dg-client-id">{record.id}</span></span></div></td>
          <td>{typeof record.phq9 === 'string' ? <span className={`dg-value-state dg-value-${record.phq9.toLowerCase()}`}>{record.phq9}</span> : <div className="dg-phq"><strong>{record.phq9.score}</strong><span>{record.phq9.severity}</span><span className={`dg-trend dg-trend-${record.phq9.trendTone}`} aria-label={`${record.phq9.trendTone === 'improving' ? 'Decrease' : 'Increase'} ${record.phq9.trend.slice(1)}`}>{record.phq9.trend}</span></div>}</td>
          <td>{record.risk === 'Restricted' ? <span className="dg-value-state">Restricted</span> : <PrototypeBadge className="dg-risk-chip" tone={record.risk === 'None reported' ? 'neutral' : record.risk === 'Ideation with plan' ? 'danger' : 'primary'}>{record.risk}</PrototypeBadge>}</td>
          <td className="dg-align-right"><div className="dg-disengagement"><span className="dg-progress-track" aria-hidden="true"><span className={`dg-progress-fill dg-tone-${record.disengagementTone}`} style={{ width: `${Number(record.disengagement) * 100}%` }} /></span><span className="dg-number">{record.disengagement}</span></div></td>
          <td className="dg-align-right"><span className={`dg-contact${record.isToday ? ' dg-contact-today' : ''}`}>{record.nextContact}</span></td>
        </tr>
      ))}</tbody>
    </table>
    </div>
  )
}
