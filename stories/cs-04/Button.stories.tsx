import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleDot } from 'lucide-react'
import { useState } from 'react'
import { Button, type ButtonProps } from '../../src/oxygen-button/Button'
import { Anatomy, Behavior, IconConfigurations, StateMatrix } from './ReferenceGuide'
import { referenceStateCss } from './stateReference'
import './button-reference.css'

type PlaygroundProps = Omit<ButtonProps, 'leadingIcon' | 'trailingIcon'> & { iconLeft: boolean; iconRight: boolean }
function Playground({ iconLeft = false, iconRight = false, variant = 'primary', shape = 'square', size = 'medium', ...nativeProps }: PlaygroundProps) {
  const props = { ...nativeProps, variant, shape, size }
  const [activations, setActivations] = useState(0)
  return <div className="cs04-panel zw-docs-playground">
    <section><h3>Button specimen</h3><div className="zw-docs-specimen">
      {props.label.trim() ? <Button {...props} leadingIcon={iconLeft ? <CircleDot /> : undefined} trailingIcon={iconRight ? <CircleDot /> : undefined} onClick={() => setActivations(value => value + 1)} />
        : <p>Enter a meaningful visible label to show the Button. Icon-only actions belong to CS-01.</p>}
    </div><p role="status">Activations: {activations}</p></section>
    <section className="zw-docs-configuration"><h3>Configuration</h3><dl className="zw-docs-config">
      <div><dt>Variant</dt><dd>{props.variant}</dd></div><div><dt>Shape</dt><dd>{props.shape}</dd></div>
      <div><dt>Size</dt><dd>{props.size}</dd></div><div><dt>Disabled</dt><dd>{props.disabled ? 'Yes' : 'No'}</dd></div>
      <div><dt>Icons</dt><dd>{iconLeft && iconRight ? 'Both' : iconLeft ? 'Leading' : iconRight ? 'Trailing' : 'None'}</dd></div>
    </dl></section>
    <p className="zw-docs-playground-notes">Light reference · Native Controls below. Hover with a pointer; Tab to inspect keyboard focus. CircleDot artwork is illustrative.</p>
  </div>
}

const meta = {
  title: 'CS-04/Button',
  component: Button,
  decorators: [Story => <div className="cs04-reference" data-oxygen-mode="light"><style>{referenceStateCss}</style><Story /></div>],
  args: { variant: 'primary', shape: 'square', size: 'medium', label: 'Save changes', disabled: false, iconLeft: false, iconRight: false },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger', 'text-primary', 'text-secondary'], description: 'Five source Types. Local API name: variant.' },
    shape: { control: 'select', options: ['square', 'round'] },
    size: { control: 'select', options: ['large', 'medium', 'small'] },
    label: { control: 'text', description: 'Required visible text. Empty values do not render an unnamed action.' },
    disabled: { control: 'boolean', description: 'Native disabled attribute. Blocks activation and removes the button from the tab order.' },
    iconLeft: { control: 'boolean', description: 'Storybook adapter for the leadingIcon SVG slot; not a Button prop.' },
    iconRight: { control: 'boolean', description: 'Storybook adapter for the trailingIcon SVG slot; independent of iconLeft.' },
  },
  parameters: { controls: { include: ['variant', 'shape', 'size', 'label', 'disabled', 'iconLeft', 'iconRight'], sort: 'none' } },
  render: args => <Playground {...args} />,
} satisfies Meta<PlaygroundProps>

export default meta
type Story = StoryObj<typeof meta>
export const PlaygroundExample: Story = { name: 'Playground' }
export const FullStateMatrix: Story = { name: 'All 120 states', parameters: { controls: { disable: true } }, render: () => <StateMatrix /> }
export const Icons: Story = { name: 'Icon configurations', parameters: { controls: { disable: true } }, render: () => <IconConfigurations /> }
export const NativeBehavior: Story = { name: 'Behavior examples', parameters: { controls: { disable: true } }, render: () => <Behavior /> }
export const AnatomyGeometry: Story = { name: 'Anatomy and geometry', parameters: { controls: { disable: true } }, render: () => <Anatomy /> }
