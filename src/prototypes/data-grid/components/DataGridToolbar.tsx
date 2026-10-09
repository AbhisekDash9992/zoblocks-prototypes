import { gridShortcuts } from '../model/shortcuts'
import { useCallback, useId, useRef, useState } from 'react'
import { ArrowUpDown, ChevronDown, ChevronsLeft, ChevronsRight, Ellipsis, Filter, MoveDiagonal, Minimize2, PanelTopClose, PanelTopOpen, Search, SlidersHorizontal } from 'lucide-react'
import type { DataGridPrototypeState } from '../model/dataGridPrototypeState'
import { PrototypeTooltip } from '../ui/PrototypeTooltip'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { ViewPreviewPopover } from '../ui/ViewPreviewPopover'
import { ViewSettingsPopover } from './ViewSettingsPopover'

type Props = { state: DataGridPrototypeState; onToggleToolbar: () => void; onFilter: (trigger: HTMLButtonElement) => void; onSort: (trigger: HTMLButtonElement) => void; onGroup: (trigger: HTMLButtonElement) => void; onDensityChange: (density: Exclude<DataGridPrototypeState['density'], 'baseline'>) => void; onToggleCriteria: (trigger: HTMLButtonElement) => void; onToggleFullScreen: () => void }
// Existing fixed preview selection; this is not a Saved Views state model.
const currentViewIndex = 0
export function DataGridToolbar({ state, onToggleToolbar, onFilter, onSort, onGroup, onDensityChange, onToggleCriteria, onToggleFullScreen }: Props) {
  const settingsId = useId()
  const settingsTrigger = useRef<HTMLButtonElement | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [collapseKeyboardFocus, setCollapseKeyboardFocus] = useState(false)
  const pointerFocusing = useRef(false)
  const [settingsPosition, setSettingsPosition] = useState({ left: 0, top: 0, width: 320 })
  const closeSettings = useCallback((restoreFocus: boolean) => {
    setSettingsOpen(false)
    // Outside pointer dismissal must restore after the browser's default focus.
    if (restoreFocus) requestAnimationFrame(() => settingsTrigger.current?.focus({ preventScroll: true }))
  }, [])
  const expanded = state.toolbarControls === 'expanded'
  const criteriaVisible = state.criteriaState !== 'hidden'
  const filterApplied = (state.advancedSnapshot.rows.length > 0 || state.simpleFilters.length > 0)
  const sortApplied = state.directSort !== null || state.sortSnapshot.length > 0
  return <div className="dg-toolbar" data-criteria-hidden={!criteriaVisible || undefined} role="toolbar" aria-label="Data grid toolbar">
    <div className="dg-views" aria-label="Saved view previews">
      {[0, 1, 2].map(index => <ViewPreviewPopover key={index} index={index}><PrototypeButton variant="ghost" className={index === currentViewIndex ? 'dg-view-selected' : ''} aria-current={index === currentViewIndex ? 'true' : undefined}>View {index + 1}</PrototypeButton></ViewPreviewPopover>)}
      <PrototypeTooltip content="More views"><PrototypeButton variant="ghost" aria-label="More views"><Ellipsis size={14} aria-hidden="true" />More</PrototypeButton></PrototypeTooltip>
    </div>
    <div className="dg-toolbar-right">
      <span className="dg-collapse-affordance" data-keyboard-focus={collapseKeyboardFocus || undefined}><PrototypeIconButton icon={expanded ? ChevronsRight : ChevronsLeft} label={expanded ? 'Collapse controls' : 'Expand controls'} onPointerDown={event => {
        if (event.button !== 0 || !event.isPrimary) return
        // Keep focus without inheriting keyboard presentation from a previous Tab visit.
        event.preventDefault()
        setCollapseKeyboardFocus(false)
        pointerFocusing.current = true
        event.currentTarget.focus({ preventScroll: true })
        pointerFocusing.current = false
      }} onFocus={event => { if (!pointerFocusing.current && event.currentTarget.matches(':focus-visible')) setCollapseKeyboardFocus(true) }} onBlur={() => setCollapseKeyboardFocus(false)} onKeyDown={event => { if (event.key !== 'Tab') setCollapseKeyboardFocus(true) }} onClick={onToggleToolbar} /></span>
      <PrototypeButton className={`dg-save${state.viewModified ? ' dg-modified' : ''}`}>Save View<ChevronDown size={14} aria-hidden="true" /></PrototypeButton>
      <span className="dg-toolbar-divider" aria-hidden="true" />
      {expanded && <><PrototypeIconButton icon={Filter} label="Filter" shortcut={gridShortcuts.filter.display} aria-keyshortcuts={gridShortcuts.filter.aria} applied={filterApplied} onClick={event => onFilter(event.currentTarget)} /><PrototypeIconButton icon={ArrowUpDown} label="Sort" applied={sortApplied} onClick={event => onSort(event.currentTarget)} /></>}
      <PrototypeIconButton icon={Search} label="Search" />
      {expanded && <><span className="dg-toolbar-divider" aria-hidden="true" /><PrototypeIconButton icon={state.fullScreen ? Minimize2 : MoveDiagonal} label={state.fullScreen ? 'Exit full screen' : 'Full screen'} onClick={onToggleFullScreen} /></>}
      <PrototypeIconButton icon={SlidersHorizontal} label="View settings" aria-haspopup="dialog" aria-expanded={settingsOpen} aria-controls={settingsOpen ? settingsId : undefined} onClick={event => { settingsTrigger.current = event.currentTarget; const rect = event.currentTarget.getBoundingClientRect(); setSettingsPosition({ left: rect.left, top: rect.bottom + 4, width: 320 }); setSettingsOpen(open => !open) }} />
      <span className="dg-criteria-disclosure"><PrototypeIconButton icon={criteriaVisible ? PanelTopClose : PanelTopOpen} label={criteriaVisible ? 'Hide criteria' : 'Show criteria'} aria-expanded={criteriaVisible} aria-controls="dg-criteria-area" onClick={event => onToggleCriteria(event.currentTarget)} /></span>
    </div>
    {settingsOpen && <ViewSettingsPopover id={settingsId} state={state} viewName={`View ${currentViewIndex + 1}`} trigger={settingsTrigger} position={settingsPosition} onClose={closeSettings} onFilter={onFilter} onGroup={onGroup} onSort={onSort} onDensityChange={onDensityChange} />}
  </div>
}
