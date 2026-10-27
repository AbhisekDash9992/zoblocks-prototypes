import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { ArrowRight, CircleDot, FileText, Star } from 'lucide-react'
import { useState } from 'react'
import { Tabs, type TabsItem, type TabsVariant } from '../../src/oxygen-tabs/Tabs'
import { TabAtom, TabAtomSpecimen, type TabAtomVariant } from '../../src/oxygen-tabs/TabAtom'
import { Anatomy, Usage } from './ReferenceGuide'
import './tabs-reference.css'

const styles: Record<TabsVariant, { label: string; source: string; atom: string; atomVariant: TabAtomVariant }> = {
  underline: { label: 'Underline', source: 'w underline', atom: 'Undeline', atomVariant: 'underline' },
  'underline-icons': { label: 'Underline with icons', source: 'w underline and icons', atom: 'Undeline', atomVariant: 'underline' },
  pills: { label: 'Pills', source: 'pills', atom: 'Pill on gray', atomVariant: 'pill-gray' },
  'pills-brand': { label: 'Pills with brand color', source: 'pills w brand color', atom: 'Pill with brand color', atomVariant: 'pill-brand' },
  'pills-brand-border': { label: 'Pills with brand border', source: 'pills w barnd border', atom: 'Pill with brand underline', atomVariant: 'pill-brand-underline' },
}
const itemIds = ['overview', 'details', 'activity', 'files'] as const
const iconChoices = { CircleDot, FileText, Star, ArrowRight }
type IconChoice = keyof typeof iconChoices
type PlaygroundArgs = {
  variant: TabsVariant
  label: string
  selectedItem: typeof itemIds[number]
  showLeadIcon: boolean
  showBadge: boolean
  showTailIcon: boolean
  leadIcon: IconChoice
  tailIcon: IconChoice
}

function demoItems(firstLabel: string, leading = false, badge = false, trailing = false,
  leadIcon: IconChoice = 'CircleDot', tailIcon: IconChoice = 'ArrowRight'): TabsItem[] {
  const Leading = iconChoices[leadIcon], Trailing = iconChoices[tailIcon]
  return itemIds.map((id, index) => {
    const label = [firstLabel, 'Details', 'Activity', 'Files'][index]
    return { id, label, leadingIcon: leading ? <Leading /> : undefined, trailingIcon: trailing ? <Trailing /> : undefined,
      badge: badge ? '2' : undefined,
      panel: <p>{['Overview: example summary.', 'Details: example item properties.', 'Activity: example change history.', 'Files: example attachments.'][index]}</p> }
  })
}

