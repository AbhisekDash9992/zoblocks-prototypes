import { useId, useState } from 'react'
import { ArrowUpDown, Filter, Trash2 } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrototypeIconButton } from '../../src/prototypes/data-grid/ui/PrototypeIconButton'
import { Anatomy } from './ReferenceGuide'

const icons = { Filter, Sort: ArrowUpDown, Delete: Trash2 }
type PlaygroundProps = {
  type: 'Ghost' | 'Ghost-primary'
  icon: keyof typeof icons
  disabled: boolean
  label: string
  tooltip: boolean
}

function Playground({ type, icon, disabled, label, tooltip }: PlaygroundProps) {
  const [activations, setActivations] = useState(0)
  const statusId = useId()
  return <div className="cs01-panel">
    <div className="cs01-row">
      <PrototypeIconButton referenceType={type === 'Ghost-primary' ? 'ghost-primary' : 'ghost'} referenceGlyphSize={icon === 'Filter' ? 14 : 16} icon={icons[icon]} label={label.trim() || 'Icon action'} disabled={disabled} tooltip={tooltip} onClick={() => setActivations(value => value + 1)} />
      <span>Small / Square · {type}{disabled ? ' · Disabled' : ''}</span>
    </div>
    {!label.trim() && <p role="alert">Supply an accessible label. This preview uses “Icon action” while the field is empty.</p>}
    {type === 'Ghost-primary' && disabled && <p className="cs01-muted">Verified icon/brand-disabled: #8EC5FF. Native disabled behavior prevents activation.</p>}
    <p id={statusId} className="cs01-status" role="status">Activations: {activations}</p>
    <p className="cs01-muted">Hover the button, or use Tab / Shift+Tab to focus it. Enter and Space activate it. Both solid focus rings are verified from Icon Button master 233:5486; Lucide artwork remains approximate.</p>
  </div>
}

const meta = {
  title: 'CS-01/Icon Button',
  component: Playground,
  args: { type: 'Ghost', icon: 'Filter', disabled: false, label: 'Filter', tooltip: true },
  argTypes: {
    type: { control: 'select', options: ['Ghost', 'Ghost-primary'], description: 'Visual Type, independent of interaction state.' },
    icon: { control: 'select', options: ['Filter', 'Sort', 'Delete'], description: 'Lucide prototype approximation.' },
    disabled: { control: 'boolean' },
    label: { control: 'text', description: 'Required accessible name, independent of tooltip visibility.' },
    tooltip: { control: 'boolean' },
  },
} satisfies Meta<typeof Playground>

export default meta
type Story = StoryObj<typeof meta>
export const PlaygroundExample: Story = { name: 'Playground' }
export const GhostPrimary: Story = { args: { type: 'Ghost-primary' } }
export const Disabled: Story = { args: { disabled: true } }
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => <div className="cs01-panel cs01-state-grid">
    {(['ghost', 'ghost-primary'] as const).map(type => <div className="cs01-state-cell" key={type}>
      <div className="cs01-row">
        <PrototypeIconButton referenceType={type} referenceGlyphSize={14} icon={Filter} label={`${type} Filter`} />
        <PrototypeIconButton referenceType={type} referenceGlyphSize={14} icon={Filter} label={`Disabled ${type} Filter`} disabled />
      </div>
      <p>{type === 'ghost' ? 'Ghost' : 'Ghost-primary'} · enabled and disabled</p>
      <p className="cs01-muted">Default at rest. Hover / Focused through real interaction.</p>
      {type === 'ghost-primary' && <p className="cs01-muted">Disabled icon: verified icon/brand-disabled #8EC5FF.</p>}
    </div>)}
  </div>,
}
export const FocusReference: Story = {
  name: 'Ghost keyboard focus and anatomy',
  parameters: { controls: { disable: true } },
  render: () => <div className="cs01-stack">
    <div className="cs01-panel"><div className="cs01-row"><PrototypeIconButton referenceType="ghost" referenceGlyphSize={14} icon={Filter} label="Ghost focus reference" tooltip={false} /><span>Ghost · use Tab to focus the actual button</span></div><p className="cs01-muted">Solid white 2px + neutral 4px shadows. Keyboard focus keeps bg/primary-hover without pointer hover.</p></div>
    <Anatomy />
  </div>,
}
