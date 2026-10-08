import type { RefObject } from 'react'
import { CalendarRange, Trash2 } from 'lucide-react'
import { filterFields as fields, filterOperators as operators, filterValues as values, starterRule } from '../model/filterFields'
import type { DraftRule } from '../model/dataGridPrototypeState'
import { PrototypeSelect } from '../ui/PrototypeSelect'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { PrototypeInput } from '../ui/PrototypeInput'

// The same field contracts and controls serve Simple and both Advanced levels.
export function FilterRuleControls({ row, context, mode, simpleFilters, autoOpenId, valueOpenId, numericInput, onUpdate, onFieldChosen, onOperatorChosen, onDelete, canDelete }: {
  row: DraftRule; context: string; mode: 'advanced' | 'simple'; simpleFilters: DraftRule[]
  autoOpenId: number | null; valueOpenId: number | null; numericInput: RefObject<HTMLInputElement | null>
  onUpdate: (patch: Partial<DraftRule>) => void; onFieldChosen: () => void; onOperatorChosen: () => void
  onDelete: () => void; canDelete: boolean
}) {
  return <div className="dg-rule-controls">
    <PrototypeSelect className="dg-rule-field" autoOpen={row.id === autoOpenId} label={`Field for ${context}`} value={row.field} placeholder="Select field" options={mode === 'simple' ? fields.filter(field => !simpleFilters.some(filter => filter.field === field && filter.id !== row.id)) : fields} onChange={field => { onUpdate({ ...starterRule(row.id, field), operator: mode === 'advanced' ? operators[field][0] : starterRule(row.id, field).operator, range: undefined }); onFieldChosen() }} />
    {row.field && <>
      <PrototypeSelect className="dg-rule-operator" label={`Operator for ${context}`} value={row.operator} options={operators[row.field]} onChange={operator => { onUpdate({ operator, value: '', range: undefined }); onOperatorChosen() }} />
      {row.field === 'PHQ-9' ? <PrototypeInput ref={numericInput} className="dg-rule-value dg-numeric-input" type="number" aria-label={`Value for ${context}`} placeholder="Enter number" value={row.value} onChange={event => onUpdate({ value: event.target.value })} /> : <PrototypeSelect key={`${row.field}-${row.operator}`} autoOpen={row.id === valueOpenId} className="dg-rule-value" label={`Value for ${context}`} value={row.value} options={values[row.field]} multiple={row.field === 'Priority' && row.operator === 'is any of'} onChange={value => onUpdate({ value, range: value === 'Date range' ? '1 Oct 2026 – 7 Oct 2026' : undefined })} />}
      {row.field === 'Next Contact' && row.value === 'Date range' && <span className="dg-date-range-control"><CalendarRange size={16} aria-hidden="true" /><PrototypeInput className="dg-date-range" aria-label={`Date range for ${context}`} value={row.range ?? ''} onChange={event => onUpdate({ range: event.target.value })} /></span>}
    </>}
    {canDelete && <PrototypeIconButton className="dg-rule-delete" icon={Trash2} label={mode === 'advanced' ? 'Remove Condition' : `Remove ${context}`} onClick={onDelete} />}
  </div>
}
