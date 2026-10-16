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
  return <div className="cs01-panel zw-docs-playground">
    <section><h3>Specimen</h3><div className="cs01-row zw-docs-specimen">
      <PrototypeIconButton referenceType={type === 'Ghost-primary' ? 'ghost-primary' : 'ghost'} referenceGlyphSize={icon === 'Filter' ? 14 : 16} icon={icons[icon]} label={label.trim() || 'Icon action'} disabled={disabled} tooltip={tooltip} onClick={() => setActivations(value => value + 1)} />
    </div><p id={statusId} className="cs01-status" role="status">Activations: {activations}</p></section>
    <section className="zw-docs-configuration"><h3>Configuration</h3><dl className="zw-docs-config">
      {[['Size / Shape', 'Small / Square'], ['Type', type], ['Icon', icon], ['Disabled', disabled ? 'True' : 'False'], ['Tooltip', tooltip ? 'True' : 'False']].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}
    </dl></section>
    <div className="zw-docs-playground-notes">
    {!label.trim() && <p role="alert">Supply an accessible label. This preview uses “Icon action” while the field is empty.</p>}
    {type === 'Ghost-primary' && disabled && <p className="cs01-muted">Verified icon/brand-disabled: #8EC5FF. Native disabled behavior prevents activation.</p>}
    <p className="cs01-muted">Hover or use Tab / Shift+Tab to focus. Enter and Space activate. Lucide artwork is approximate.</p>
    </div>
  </div>
}

const meta = {
  title: 'CS-01/Icon Button',
  component: Playground,
  args: { type: 'Ghost', icon: 'Filter', disabled: false, label: 'Filter', tooltip: true },
  argTypes: {
    type: { control: 'select', options: ['Ghost', 'Ghost-primary'], description: 'Visual Type, independent of interaction state.', table: { defaultValue: { summary: 'Ghost' } } },
    icon: { control: 'select', options: ['Filter', 'Sort', 'Delete'], description: 'Lucide prototype approximation.', table: { defaultValue: { summary: 'Filter' } } },
    disabled: { control: 'boolean', description: 'Native disabled button; prevents activation and keyboard focus.', table: { defaultValue: { summary: 'false' } } },
    label: { control: 'text', description: 'Required accessible name, independent of tooltip visibility.', table: { defaultValue: { summary: 'Filter' } } },
    tooltip: { control: 'boolean', description: 'Supplemental hover/focus label; accessible name remains present.', table: { defaultValue: { summary: 'true' } } },
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
