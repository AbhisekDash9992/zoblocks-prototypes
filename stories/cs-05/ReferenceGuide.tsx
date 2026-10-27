import { useId, useState, type ReactNode } from 'react'
import { ArrowRight, CircleDot } from 'lucide-react'
import { TabAtomSpecimen } from '../../src/oxygen-tabs/TabAtom'
import { Tabs, type TabsItem } from '../../src/oxygen-tabs/Tabs'
import './tabs-reference.css'

function ReferenceTable({ name, headings, rows }: { name: string; headings: string[]; rows: ReactNode[][] }) {
  return <div className="zw-docs-table cs05-scroll" role="region" aria-label={name} tabIndex={0}>
    <table><caption>{name}</caption><thead><tr>{headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0
        ? <th scope="row" key={column}>{cell}</th> : <td key={column}>{cell}</td>)}</tr>)}</tbody></table>
  </div>
}

export function ParentMapping() {
  return <ReferenceTable name="Parent source mapping" headings={['Reference style', 'Literal source Type → atom', 'Source parent W × H / gap', 'Evidence scope']} rows={[
    ['Underline', 'w underline → Undeline', '208 × 30px / 16px', 'Four visible; first selected; no optional icons'],
    ['Underline with icons', 'w underline and icons → Undeline', '296 × 30px / 16px', 'Four visible; leading icon enabled'],
    ['Pills', 'pills → Pill on gray', '240 × 30px / 16px', 'Four visible; first selected'],
    ['Pills with brand color', 'pills w brand color → Pill with brand color', '240 × 30px / 16px', 'Four visible; first selected'],
    ['Pills with brand border', 'pills w barnd border → Pill with brand underline', '178 × 38px / 6px', 'Four visible; nested border and root underline'],
  ]} />
}

export function Geometry() {
  return <div className="cs05-stack">
    <p className="cs05-note">All four Types cover Active (selected), Hover and Inactive. Source widths describe the inspected text-only specimens; other labels and optional content remain content-sized.</p>
    <ReferenceTable name="Standalone atom geometry" headings={['Source Type', 'Text-only source W × H', 'Padding T/R/B/L; content gap', 'Radius / treatment']} rows={[
      ['Undeline', '40 × 32px', '4 / 8 / 4 / 8px; 8px', 'Active root indicator; thickness unresolved'],
      ['Pill on gray', '48 × 32px', '4 / 12 / 4 / 12px; 8px', '6px in Active and Hover'],
      ['Pill with brand color', '48 × 32px', '4 / 12 / 4 / 12px; 8px', '6px in Active'],
      ['Pill with brand underline', '40 × 38px', 'Root 4 / 0 / 4 / 0px; root gap 8px', 'Nested 40 × 30px; 4 / 8 / 4 / 8px; gap 6px; radius 8px; Active edge 1px'],
    ]} />
    <ReferenceTable name="Geometry provenance and context" headings={['Measurement', 'Value / source status', 'Provenance / boundary']} rows={[
      ['Parent row', '30px height / 16px gap; brand border 38px height / 6px gap', 'Parent instances override standalone height; sample widths depend on source labels'],
      ['Label', 'DM Sans Medium 500; 14px / 22px; tracking 0', 'All sampled atom labels; browser uses the existing bundled font'],
      ['Decorative icon slots', '14 × 14px each', 'Atom instance boxes; original vectors and painted bounds unavailable'],
      ['Badge identity', 'Round / Outlined / Medium / Default; label 2', 'Nested component instance in all four inspected Active atom Types; Close and Icon start false'],
      ['Badge in Tabs', '27 × 20px; padding 2px / 10px; type 500, 11px / 16px', 'Measured contextual instance. Hug width is label-dependent; browser label 2 is about 26.44px, not an exact 27px reproduction'],
      ['Badge standalone', 'Medium: minimum 24px; padding 4px / 10px', 'Accepted CS-03 reference; same renderer, contextual block sizing only'],
      ['Borders / fill', 'Nested Active edge: 1px #BEDBFF. Badge: 1px inside #D1D5DC; fill #F2F3F5', 'Nested inset alignment is local. Badge inside alignment is verified in the four inspected Active Types; its foreground remains unverified'],
      ['Selected indicator', '#155DFC verified; source thickness unresolved', 'LOCAL / PROVISIONAL: 2px painted thickness. Mixed source stroke fields do not establish exact Figma thickness'],
      ['Focus / overflow', '2px outline, 2px offset; 6px scroll clearance', 'Local accessibility decisions; no source Focused variant'],
      ['Evidence / bindings', 'Inspected Light geometry and state samples', 'Equal-valued TF-01 reuse does not establish component bindings. Original artwork, alternate modes and variable aliases remain unverified'],
    ]} />
  </div>
}

