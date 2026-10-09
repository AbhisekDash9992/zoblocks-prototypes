import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { ArrowUpDown, Check, ChevronDown, ChevronRight, Columns3, Filter, Layers, Trash2 } from 'lucide-react'
import type { DataGridPrototypeState } from '../model/dataGridPrototypeState'
import { prototypeGridColumns } from '../model/dataGridPrototypeState'
import { advancedLeaves } from '../model/advancedFilter'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeInput } from '../ui/PrototypeInput'
import { PrototypeMenu } from '../ui/PrototypeMenu'

type VisibleDensity = Exclude<DataGridPrototypeState['density'], 'baseline'>
const densities: { value: VisibleDensity; label: string }[] = [
  { value: 'patient', label: 'Patient' }, { value: 'standard', label: 'Standard' }, { value: 'clinical', label: 'Clinical' },
]

export function ViewSettingsPopover({ id, state, viewName, trigger, position, onClose, onFilter, onGroup, onSort, onDensityChange }: {
  id: string; state: DataGridPrototypeState; viewName: string; trigger: RefObject<HTMLButtonElement | null>
  position: { left: number; top: number; width: number }; onClose: (restoreFocus: boolean) => void
  onFilter: (trigger: HTMLButtonElement) => void; onGroup: (trigger: HTMLButtonElement) => void; onSort: (trigger: HTMLButtonElement) => void
  onDensityChange: (density: VisibleDensity) => void
}) {
  const [densityOpen, setDensityOpen] = useState(false)
  const densityTrigger = useRef<HTMLButtonElement>(null)
  const densityPicker = useRef<HTMLDivElement>(null)
  const currentDensity = densities.find(item => item.value === state.density)?.label ?? 'Figma baseline (review)'
  const filterCount = advancedLeaves(state.advancedSnapshot).length + state.simpleFilters.length
  const groupValue = state.groupSnapshot.length === 1 ? state.groupSnapshot[0].field : state.groupSnapshot.length ? `${state.groupSnapshot.length} fields` : ''
  useLayoutEffect(() => {
    if (!densityOpen) return
    const picker = densityPicker.current
    if (!picker) return
    const place = () => {
      const anchor = densityTrigger.current?.getBoundingClientRect()
      if (!anchor) return
      const { height, width } = picker.getBoundingClientRect()
      const below = anchor.bottom + 4
      const top = below + height <= window.innerHeight - 8 ? below : anchor.top - height - 4
      picker.style.left = Math.max(8, Math.min(anchor.right - width, window.innerWidth - width - 8)) + 'px'
      picker.style.top = Math.max(8, Math.min(top, window.innerHeight - height - 8)) + 'px'
    }
    place()
    const selected = picker.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? picker.querySelector<HTMLButtonElement>('button')
    selected?.focus({ preventScroll: true })
    // Parent placement runs first; measure this child after scroll/resize settles.
    let frame = 0
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(place) }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [densityOpen])
  const closeDensity = () => { setDensityOpen(false); densityTrigger.current?.focus({ preventScroll: true }) }
  const route = (action: (source: HTMLButtonElement) => void) => {
    const source = trigger.current
    onClose(false)
    if (source) action(source)
  }
  return <PrototypeMenu id={id} label="View settings" role="dialog" className="dg-view-settings" trigger={trigger} position={position} onClose={onClose} restoreFocusOnOutside focusPolicy="surface" dismissalPolicy="explicit">
    <div className="dg-view-settings-content" onKeyDownCapture={event => {
      if (densityOpen && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDensity() }
    }}>
      <div className="dg-view-settings-group dg-view-identity" role="group" aria-label="View identity">
        <PrototypeInput aria-label="View name" aria-describedby={`${id}-view-note`} value={viewName} readOnly />
        <span id={`${id}-view-note`} className="dg-sort-assistive">Review-only current view. Saved View selection and renaming are deferred.</span>
        <PrototypeButton ref={densityTrigger} variant="ghost" className="dg-settings-row dg-density-row" aria-label="Density" aria-describedby={`${id}-density-value`} aria-haspopup="listbox" aria-expanded={densityOpen} aria-controls={densityOpen ? `${id}-density` : undefined} onClick={() => setDensityOpen(open => !open)} onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); setDensityOpen(true) }
        }}><span>Density</span><span className="dg-settings-trailing"><span id={`${id}-density-value`} className="dg-settings-value">{currentDensity}</span>{densityOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}</span></PrototypeButton>
        {densityOpen && <div ref={densityPicker} id={`${id}-density`} role="listbox" aria-label="Density options" className="dg-density-picker" onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== densityTrigger.current) setDensityOpen(false)
        }} onKeyDown={event => {
          event.stopPropagation()
          const options = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]')]
          const index = options.indexOf(document.activeElement as HTMLButtonElement)
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); options[(index + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length]?.focus() }
          if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); options[event.key === 'Home' ? 0 : options.length - 1]?.focus() }
        }}>
          {densities.map((item, index) => <PrototypeButton key={item.value} variant="ghost" role="option" aria-selected={state.density === item.value} tabIndex={state.density === item.value || (state.density === 'baseline' && index === 0) ? 0 : -1} onClick={() => { onDensityChange(item.value); closeDensity() }}><span>{item.label}</span>{state.density === item.value && <Check size={16} aria-hidden="true" />}</PrototypeButton>)}
        </div>}
      </div>
      <hr className="dg-picker-divider" />
      <div className="dg-view-settings-group dg-data-configuration" role="group" aria-label="Data configuration">
        <PrototypeButton variant="ghost" className="dg-settings-row" aria-label="Manage columns" disabled title="Manage Columns is deferred to 05I"><span className="dg-settings-leading"><Columns3 size={16} aria-hidden="true" /><span>Manage columns</span></span><span className="dg-settings-trailing"><span className="dg-settings-value">{prototypeGridColumns.length} shown</span><ChevronRight size={16} aria-hidden="true" /></span></PrototypeButton>
        <PrototypeButton variant="ghost" className="dg-settings-row" aria-label="Filter" aria-describedby={filterCount ? `${id}-filter-count` : undefined} onClick={() => route(onFilter)}><span className="dg-settings-leading"><Filter size={16} aria-hidden="true" /><span>Filter</span></span><span className="dg-settings-trailing">{filterCount > 0 && <span id={`${id}-filter-count`} className="dg-settings-value">{filterCount} active</span>}<ChevronRight size={16} aria-hidden="true" /></span></PrototypeButton>
        <PrototypeButton variant="ghost" className="dg-settings-row" aria-label="Group" aria-describedby={groupValue ? `${id}-group-value` : undefined} onClick={() => route(onGroup)}><span className="dg-settings-leading"><Layers size={16} aria-hidden="true" /><span>Group</span></span><span className="dg-settings-trailing">{groupValue && <span id={`${id}-group-value`} className="dg-settings-value">{groupValue}</span>}<ChevronRight size={16} aria-hidden="true" /></span></PrototypeButton>
        <PrototypeButton variant="ghost" className="dg-settings-row" aria-label="Sort" aria-describedby={state.sortSnapshot.length ? `${id}-sort-count` : undefined} onClick={() => route(onSort)}><span className="dg-settings-leading"><ArrowUpDown size={16} aria-hidden="true" /><span>Sort</span></span><span className="dg-settings-trailing">{state.sortSnapshot.length > 0 && <span id={`${id}-sort-count`} className="dg-settings-value">{state.sortSnapshot.length} active</span>}<ChevronRight size={16} aria-hidden="true" /></span></PrototypeButton>
      </div>
      <hr className="dg-picker-divider" />
      <div className="dg-view-settings-group dg-view-actions" role="group" aria-label="View actions"><PrototypeButton variant="ghost" className="dg-settings-row dg-settings-delete" aria-label="Delete view" disabled title="Saved View deletion is deferred to 05J"><span className="dg-settings-leading"><Trash2 size={16} aria-hidden="true" /><span>Delete view</span></span></PrototypeButton></div>
    </div>
  </PrototypeMenu>
}
