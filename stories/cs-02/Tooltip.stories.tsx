import { useId, useRef, useState } from 'react'
import { Filter } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrototypeTooltip } from '../../src/prototypes/data-grid/ui/PrototypeTooltip'
import { PrototypeIconButton } from '../../src/prototypes/data-grid/ui/PrototypeIconButton'
import { PrototypeButton } from '../../src/prototypes/data-grid/ui/PrototypeButton'
import { Anatomy } from './ReferenceGuide'

function Playground({ label }: { label: string }) {
  const [activations, setActivations] = useState(0)
  const name = label.trim() || 'Filter'
  return <div className="cs02-panel">
    <span className="dg-page cs01-reference cs02-icon-context">
      <PrototypeTooltip content={name} portalClassName="cs02-tooltip-reference">
        <PrototypeIconButton referenceType="ghost" referenceGlyphSize={14} icon={Filter} label={name} tooltip={false} onClick={() => setActivations(value => value + 1)} />
      </PrototypeTooltip>
    </span>
    {!label.trim() && <p role="alert">Supply a meaningful label. This preview uses Filter while the field is empty.</p>}
    <p role="status">Activations: {activations}</p>
    <p className="cs02-muted">Label-only baseline. Hover or Tab to focus. Enter / Space activate; Escape while focused dismisses. Shift+Tab, pointer leave, pointer down, click and scroll dismiss.</p>
  </div>
}

function ShortcutProposal() {
  const [count, setCount] = useState(0)
  const safetyId = useId(), instructionId = useId()
  return <section className="cs02-panel" aria-label="Contextual shortcut demo" onKeyDown={event => {
    const target = event.target as HTMLElement
    if (count === 0 || event.defaultPrevented || event.repeat || event.nativeEvent.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return
    if (event.key.toLowerCase() === 'r') { event.preventDefault(); setCount(0) }
  }}>
    <p>Optional proposal: R resets this demo count only while focus is inside this section, outside editable fields, and the count is nonzero.</p>
    <div className="cs02-row">
      <PrototypeButton variant="secondary" size={32} onClick={() => setCount(value => value + 1)}>Increment demo count</PrototypeButton>
      <PrototypeTooltip content="Reset demo count" shortcut={count > 0 ? 'R' : undefined} portalClassName="cs02-tooltip-reference">
        <PrototypeButton variant="secondary" size={32} disabled={count === 0} aria-keyshortcuts={count > 0 ? 'R' : undefined} onClick={() => setCount(0)}>Reset demo count</PrototypeButton>
      </PrototypeTooltip>
    </div>
    <p role="status">Demo count: {count}</p>
    <p className="cs02-muted">The label is meaningful alone. This functioning shortcut and its visual hint are not Figma-verified.</p>
    <div className="cs02-safety-test">
      <label htmlFor={safetyId}>Keyboard shortcut safety test</label>
      <p id={instructionId}>Type R here. The letter should be entered normally without resetting the demo count.</p>
      <input id={safetyId} aria-describedby={instructionId} />
    </div>
  </section>
}

function PopupDemo() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  return <div className="cs02-panel">
    <p>Behavior harness: opening a demo disclosure suppresses the trigger tooltip.</p>
    <PrototypeTooltip content="Demo options" popupOpen={open} portalClassName="cs02-tooltip-reference">
      <PrototypeButton ref={trigger} variant="secondary" size={32} aria-expanded={open} onClick={() => setOpen(value => !value)}>Demo options</PrototypeButton>
    </PrototypeTooltip>
    {open && <div role="region" aria-label="Demo options"><p>Synthetic options surface</p><PrototypeButton variant="secondary" size={32} onClick={() => { setOpen(false); trigger.current?.focus() }}>Close demo options</PrototypeButton></div>}
  </div>
}

const meta = {
  title: 'CS-02/Tooltip',
  component: Playground,
  args: { label: 'Filter' },
  argTypes: { label: { control: 'text', description: 'Meaningful label and independent accessible button name.' } },
} satisfies Meta<typeof Playground>
export default meta
type Story = StoryObj<typeof meta>
export const LabelOnly: Story = { name: 'Label-only (default)' }
export const ShortcutHintProposal: Story = { parameters: { controls: { disable: true } }, render: () => <ShortcutProposal /> }
export const LongLabel: Story = { args: { label: 'Show the selected columns in this demo grid' } }
export const PopupSuppression: Story = { parameters: { controls: { disable: true } }, render: () => <PopupDemo /> }
export const AnatomyReference: Story = { parameters: { controls: { disable: true } }, render: () => <Anatomy /> }