export function Colors() {
  return <ReferenceTable name="Light state samples and token correspondence" headings={['Atom / state', 'Label', 'Fill / selected treatment', 'Evidence']} rows={[
    ['All / Inactive', '#6A7282 → gray/500', 'Transparent', 'Inspected Light values'],
    ['All / Hover', '#4A5565 → gray/600', 'Pill on gray: #EAECF0 → gray/200; others transparent', 'Static source Hover; live pointer uses the same recipe'],
    ['Underline / Active', '#1447E6 → blue/700', 'Indicator #155DFC → blue/600', 'Selected, not browser pressed state'],
    ['Pill on gray / Active', '#101828 → gray/900', '#F2F3F5 → gray/100', 'Inspected Light values'],
    ['Pill with brand color / Active', '#1447E6 → blue/700', '#F2F8FF → blue/50', 'Inspected Light values'],
    ['Pill with brand underline / Active', '#1447E6 → blue/700', 'Nested #F2F8FF; edge #BEDBFF → blue/200; root indicator #155DFC', 'Nested edge 1px; indicator thickness unresolved'],
    ['Nested Badge / four Active Types', 'Reference #4A5565; foreground unverified', 'Fill #F2F3F5; neutral inside border #D1D5DC, 1px', 'Fill and border verified; other states not separately inspected'],
  ]} />
}

export function Composition() {
  return <div className="cs05-stack">
    <pre className="cs05-composition" aria-label="React reference composition">{'Tabs — selection, focus, keyboard, panel relationships\n  → TabAtom — reusable presentational button\n      → Leading SVG slot (optional)\n      → Visible label\n      → Shared reference Badge (optional)\n      → Trailing SVG slot (optional)'}</pre>
    <ReferenceTable name="Composition and dependency map" headings={['Component / source', 'Reusable status / inputs', 'Context and evidence']} rows={[
      ['Tabs · src/oxygen-tabs/Tabs.tsx', 'Controlled reference: items, label, selectedId, onSelectionChange, variant; optional focus callback', 'Owns tablist, roving focus, unique tab/panel IDs and hidden panels; no routing or Data Grid integration'],
      ['TabAtom · src/oxygen-tabs/TabAtom.tsx', 'Separately reusable visual/control unit: variant, label, selected, badge, leadingIcon, trailingIcon, native props/ref', 'Stateless about selection; parent supplies ARIA. TabAtomSpecimen shares visuals with a noninteractive span'],
      ['Badge · src/oxygen-badge/Badge.tsx', 'Shared reusable reference renderer; type, color, label, optional icons/Close and className', 'CS-03 ReferenceBadge adapts this same implementation; CS-05 imports it directly. Round/Medium identity retained'],
      ['Tabs Badge context · src/oxygen-tabs/tabs.css', 'Context-specific geometry override', '20px minimum height; block padding 2px; shared inline padding 10px. Shared fill, inside edge and typography; no nested action'],
      ['ReferenceBadge · stories/cs-03/ReferenceBadge.tsx', 'Storybook-only compatibility adapter', 'CS-03 feedback/helpers stay in stories; portable Badge imports no Storybook helpers'],
      ['Icons · lucide-react', 'Existing replaceable SVG rendering mechanism', 'Illustrative artwork in 14px slots; no new Icon primitive and no Icon Button. Exact source vectors unverified'],
      ['ReferenceGuide / stories', 'Storybook-only specimens, annotations and demo state', 'Not a production-certified API. Figma component hierarchy does not prescribe production React hierarchy'],
    ]} />
    <p>Verified Figma hierarchy: Tab Atom → Container → Leading Icon instance, text label, Badge component instance, Trailing Icon instance. This establishes Badge composition in the design. React uses shared renderers and wrappers suited to this reference; production developers choose their own APIs and integration.</p>
  </div>
}

const callouts = [
  { feature: 'surface', marker: [40, 205], anchor: [150, 205], points: '40,205 150,205' },
  { feature: 'leading-icon', marker: [200, 40], anchor: [215, 170], points: '200,40 200,90 215,90 215,170' },
  { feature: 'label', marker: [340, 40], anchor: [340, 150], points: '340,40 340,150' },
  { feature: 'badge', marker: [500, 40], anchor: [497.5, 155], points: '500,40 500,90 497.5,90 497.5,155' },
  { feature: 'trailing-icon', marker: [640, 40], anchor: [630, 170], points: '640,40 640,90 630,90 630,170' },
  { feature: 'padding', marker: [280, 370], anchor: [340, 270], points: '280,370 280,330 340,330 340,270' },
  { feature: 'spacing', marker: [500, 370], anchor: [415, 205], points: '500,370 500,335 415,335 415,205' },
  { feature: 'radius-border', marker: [790, 205], anchor: [693.284, 141.716], points: '790,205 750,205 750,141.716 693.284,141.716' },
  { feature: 'indicator', marker: [790, 370], anchor: [680, 295], points: '790,370 740,370 740,295 680,295' },
]

