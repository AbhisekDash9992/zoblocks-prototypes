import type { Meta, StoryObj } from '@storybook/react-vite'
import { badgeColors, badgeTypes, type BadgeColor, type BadgeType } from './ReferenceBadge'
import { Anatomy, ContextExamples, CombinationGallery, OptionalContent, ContextIconExamples, RemovableExample, RemovableGroup } from './ReferenceGuide'

function Playground({ Type = 'Outlined', Color = 'Default', Label, 'Icon start': iconStart = false, Close = false }: {
  Type: BadgeType; Color: BadgeColor; Label: string; 'Icon start': boolean; Close: boolean
}) {
  return <div className="cs03-panel cs03-playground">
    <section className="cs03-specimen" aria-label="Working Badge specimen">
      <h3>Badge specimen</h3>
      <div className="cs03-playground-badge"><RemovableExample type={Type} color={Color} label={Label} iconStart={iconStart} close={Close} /></div>
      <p className="cs03-muted">Actual size · 24px single-line height</p>
    </section>
    <section className="cs03-configuration" aria-label="Current Badge configuration">
      <h3>Configuration</h3>
      <p className="cs03-summary-caption">Fixed in this reference</p>
      <dl className="cs03-config cs03-config-fixed"><div><dt>Shape</dt><dd>Round</dd></div><div><dt>Size</dt><dd>Medium</dd></div></dl>
      <p className="cs03-summary-caption">Adjust with native Controls</p>
      <dl className="cs03-config">
        <div><dt>Type</dt><dd>{Type}</dd></div><div><dt>Color</dt><dd>{Color}</dd></div>
        <div><dt>Icon start</dt><dd>{iconStart ? 'On · SquareDashed' : 'Off'}</dd></div>
        <div><dt>Close</dt><dd>{Close ? 'On · Remove Badge' : 'Off'}</dd></div>
      </dl>
    </section>
    <div className="cs03-playground-notes">
      {Close && <p className="cs03-close-note"><strong>Close:</strong> X removes the whole Badge. Restore repeats it. Designer-approved behavior; not verified from the Figma prototype.</p>}
      <p className="cs03-muted">Informational text. Foregrounds and Figma bindings are provisional; Lucide artwork is approximate. Long labels wrap and increase height.</p>
      {Close && <p className="cs03-close-note"><strong>Accessibility:</strong> the 12 × 16px Close target remains small and needs review.</p>}
    </div>
  </div>
}

const meta = {
  title: 'CS-03/Badge',
  component: Playground,
  args: { Type: 'Outlined', Color: 'Default', Label: 'Tag Label', 'Icon start': false, Close: false },
  argTypes: {
    Type: { control: 'select', options: badgeTypes, description: 'Figma Type, independent of Color. Shape remains Round; Size remains Medium.' },
    Color: { control: 'select', options: badgeColors, description: 'Figma Color, independent of Type. Foregrounds and source bindings remain provisional.' },
    Label: { control: 'text', description: 'Visible, meaningful text. An empty value shows explanatory feedback.' },
    'Icon start': { control: 'boolean', description: 'Optional 12px leading visual. SquareDashed is a neutral Lucide illustration; contextual artwork is replaceable in the local renderer.' },
    Close: { control: 'boolean', description: 'Fixed 12px Lucide X inside a native removal button. Designer-approved local behavior; the parent owns visibility.' },
  },
  parameters: { controls: { sort: 'none' } },
} satisfies Meta<typeof Playground>

export default meta
type Story = StoryObj<typeof meta>
export const PlaygroundExample: Story = { name: 'Playground' }
export const VariantMatrix: Story = { name: 'Round / Medium matrix', parameters: { controls: { disable: true } }, render: () => <CombinationGallery /> }
export const AnatomyReference: Story = { parameters: { controls: { disable: true } }, render: () => <Anatomy /> }
export const ContextualExamples: Story = { parameters: { controls: { disable: true } }, render: () => <ContextExamples /> }
export const OptionalContentReference: Story = { name: 'Optional icon visuals', parameters: { controls: { disable: true } }, render: () => <OptionalContent /> }
export const ContextualIconExamples: Story = { name: 'Contextual Usage', parameters: { controls: { disable: true } }, render: () => <ContextIconExamples /> }
export const RemovableBadgeGroup: Story = { parameters: { controls: { disable: true } }, render: () => <RemovableGroup /> }