function Playground({ variant = 'underline', label = 'Overview', selectedItem = 'overview', showLeadIcon = false,
  showBadge = false, showTailIcon = false, leadIcon = 'CircleDot', tailIcon = 'ArrowRight', onSelectionChange }: PlaygroundArgs & { onSelectionChange: (id: string) => void }) {
  const [focused, setFocused] = useState<string | null>(null)
  const items = demoItems(label, showLeadIcon || variant === 'underline-icons', showBadge, showTailIcon, leadIcon, tailIcon)
  const source = styles[variant]
  return <div className="cs05-card zw-docs-playground">
    <section><h2>Tabs Playground</h2><div className="zw-docs-specimen">
      {label.trim() ? <Tabs label="Synthetic example sections" items={items} selectedId={selectedItem}
        variant={variant} onSelectionChange={onSelectionChange} onFocusedItemChange={setFocused} />
        : <p>Enter a meaningful first-tab label to show the example.</p>}
    </div></section>
    <section className="zw-docs-configuration"><h3>Configuration</h3><dl className="zw-docs-config">
      <div><dt>Source style</dt><dd>{source.source}</dd></div>
      <div><dt>Source atom</dt><dd>{source.atom}</dd></div>
      <div><dt>Selected item</dt><dd>{label.trim() ? items.find(item => item.id === selectedItem)?.label : 'No tabs displayed'}</dd></div>
      <div><dt>Focused item</dt><dd>{label.trim() && focused ? items.find(item => item.id === focused)?.label : 'Outside tablist'}</dd></div>
      <div><dt>Visible tabs</dt><dd>{label.trim() ? 4 : 0}</dd></div>
      <div><dt>Activation</dt><dd>Manual</dd></div>
      <div><dt>Lead / badge / tail</dt><dd>{showLeadIcon || variant === 'underline-icons' ? 'On' : 'Off'} / {showBadge ? 'On' : 'Off'} / {showTailIcon ? 'On' : 'Off'}</dd></div>
      {showBadge && <><div><dt>Badge source</dt><dd>Round / Outlined / Medium / Default</dd></div>
        <div><dt>Badge instance</dt><dd>20px height; 2px / 10px padding; Close and Icon start off</dd></div></>}
    </dl></section>
    <div className="zw-docs-playground-notes cs05-note">
      <p>Left/Right wrap focus; Home/End reach the ends. Enter/Space or click selects. Tab leaves the tablist. Focus and selection are independent.</p>
      <p>Underline with icons always includes its source-required lead icon. Other optional content is illustrative. Native Controls reset also restores the first selected item.</p>
      <p>TabAtom renders the same portable reference Badge used by CS-03 through its ReferenceBadge adapter. Figma uses a nested Badge component instance: Round / Outlined / Medium / Default, label “2”, Close and Icon start off.</p>
      <p>Medium is the source Size. Its measured Tabs instance is 20px high with 2px / 10px padding; standalone CS-03 stays 24px with 4px / 10px padding. The 27px example width follows label “2”, not every label. Fill #F2F3F5 and a #D1D5DC 1px inside edge are verified for the inspected Active instances of all four atom Types.</p>
      <p>Light samples; public glyph approximations. Badge foregrounds and variable bindings remain unverified. Enabled Badge behavior in other tab states reuses this reference recipe without claiming additional source inspection. This is developer-facing design-reference code; production APIs and integration belong to engineering.</p>
      <p>A 2px indicator, selected-over-hover precedence and focus outline remain local reference choices. Exact source indicator thickness is unverified.</p>
    </div>
  </div>
}

function ParentExample({ variant }: { variant: TabsVariant }) {
  return <section className="cs05-card" data-parent-style={variant}><h3>{styles[variant].label}</h3>
    <div className={`ox-tabs ox-tabs--${variant}`}><div className="ox-tabs__scroller"><div className="ox-tabs__list">
      {['Overview', 'Details', 'Activity', 'Files'].map((label, index) => <TabAtomSpecimen key={label}
        variant={styles[variant].atomVariant} label={label} selected={index === 0}
        leadingIcon={variant === 'underline-icons' ? <CircleDot /> : undefined} />)}
    </div></div></div>
    <p className="cs05-note">Source: {styles[variant].source} → {styles[variant].atom}. Four visible tabs. Parent row: {variant === 'pills-brand-border' ? '38px height / 6px gap' : '30px height / 16px gap'}.</p>
  </section>
}

function AtomGallery() {
  const variants: { variant: TabAtomVariant; source: string }[] = [
    { variant: 'underline', source: 'Undeline' }, { variant: 'pill-gray', source: 'Pill on gray' },
    { variant: 'pill-brand', source: 'Pill with brand color' }, { variant: 'pill-brand-underline', source: 'Pill with brand underline' },
  ]
  return <div className="cs05-stack"><section className="cs05-card"><h2>Twelve standalone source states</h2>
    <p className="cs05-note">Four Types × Active / Hover / Inactive. Active means selected. Static specimens do not react to pointer hover and are excluded from the Tab sequence; use Playground for interaction.</p>
    <p className="cs05-note">Standalone height is 32px or 38px; parent instances override the first four styles to 30px. Width follows label content; exported specimen widths are not universal widths. Indicator thickness is locally 2px.</p>
  </section>{variants.map(({ variant, source }) => <section key={variant} className="cs05-card"><h3>{source}</h3><div className="cs05-specimens">
    {(['active', 'hover', 'inactive'] as const).map(state => <div key={state} className="cs05-specimen" data-atom-case={`${variant}/${state}`}>
      <h3>{state === 'active' ? 'Active (selected)' : state === 'hover' ? 'Hover (static)' : 'Inactive'}</h3>
      <div className="cs05-sample"><TabAtom variant={variant} label="Tab" selected={state === 'active'} data-reference-state={state} tabIndex={-1} /></div>
    </div>)}
  </div></section>)}</div>
}

