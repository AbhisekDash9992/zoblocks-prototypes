import { useEffect, useRef, useState } from 'react'
import { CriteriaArea } from './components/CriteriaArea'
import { DataGridToolbar } from './components/DataGridToolbar'
import { HeldArrivalsBar } from './components/HeldArrivalsBar'
import { PrototypeDataGrid } from './components/PrototypeDataGrid'
import { PrototypeStateControls } from './components/PrototypeStateControls'
import { defaultDataGridState, revealFilterEntry, withCriteriaState } from './model/dataGridPrototypeState'
import './styles/data-grid.css'
import { PrototypeButton } from './ui/PrototypeButton'

export function DataGridPrototypePage() {
  const [state, setState] = useState({ ...defaultDataGridState })
  const fullScreenExitRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!state.fullScreen) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    document.body.style.overflow = 'hidden'
    fullScreenExitRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [state.fullScreen])
  const openEditor = (mode: 'advanced' | 'simple') => setState(current => ({ ...current, criteriaState: 'editor', activeEditor: mode, activeCriterion: mode }))
  const onFilterEntry = () => setState(current => revealFilterEntry(current))

  return <div className="dg-page">
    <a className="dg-back" href="#/">← All prototypes</a>
    <div className="dg-page-heading"><p className="eyebrow">Data Grid · Batch 1 · In progress</p><h1>Toolbar &amp; Criteria Area</h1><p>05A v0.4 / 05B structural states · 920px working surface</p></div>
    <div className={`dg-working-region${state.fullScreen ? ' dg-full-screen' : ''}`} data-density={state.density}>
      {state.fullScreen && <div className="dg-full-screen-review"><span>Review only · Simulated full-screen candidate</span><PrototypeButton ref={fullScreenExitRef} onClick={() => setState(current => ({ ...current, fullScreen: false }))}>Exit full screen</PrototypeButton></div>}
      <div className="dg-scroll" role="region" aria-label="Data grid working surface, horizontally scrollable on narrow screens" tabIndex={0}>
        <div className="dg-surface">
          <DataGridToolbar state={state} onToggleToolbar={() => setState(current => ({ ...current, toolbarControls: current.toolbarControls === 'expanded' ? 'collapsed' : 'expanded' }))} onFilter={onFilterEntry} onToggleCriteria={() => setState(current => withCriteriaState(current, current.criteriaState === 'hidden' ? 'summary' : 'hidden'))} onToggleFullScreen={() => setState(current => ({ ...current, fullScreen: !current.fullScreen }))} />
          <CriteriaArea state={state} onOpenEditor={openEditor} onAddFilter={onFilterEntry} onCancel={() => setState(current => withCriteriaState(current, 'summary'))} onClear={() => setState(current => current.criteriaState === 'summary' ? { ...current, criteriaPreset: 'empty', criteriaActive: false, activeCriterion: 'none' } : current)} onApplyAdvanced={snapshot => setState(current => ({ ...withCriteriaState(current, 'summary'), advancedSnapshot: snapshot, criteriaPreset: 'sampleCommitted', viewModified: true, criteriaActive: true }))} onApplySimple={snapshot => setState(current => ({ ...withCriteriaState(current, 'summary'), simpleSnapshot: snapshot, viewModified: true, criteriaActive: true }))} onDeleteSimple={() => setState(current => ({ ...withCriteriaState(current, 'summary'), simpleSnapshot: null, viewModified: true }))} />
          {state.caseloadVisible && <div className="dg-caseload"><div><strong>CASELOAD · PHQ-9 RAISED OR RISK SCREENED</strong><p>{state.showMoreRows ? 11 : 6} of 312 clients on this team's caseload.</p><span>PHQ-9 of 10 or more, or a risk screen in the last 14 days.</span></div><span className="dg-window">14-DAY WINDOW</span></div>}
          <HeldArrivalsBar visible={state.heldArrivalsVisible} actionVisible={state.letThemInVisible} />
          <PrototypeDataGrid showMoreRows={state.showMoreRows} directSort={state.directSort} onSort={column => setState(current => ({ ...current, directSort: current.directSort?.column !== column ? { column, direction: 'ascending' } : current.directSort.direction === 'ascending' ? { column, direction: 'descending' } : null }))} />
        </div>
      </div>
    </div>
    <PrototypeStateControls state={state} onChange={setState} />
  </div>
}
