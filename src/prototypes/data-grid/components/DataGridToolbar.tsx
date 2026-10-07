import { ArrowUpDown, ChevronDown, ChevronsLeft, ChevronsRight, Ellipsis, Filter, MoveDiagonal, Minimize2, PanelTopClose, PanelTopOpen, Search, SlidersHorizontal } from 'lucide-react'
import type { DataGridPrototypeState } from '../model/dataGridPrototypeState'
import { PrototypeTooltip } from '../ui/PrototypeTooltip'
import { PrototypeButton } from '../ui/PrototypeButton'
import { PrototypeIconButton } from '../ui/PrototypeIconButton'
import { ViewPreviewPopover } from '../ui/ViewPreviewPopover'

type Props = { state: DataGridPrototypeState; onToggleToolbar: () => void; onFilter: (trigger: HTMLButtonElement) => void; onToggleCriteria: (trigger: HTMLButtonElement) => void; onToggleFullScreen: () => void }
export function DataGridToolbar({ state, onToggleToolbar, onFilter, onToggleCriteria, onToggleFullScreen }: Props) {
  const expanded = state.toolbarControls === 'expanded'
  const criteriaVisible = state.criteriaState !== 'hidden'
  const filterApplied = (state.advancedSnapshot.rows.length > 0 || state.simpleFilters.length > 0)
  const sortApplied = state.directSort !== null || state.summarySortCommitted
  return <div className="dg-toolbar" role="toolbar" aria-label="Data grid toolbar">
    <div className="dg-views" aria-label="Saved view previews">
      {[0, 1, 2].map(index => <ViewPreviewPopover key={index} index={index}><PrototypeButton variant="ghost" className={index === 0 ? 'dg-view-selected' : ''} aria-current={index === 0 ? 'true' : undefined}>View {index + 1}</PrototypeButton></ViewPreviewPopover>)}
      <PrototypeTooltip content="More views"><PrototypeButton variant="ghost" aria-label="More views"><Ellipsis size={14} aria-hidden="true" />More</PrototypeButton></PrototypeTooltip>
    </div>
    <div className="dg-toolbar-right">
      <span className="dg-collapse-affordance"><PrototypeIconButton icon={expanded ? ChevronsRight : ChevronsLeft} label={expanded ? 'Collapse controls' : 'Expand controls'} onClick={onToggleToolbar} /></span>
      <PrototypeButton className={`dg-save${state.viewModified ? ' dg-modified' : ''}`}>Save View<ChevronDown size={14} aria-hidden="true" /></PrototypeButton>
      <span className="dg-toolbar-divider" aria-hidden="true" />
      {expanded && <><PrototypeIconButton icon={Filter} label="Filter" applied={filterApplied} onClick={event => onFilter(event.currentTarget)} /><PrototypeIconButton icon={ArrowUpDown} label="Sort" applied={sortApplied} /></>}
      <PrototypeIconButton icon={Search} label="Search" />
      {expanded && <><span className="dg-toolbar-divider" aria-hidden="true" /><PrototypeIconButton icon={state.fullScreen ? Minimize2 : MoveDiagonal} label={state.fullScreen ? 'Exit full screen' : 'Full screen'} onClick={onToggleFullScreen} /></>}
      <PrototypeIconButton icon={SlidersHorizontal} label="View settings" />
      <span className="dg-criteria-disclosure"><PrototypeIconButton icon={criteriaVisible ? PanelTopClose : PanelTopOpen} label={criteriaVisible ? 'Hide criteria' : 'Show criteria'} aria-expanded={criteriaVisible} aria-controls="dg-criteria-area" onClick={event => onToggleCriteria(event.currentTarget)} /></span>
    </div>
  </div>
}
