import { useState } from 'react'
import { ArrowUpDown, Filter } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrototypeIconButton } from '../../src/prototypes/data-grid/ui/PrototypeIconButton'
import { SortEditorShell } from '../../src/prototypes/data-grid/components/SortEditorShell'
import type { SortRule } from '../../src/prototypes/data-grid/model/dataGridPrototypeState'

// Small illustrative Filter simulation, not a second Data Grid state model.
function FilterExample() {
  const [committed, setCommitted] = useState(false)
  const [draft, setDraft] = useState(false)
  const [open, setOpen] = useState(false)
  return <div className="cs01-panel">
    <h3>Filter · illustrative simulation</h3>
    <div className="cs01-row">
      <PrototypeIconButton referenceType={committed ? 'ghost-primary' : 'ghost'} referenceGlyphSize={14} icon={Filter} label="Filter" tooltipPopupOpen={open} aria-expanded={open} aria-controls={open ? 'cs01-filter-draft' : undefined} onClick={() => { setDraft(committed); setOpen(true) }} />
      <div role="status" className="cs01-context-status"><span>Committed criterion: {committed ? 'Status is Active' : 'None'}</span><span>Effective Icon Button Type: {committed ? 'Ghost-primary' : 'Ghost'}</span></div>
    </div>
    {open && <div id="cs01-filter-draft" className="cs01-stack">
      <label className="cs01-control"><input type="checkbox" checked={draft} onChange={event => setDraft(event.target.checked)} />Demo criterion: Status is Active</label>
      <p className="cs01-status" role="status">Draft criterion: {draft ? 'Selected' : 'Not selected'}{draft === committed ? ' · No changes to apply' : ' · Not committed yet'}</p>
      <div className="cs01-row"><button className="cs01-action" type="button" disabled={draft === committed} onClick={() => { setCommitted(draft); setOpen(false) }}>Apply Filter</button><button className="cs01-action" type="button" onClick={() => setOpen(false)}>Cancel Filter</button></div>
    </div>}
    <p className="cs01-muted">Opening and changing the draft do not change the Type. Apply is unavailable until the draft differs from the committed criterion. Cancel preserves the committed state. This is an illustrative simulation.</p>
  </div>
}

const sampleSort: SortRule[] = [{ id: 1, field: 'Client', direction: 'A to Z' }, { id: 2, field: 'Next Contact', direction: 'Oldest to Newest' }]

function SortExample() {
  const [snapshot, setSnapshot] = useState<SortRule[]>(structuredClone(sampleSort))
  const [directSort, setDirectSort] = useState(false)
  const [open, setOpen] = useState(false)
  const applied = snapshot.length > 0 || directSort
  return <div className="cs01-panel">
    <h3>Sort · existing editor in a minimal harness</h3>
    <div className="cs01-row">
      <PrototypeIconButton referenceType={applied ? 'ghost-primary' : 'ghost'} icon={ArrowUpDown} label="Sort" tooltipPopupOpen={open} aria-expanded={open} aria-controls={open ? 'cs01-sort-editor' : undefined} onClick={() => setOpen(true)} />
      <div role="status" className="cs01-context-status"><span>Committed editor rules: {snapshot.length}</span><span>Direct header sort: {directSort ? 'On' : 'Off'}</span><span>Effective Icon Button Type: {applied ? 'Ghost-primary' : 'Ghost'}</span></div>
    </div>
    <label className="cs01-control"><input type="checkbox" checked={directSort} onChange={event => setDirectSort(event.target.checked)} />Illustrate direct header sort (separate from editor)</label>
    <div className="cs01-row cs01-context-presets"><button className="cs01-action" type="button" disabled={open} onClick={() => setSnapshot([])}>Use zero editor rules</button><button className="cs01-action" type="button" disabled={open} onClick={() => setSnapshot(structuredClone(sampleSort))}>Restore two editor rules</button></div>
    <p className="cs01-muted">These review presets change only the example’s committed editor rules; direct header sort remains independent. Presets are unavailable while editing a draft.</p>
    {open && <div id="cs01-sort-editor" className="dg-criteria-surface cs01-sort-workspace"><SortEditorShell snapshot={snapshot} guardOpen={false} onKeep={() => {}} onDiscard={() => {}} onDirty={() => {}} onCancel={() => setOpen(false)} onApply={rows => { setSnapshot(rows); setOpen(false) }} onClear={() => { setSnapshot([]); setOpen(false) }} /></div>}
    <p className="cs01-muted">Remove Sort changes only the existing editor draft. Cancel discards it; valid Apply commits it. Removing the final committed rule exposes Clear sort. Direct header sorting independently keeps the toolbar applied.</p>
    <p className="cs01-muted">The embedded editor keeps its unchanged 4px legacy buttons. It is not migrated to the 6px CS-01 reference.</p>
    <p className="cs01-muted">Tooltip visuals are pending their own component specification. Existing hover, focus and dismissal behavior is retained.</p>
  </div>
}

const meta = {
  title: 'CS-01/Data Grid Context',
  parameters: { controls: { disable: true } },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>
export const FilterContext: Story = { render: () => <FilterExample /> }
export const SortAndDelete: Story = { render: () => <SortExample /> }