export function Anatomy() {
  const titleId = useId(), descriptionId = useId()
  const surfaceClip = useId(), badgeClip = useId()
  const scrollHintId = useId()
  const notesTitleId = useId()
  const geometryTitleId = useId()
  return <div className="cs05-anatomy"><section className="cs05-card">
    <h3>Anatomy &amp; Geometry · Pill with brand underline / Active</h3>
    <h4 className="cs05-anatomy-subtitle">Anatomy</h4>
    <div className="cs05-anatomy-layout"><div className="cs05-diagram-column">
    <div className="cs05-diagram-scroll" role="region" aria-label="Tab anatomy diagram, nine numbered callouts" aria-describedby={scrollHintId} tabIndex={0}>
    <svg className="cs05-anatomy-diagram" viewBox="0 0 840 420" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>Selected TabAtom with leading icon, label, shared Badge and trailing icon</title>
      <desc id={descriptionId}>Nine external numbered callouts correspond to the legend. Source-relative geometry uses five drawing units per source pixel; displayed scale varies. Root height 38, inner height 30, inner padding 4 by 8, gap 6, icon boxes 14, label line 22, Badge 27 by 20 and inner radius 8 pixels. Combined width is an illustrative composition. The 2 pixel indicator is a local approximation. Guides are annotations, not source child nodes.</desc>
      <defs>
        <clipPath id={surfaceClip} clipPathUnits="userSpaceOnUse"><rect x="140" y="130" width="565" height="150" rx="40" /></clipPath>
        <clipPath id={badgeClip} clipPathUnits="userSpaceOnUse"><rect x="430" y="155" width="135" height="100" rx="50" /></clipPath>
      </defs>
      <rect className="cs05-root-guide" data-anatomy-box="root" x="140" y="110" width="565" height="190" />
      <rect className="cs05-diagram-surface" data-anatomy-box="surface" x="140" y="130" width="565" height="150" rx="40" clipPath={`url(#${surfaceClip})`} />
      <rect className="cs05-box-guide" data-anatomy-box="leading-icon" x="180" y="170" width="70" height="70" />
      <rect className="cs05-measure-bound" data-anatomy-box="label" x="280" y="150" width="120" height="110" />
      <path className="cs05-anatomy-reference" data-anatomy-guide="label-line" d="M322 150H358" />
      <rect className="cs05-diagram-badge" data-anatomy-box="badge" x="430" y="155" width="135" height="100" rx="50" clipPath={`url(#${badgeClip})`} />
      <rect className="cs05-box-guide" data-anatomy-box="trailing-icon" x="595" y="170" width="70" height="70" />
      <path className="cs05-anatomy-reference" data-anatomy-guide="padding" d="M340 260V280 M334 260H346 M334 280H346" />
      <path className="cs05-anatomy-reference" data-anatomy-guide="spacing" d="M400 205H430 M400 199V211 M430 199V211" />
      <g className="cs05-diagram-artwork" aria-hidden="true"><circle cx="215" cy="205" r="20" /><circle cx="215" cy="205" r="5" fill="currentColor" />
        <path d="M610 205h40m-16-16 16 16-16 16" /></g>
      <text className="cs05-diagram-label" x="340" y="205" dominantBaseline="central" textAnchor="middle">Tab</text>
      <text className="cs05-diagram-count" x="497.5" y="205" dominantBaseline="central" textAnchor="middle">2</text>
      <rect className="cs05-diagram-indicator" data-anatomy-box="indicator" x="140" y="290" width="565" height="10" />
      {callouts.map(({ feature, marker, anchor, points }, index) => <g key={feature} className="cs05-callout" data-feature={feature} aria-hidden="true">
        <polyline points={points} vectorEffect="non-scaling-stroke" /><circle className="cs05-anchor" cx={anchor[0]} cy={anchor[1]} r="4" />
        <circle className="cs05-number-marker" cx={marker[0]} cy={marker[1]} r="24" />
        <text className="cs05-number" x={marker[0]} y={marker[1]} dominantBaseline="central" textAnchor="middle">{index + 1}</text>
      </g>)}
    </svg>
    </div>
    </div>
    <ol className="cs05-legend" aria-label="Tab anatomy legend">
      <li data-feature="surface"><strong>Container / surface.</strong> Root height 38px; nested content height 30px, selected fill #F2F8FF.</li>
      <li data-feature="leading-icon"><strong>Leading icon slot.</strong> Optional 14 × 14px box. Circle artwork is illustrative.</li>
      <li data-feature="label"><strong>Text label.</strong> DM Sans Medium 500, 14px / 22px, zero tracking. Width follows text.</li>
      <li data-feature="badge"><strong>Shared Badge.</strong> Round / Outlined / Medium / Default; source label “2”, 27 × 20px, padding 2px / 10px, type 11px / 16px. Fill #F2F3F5, inside edge #D1D5DC 1px.</li>
      <li data-feature="trailing-icon"><strong>Trailing icon slot.</strong> Optional 14 × 14px box; decorative, without a separate action.</li>
      <li data-feature="padding"><strong>Padding.</strong> Root 4px vertical / 0 horizontal; nested content 4px vertical / 8px horizontal. Dot identifies nested bottom padding.</li>
      <li data-feature="spacing"><strong>Adjacent spacing.</strong> 6px between children in this nested container; other atom Types use 8px.</li>
      <li data-feature="radius-border"><strong>Radius / border.</strong> Nested 8px radius and Active 1px #BEDBFF edge; the reference paints it inside. Dot meets the rounded corner.</li>
      <li data-feature="indicator"><strong>Selected indicator.</strong> Root underline #155DFC. Source thickness unresolved; the diagram and renderer use a local 2px approximation.</li>
    </ol>
    </div>
    <section className="cs05-geometry zw-docs" aria-labelledby={geometryTitleId}><h4 id={geometryTitleId}>Geometry &amp; spacing</h4>
      <Geometry />
    </section>
    <div className="cs05-actual"><h4>Actual-size reference</h4><div className="cs05-sample"><TabAtomSpecimen variant="pill-brand-underline" label="Tab" selected leadingIcon={<CircleDot />} badge="2" trailingIcon={<ArrowRight />} /></div></div>
    <aside className="cs05-reference-notes" aria-labelledby={notesTitleId}><h4 id={notesTitleId}>Reference notes</h4><ul>
      <li id={scrollHintId}>In a narrow region, scroll the Anatomy diagram horizontally to inspect its callouts. Keyboard: Tab to the named diagram region, then use Left/Right arrows. Touch: swipe horizontally within it. Geometry tables also scroll locally in named keyboard-accessible regions.</li>
      <li>The Anatomy schematic is a source-relative annotation, not a literal Figma screenshot or layer tree. Drawing units and displayed scale differ. Combined width is illustrative; no combined icon + label + Badge + icon width was measured. Solid callouts identify parts; subtle padding/spacing references and dashed guides are annotations.</li>
      <li>The Badge drawing uses nominal source width 27px; the actual-size output remains content-sized.</li>
      <li>Source-backed measurements appear in the legend. Icon artwork is illustrative; original artwork, component bindings and source indicator thickness remain unverified. The indicator uses a local 2px approximation.</li>
    </ul></aside>
  </section></div>
}

