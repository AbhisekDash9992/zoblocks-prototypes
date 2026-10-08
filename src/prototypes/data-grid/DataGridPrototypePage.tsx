import { claimOverlay } from './ui/overlayState'
import { gridShortcuts } from './model/shortcuts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CriteriaEditorSession } from './components/CriteriaArea'
import { AddFilterPopover } from './components/AddFilterPopover'
import { advancedLeaves, advancedStarter } from './model/advancedFilter'
import { starterRule } from './model/filterFields'
import type { CriteriaEditorMode, DataGridPrototypeState, DraftRule } from './model/dataGridPrototypeState'
import { CriteriaArea } from './components/CriteriaArea'
import { DataGridToolbar } from './components/DataGridToolbar'
import { HeldArrivalsBar } from './components/HeldArrivalsBar'
import { PrototypeDataGrid } from './components/PrototypeDataGrid'
import { PrototypeStateControls } from './components/PrototypeStateControls'
import { defaultDataGridState, revealFilterEntry, withCriteriaState } from './model/dataGridPrototypeState'
import './styles/data-grid.css'
import { UndoSnackbar } from './components/UndoSnackbar'
import { PrototypeButton } from './ui/PrototypeButton'

export function DataGridPrototypePage() {
  const [state, setState] = useState({ ...defaultDataGridState })
  const [pickerAnchor, setPickerAnchor] = useState<HTMLButtonElement | null>(null)
  const summaryAddFilterRef = useRef<HTMLButtonElement>(null)
  const [pickerRequested, setPickerRequested] = useState(false)
  const undoId = useRef(0)
  const [session, setSession] = useState<CriteriaEditorSession | null>(null)
  const [pending, setPending] = useState<{ action: () => void } | null>(null)
  const [undo, setUndo] = useState<{ id: number; message: string; restore: (current: DataGridPrototypeState) => DataGridPrototypeState } | null>(null)
  const dirty = useRef(false)
  const sessionKey = useRef(0)
  const nextSimpleId = useRef(2)
  const editorTrigger = useRef<HTMLButtonElement | null>(null)
  const reportDirty = useCallback((value: boolean) => { dirty.current = value }, [])
  const closePicker = useCallback(() => setPickerAnchor(null), [])
  const repairCriteriaFocus = useCallback(() => requestAnimationFrame(() => {
    claimOverlay(null)
    const focused = document.activeElement
    if (focused instanceof HTMLElement && focused.isConnected && focused !== document.body && focused !== document.documentElement && !focused.matches(':disabled') && !focused.closest('[inert], .dg-snackbar')) return
    const context = document.querySelector<HTMLElement>('.dg-editor') ?? document.querySelector<HTMLElement>('.dg-summary') ?? document.querySelector<HTMLElement>('.dg-working-region')
    context?.focus({ preventScroll: true })
  }), [])
  const dismissUndo = useCallback(() => {
    const focused = document.activeElement?.closest('.dg-snackbar')
    setUndo(null)
    if (focused) repairCriteriaFocus()
  }, [repairCriteriaFocus])
  const keepEditing = useCallback(() => setPending(null), [])
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
  useEffect(() => {
    if (!pickerRequested || state.criteriaState !== 'summary') return
    const frame = requestAnimationFrame(() => {
      const trigger = summaryAddFilterRef.current
      if (!trigger) return
      trigger.focus({ preventScroll: true })
      setPickerAnchor(trigger)
      setPickerRequested(false)
    })
    return () => cancelAnimationFrame(frame)
  }, [pickerRequested, state.criteriaState])
  const navigate = (action: () => void, _trigger: HTMLElement) => {
    if (state.criteriaState === 'editor' && dirty.current) { setPickerAnchor(null); setPickerRequested(false); setPending({ action }) }
    else action()
  }
  const finishEditor = (restoreTrigger = true) => {
    dirty.current = false
    setSession(null)
    setPending(null)
    setState(current => withCriteriaState(current, 'summary'))
    requestAnimationFrame(() => {
      if (!restoreTrigger) { document.querySelector<HTMLElement>('.dg-summary')?.focus({ preventScroll: true }); return }
      const control = editorTrigger.current
      if (control?.isConnected) control.focus({ preventScroll: true })
      else document.querySelector<HTMLButtonElement>('.dg-add-filter')?.focus({ preventScroll: true })
    })
  }
  const openEditor = (mode: CriteriaEditorMode, trigger: HTMLButtonElement, id?: number) => navigate(() => {
    editorTrigger.current = trigger
    dirty.current = false
    const newSort = mode === 'sort' && state.sortSnapshot.length === 0
    setPickerAnchor(null); setPickerRequested(false)
    setSession({ key: ++sessionKey.current, isNew: newSort, advanced: structuredClone(state.advancedSnapshot), simple: state.simpleFilters.find(row => row.id === id) ?? null, sort: structuredClone(state.sortSnapshot) })
    setState(current => ({ ...current, criteriaState: 'editor', activeEditor: mode, activeCriterion: newSort ? 'none' : mode, activeSimpleId: id ?? null }))
    if (!newSort) requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.dg-rule-field')?.focus({ preventScroll: true }))
  }, trigger)
  const onFilterEntry = (trigger: HTMLButtonElement) => navigate(() => {
    dirty.current = false
    setSession(null)
    setState(current => revealFilterEntry(current))
    setPickerAnchor(null)
    setPickerRequested(true)
  }, trigger)
  const selectField = (field: string) => {
    const existing = state.simpleFilters.find(filter => filter.field === field)
    if (existing && pickerAnchor) {
      const trigger = pickerAnchor
      setPickerAnchor(null)
      openEditor('simple', trigger, existing.id)
      return
    }
    editorTrigger.current = pickerAnchor
    dirty.current = false
    setSession({ key: ++sessionKey.current, isNew: true, advanced: advancedStarter(1), simple: starterRule(nextSimpleId.current++, field) })
    setPickerAnchor(null)
    setState(current => ({ ...current, criteriaState: 'editor', activeEditor: 'simple', activeCriterion: 'none', activeSimpleId: null }))
  }
  const enterAdvanced = () => {
    editorTrigger.current = pickerAnchor
    const isNew = state.advancedSnapshot.rows.length === 0
    dirty.current = false
    setSession({ key: ++sessionKey.current, isNew, advanced: isNew ? advancedStarter(1) : structuredClone(state.advancedSnapshot), simple: null })
    setPickerAnchor(null)
    setState(current => ({ ...current, criteriaState: 'editor', activeEditor: 'advanced', activeCriterion: isNew ? 'none' : 'advanced', activeSimpleId: null }))
    if (!isNew) requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.dg-rule-field')?.focus({ preventScroll: true }))
  }
  const advanceSimple = (row: DraftRule) => {
    const existing = state.advancedSnapshot.rows.length > 0
    const advanced = structuredClone(state.advancedSnapshot)
    const id = Math.max(0, ...advancedLeaves(advanced).map(rule => rule.id)) + 1
    advanced.rows.push({ ...row, id })
    dirty.current = true
    setSession({ key: ++sessionKey.current, isNew: !existing, forceDirty: true, advanced, simple: null, transferSimpleId: state.simpleFilters.find(filter => filter.id === row.id)?.id })
    setState(current => ({ ...current, criteriaState: 'editor', activeEditor: 'advanced', activeCriterion: existing ? 'advanced' : 'none', activeSimpleId: null }))
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.dg-rule-field')?.focus({ preventScroll: true }))
  }
  const removeCriterion = (kind: 'group' | 'sort' | 'advanced') => {
    if (kind === 'advanced') {
      const removed = structuredClone(state.advancedSnapshot)
      if (!removed.rows.length) return
      if (state.activeEditor === 'advanced') finishEditor(false)
      setState(current => ({ ...current, advancedSnapshot: { relationship: 'And', rows: [] }, viewModified: true }))
      setUndo({ id: ++undoId.current, message: 'Advanced filter removed.', restore: current => ({ ...current, advancedSnapshot: removed, viewModified: true }) })
    } else if (kind === 'sort') {
      const removed = structuredClone(state.sortSnapshot)
      if (!removed.length) return
      if (state.activeEditor === 'sort') finishEditor(false)
      setState(current => ({ ...current, sortSnapshot: [], viewModified: true }))
      setUndo({ id: ++undoId.current, message: 'Sort removed.', restore: current => ({ ...current, sortSnapshot: removed, viewModified: true }) })
    } else {
      if (!state.groupCommitted) return
      setState(current => ({ ...current, groupCommitted: false, viewModified: true }))
      setUndo({ id: ++undoId.current, message: 'Group removed.', restore: current => ({ ...current, groupCommitted: true, viewModified: true }) })
    }
    repairCriteriaFocus()
  }
  const removeSimple = (id: number) => {
    const removed = state.simpleFilters.find(row => row.id === id)
    if (!removed) return
    if (state.activeSimpleId === id) finishEditor(false)
    else if (session?.transferSimpleId === id) setSession(current => current ? { ...current, transferSimpleId: undefined } : current)
    setState(current => ({ ...current, simpleFilters: current.simpleFilters.filter(row => row.id !== id), viewModified: true }))
    const index = state.simpleFilters.findIndex(row => row.id === id)
    setUndo({ id: ++undoId.current, message: removed.field + ' filter removed.', restore: current => {
      const rows = current.simpleFilters.filter(row => row.id !== id && row.field !== removed.field)
      rows.splice(Math.min(index, rows.length), 0, removed)
      return { ...current, simpleFilters: rows, viewModified: true }
    } })
    repairCriteriaFocus()
  }
  const clearSummary = () => {
    const previous = structuredClone({ criteriaPreset: state.criteriaPreset, criteriaActive: state.criteriaActive, groupCommitted: state.groupCommitted, sortSnapshot: state.sortSnapshot, advancedSnapshot: state.advancedSnapshot, simpleFilters: state.simpleFilters, directSort: state.directSort })
    finishEditor(false)
    setState(current => ({ ...withCriteriaState(current, 'summary'), criteriaPreset: 'empty', criteriaActive: false, groupCommitted: false, sortSnapshot: [], advancedSnapshot: { relationship: 'And', rows: [] }, simpleFilters: [], directSort: null, viewModified: true }))
    setUndo({ id: ++undoId.current, message: 'All criteria cleared.', restore: current => ({ ...current, ...previous, viewModified: true }) })
  }

  return <div className="dg-page">
    <a className="dg-back" href="#/">← All prototypes</a>
    <div className="dg-page-heading"><p className="eyebrow">Data Grid · Batch 3B.1</p><h1>Toolbar &amp; Criteria Area</h1><p>Advanced Filter / Sort · cumulative prototype</p></div>
    <div className={`dg-working-region${state.fullScreen ? ' dg-full-screen' : ''}`} data-density={state.density} tabIndex={-1} onKeyDown={event => {
      const target = event.target
      if (!gridShortcuts.filter.active || event.key.toLowerCase() !== 'f' || event.repeat || event.nativeEvent.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      if (!(target instanceof HTMLElement) || !event.currentTarget.contains(target) || target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], .dg-input')) return
      if (document.querySelector('.dg-picker, .dg-guard-dialog')) return
      const trigger = event.currentTarget.querySelector<HTMLButtonElement>('.dg-toolbar-right button[aria-label="Filter"]') ?? summaryAddFilterRef.current
      if (!trigger) return
      event.preventDefault()
      onFilterEntry(trigger)
    }}>
      {state.fullScreen && <div className="dg-full-screen-review"><span>Review only · Simulated full-screen candidate</span><PrototypeButton ref={fullScreenExitRef} onClick={() => setState(current => ({ ...current, fullScreen: false }))}>Exit full screen</PrototypeButton></div>}
      <div className="dg-scroll" role="region" aria-label="Data grid working surface, horizontally scrollable on narrow screens" tabIndex={0}>
        <div className="dg-surface">
          <DataGridToolbar state={state} onToggleToolbar={() => setState(current => ({ ...current, toolbarControls: current.toolbarControls === 'expanded' ? 'collapsed' : 'expanded' }))} onFilter={onFilterEntry} onSort={trigger => openEditor('sort', trigger)} onToggleCriteria={trigger => navigate(() => { dirty.current = false; setSession(null); setPickerAnchor(null); setPickerRequested(false); setState(current => withCriteriaState(current, current.criteriaState === 'hidden' ? 'summary' : 'hidden')) }, trigger)} onToggleFullScreen={() => setState(current => ({ ...current, fullScreen: !current.fullScreen }))} />
          <CriteriaArea guardOpen={pending !== null} onKeep={keepEditing} onDiscard={() => { if (pending) { dirty.current = false; setPending(null); pending.action() } }} onAdvanceSimple={advanceSimple} addFilterRef={summaryAddFilterRef} state={state} session={session} onOpenEditor={openEditor} onAddFilter={onFilterEntry} onCancel={() => finishEditor(false)} onClear={clearSummary} onDirty={reportDirty}
            onApplyAdvanced={snapshot => { const transferred = session?.transferSimpleId; finishEditor(); setState(current => ({ ...current, advancedSnapshot: snapshot, simpleFilters: current.simpleFilters.filter(row => row.id !== transferred), viewModified: true, criteriaActive: true })) }}
            onApplySimple={snapshot => { finishEditor(); setState(current => ({ ...current, simpleFilters: current.simpleFilters.some(row => row.id === snapshot.id) ? current.simpleFilters.map(row => row.id === snapshot.id ? snapshot : row) : [...current.simpleFilters, snapshot], viewModified: true, criteriaActive: true })) }}
            onApplySort={snapshot => { finishEditor(); setState(current => ({ ...current, sortSnapshot: snapshot, viewModified: true, criteriaActive: true })) }}
            onDeleteSimple={() => { const id = session?.simple?.id ?? state.activeSimpleId; if (id !== null && id !== undefined) removeSimple(id) }} onRemoveSimple={removeSimple} onRemoveCriterion={removeCriterion} />
          {state.caseloadVisible && <div className="dg-caseload"><div><strong>CASELOAD · PHQ-9 RAISED OR RISK SCREENED</strong><p>{state.showMoreRows ? 11 : 6} of 312 clients on this team's caseload.</p><span>PHQ-9 of 10 or more, or a risk screen in the last 14 days.</span></div><span className="dg-window">14-DAY WINDOW</span></div>}
          <HeldArrivalsBar visible={state.heldArrivalsVisible} actionVisible={state.letThemInVisible} />
          <PrototypeDataGrid showMoreRows={state.showMoreRows} directSort={state.directSort} onSort={column => setState(current => ({ ...current, directSort: current.directSort?.column !== column ? { column, direction: 'ascending' } : current.directSort.direction === 'ascending' ? { column, direction: 'descending' } : null }))} />
        </div>
      </div>
    </div>
    {pickerAnchor && <AddFilterPopover anchor={pickerAnchor} onClose={closePicker} onField={selectField} onAdvanced={enterAdvanced} />}
    {undo && <UndoSnackbar key={undo.id} message={undo.message} onClose={dismissUndo} onUndo={() => { setState(current => undo.restore(current)); setUndo(null); repairCriteriaFocus() }} />}
    <PrototypeStateControls state={state} onChange={(next, reset = false) => {
      const criteriaNavigation = reset || next.criteriaState !== state.criteriaState || next.criteriaPreset !== state.criteriaPreset
      if (!criteriaNavigation) { setState(next); return }
      const change = () => { dirty.current = false; setSession(null); setPickerAnchor(null); setPickerRequested(false); setPending(null); setUndo(null); nextSimpleId.current = Math.max(nextSimpleId.current, ...next.simpleFilters.map(row => row.id + 1)); setState(next) }
      const trigger = document.activeElement
      if (trigger instanceof HTMLElement) navigate(change, trigger)
      else change()
    }} />
  </div>
}