function OptionalContent() {
  return <section className="cs05-card"><h2>Eight optional-content configurations</h2>
    <p className="cs05-note">Lead / badge / tail cover all eight visibility combinations on one atom. Public glyphs are illustrative, with 14px boxes. The actual shared Badge renders Round / Outlined / Medium / Default with label “2”, a tinted surface and neutral inside edge. Only contextual geometry changes to 20px height and 2px / 10px padding. No nested action or extra tab stop.</p>
    <div className="cs05-specimens">{Array.from({ length: 8 }, (_, mask) => <div className="cs05-specimen" key={mask} data-content-case={mask}>
      <h3>Lead {mask & 4 ? 'on' : 'off'} / badge {mask & 2 ? 'on' : 'off'} / tail {mask & 1 ? 'on' : 'off'}</h3>
      <div className="cs05-sample"><TabAtom variant="pill-brand" label="Sample" selected tabIndex={-1} data-reference-state="active"
        leadingIcon={mask & 4 ? <CircleDot /> : undefined} badge={mask & 2 ? '2' : undefined} trailingIcon={mask & 1 ? <ArrowRight /> : undefined} /></div>
    </div>)}</div>
    <p className="cs05-note">Swap Lead Icon and Tail Icon independently in Playground. They remain decorative; the visible label names the tab.</p>
  </section>
}

const meta = {
  title: 'CS-05/Tabs',
  decorators: [Story => <div className="cs05-reference" data-oxygen-mode="light"><Story /></div>],
  args: { variant: 'underline', label: 'Overview', selectedItem: 'overview', showLeadIcon: false, showBadge: false,
    showTailIcon: false, leadIcon: 'CircleDot', tailIcon: 'ArrowRight' },
  argTypes: {
    variant: { control: 'select', options: Object.keys(styles), description: 'Five normalized parent Types; original source name appears in Configuration.' },
    label: { control: 'text', description: 'First tab label. Other three labels are synthetic and fixed.' },
    selectedItem: { control: 'select', options: itemIds, description: 'Controlled selection; arrows change focus without changing this value.' },
    showLeadIcon: { control: 'boolean', description: 'Optional lead icon. The Underline with icons style always enables it.' },
    showBadge: { control: 'boolean', description: 'Actual shared reference Badge: Round/Outlined/Medium/Default; Tabs-context 20px height, 2px/10px padding. No Badge icon or Close.' },
    showTailIcon: { control: 'boolean', description: 'Decorative trailing icon; no close/menu behavior.' },
    leadIcon: { control: 'select', options: Object.keys(iconChoices), description: 'Illustrative public artwork; independent swap.' },
    tailIcon: { control: 'select', options: Object.keys(iconChoices), description: 'Illustrative public artwork; independent swap.' },
  },
  parameters: { controls: { include: ['variant', 'label', 'selectedItem', 'showLeadIcon', 'showBadge', 'showTailIcon', 'leadIcon', 'tailIcon'], sort: 'none' } },
  render: function Render(args) {
    const [, updateArgs] = useArgs<PlaygroundArgs>()
    return <Playground {...args} onSelectionChange={id => updateArgs({ selectedItem: id as PlaygroundArgs['selectedItem'] })} />
  },
} satisfies Meta<PlaygroundArgs>

export default meta
type Story = StoryObj<typeof meta>
export const PlaygroundExample: Story = { name: 'Playground' }
export const ParentStyles: Story = { name: 'Five parent styles', parameters: { controls: { disable: true } },
  render: () => <div className="cs05-stack">{(Object.keys(styles) as TabsVariant[]).map(variant => <ParentExample variant={variant} key={variant} />)}</div> }
export const SourceAtomStates: Story = { name: 'Twelve Atom states', parameters: { controls: { disable: true } }, render: () => <AtomGallery /> }
export const ContentConfigurations: Story = { name: 'Icon and badge configurations', parameters: { controls: { disable: true } }, render: () => <OptionalContent /> }
export const AnatomyGeometry: Story = { name: 'Anatomy and geometry', parameters: { controls: { disable: true } }, render: () => <Anatomy /> }
export const UsageExamples: Story = { name: 'Usage examples', parameters: { controls: { disable: true } }, render: () => <Usage /> }