const usageCases = [
  { name: 'Simple text', labels: ['Overview', 'Details', 'Activity', 'Files'] },
  { name: 'Leading icons', labels: ['Overview', 'Details', 'Activity', 'Files'], leading: true },
  { name: 'Count Badges', labels: ['Overview', 'Details', 'Activity', 'Files'], badge: true },
  { name: 'Trailing icons', labels: ['Overview', 'Details', 'Activity', 'Files'], trailing: true },
  { name: 'Longer labels', labels: ['Workspace overview', 'Item properties', 'Recent activity', 'Attached example files'] },
  { name: 'Narrow overflow', labels: ['Workspace overview', 'Item properties', 'Recent activity', 'Attached example files'], narrow: true },
]

export function Usage() {
  const chooserId = useId()
  const [scenario, setScenario] = useState(0), [selected, setSelected] = useState('0')
  const example = usageCases[scenario]
  const items: TabsItem[] = example.labels.map((label, index) => ({ id: String(index), label,
    leadingIcon: example.leading ? <CircleDot /> : undefined, trailingIcon: example.trailing ? <ArrowRight /> : undefined,
    badge: example.badge ? '2' : undefined, panel: <p>{['Summary of the synthetic workspace.', 'Properties of the example item.', 'Recent changes in the example workspace.', 'Attachments for the example workspace.'][index]}</p> }))
  return <section className="cs05-card cs05-usage"><h3>One live example, six configurations</h3>
    <label htmlFor={chooserId}>Example configuration</label>{' '}<select id={chooserId} value={scenario} onChange={event => setScenario(Number(event.target.value))}>
      {usageCases.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}
    </select>
    <div className={example.narrow ? 'cs05-usage-container cs05-usage-container--narrow' : 'cs05-usage-container'}>
      <Tabs label="Example workspace sections" items={items} selectedId={selected} onSelectionChange={setSelected} variant="underline" />
    </div>
    <p className="cs05-note">The selector is a documentation control. Tabs always use the accepted manual-activation implementation. In Narrow overflow, the container is at most 240px; focus the first tab and press End to reveal the last. The visible panel itself is focusable, without a placeholder link.</p>
  </section>
}
