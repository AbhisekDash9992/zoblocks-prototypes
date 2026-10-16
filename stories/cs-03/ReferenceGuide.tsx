import { useId, useLayoutEffect, useRef, useState, type ComponentProps } from 'react'
import { Funnel } from 'lucide-react'
import { ReferenceBadge, badgeCombinations, badgeTypes, badgeColors, contrastRatio, referenceColors, sourceColors } from './ReferenceBadge'
import { TokenTable, type TokenRow } from '../cs-01/ReferenceTokens'

export function Evidence() {
  return <div className="cs03-reference cs03-evidence">
    <section><h3>Verified evidence</h3><p>Source geometry, typography, root fills and border colors.</p><details><summary>Source evidence</summary><p>Designer-supplied inspection, 14 October 2026: Oxygen Design System → ❖ Badge, component set 228:5201. 361 nodes, 60 variants, no truncation or inspection errors.</p></details></section>
    <section><h3>Still under review</h3><p>Exact foregrounds and variable bindings; Outlined border weight/alignment; original icon artwork/library bindings; compact removal target suitability. Removal is designer-approved local behavior, not Figma prototype evidence. Lucide artwork is illustrative.</p></section>
  </div>
}

export function CombinationGallery() {
  return <div className="cs03-reference cs03-gallery" aria-label="15 Round / Medium Badge combinations">
    {badgeTypes.map(type => <section className="cs03-type-group" data-cs03-group={type} key={type}>
      <h3>{type}</h3>
      <div className="cs03-color-grid">{badgeColors.map(color => <div className="cs03-variant-card" key={color}>
        <h4>{color}</h4><ReferenceBadge type={type} color={color} label="Tag Label" />
      </div>)}</div>
    </section>)}
  </div>
}

export function Anatomy() {
  const title = useId(), description = useId()
  const callouts = [
    { number: 1, feature: 'surface', marker: [24, 156], anchor: [84, 156], points: '38,156 84,156' },
    { number: 2, feature: 'label', marker: [456, 160], anchor: [363, 160], points: '442,160 363,160' },
    { number: 3, feature: 'padding', marker: [24, 48], anchor: [220, 108], points: '38,48 76,48 76,84 220,84 220,108' },
    { number: 4, feature: 'border', marker: [456, 264], anchor: [240, 217.5], points: '442,264 240,264 240,217.5' },
    { number: 5, feature: 'radius', marker: [456, 48], anchor: [400, 124], points: '442,48 424,48 424,124 400,124' },
  ]
  return <div className="cs03-reference cs03-anatomy">
    <svg className="cs03-anatomy-diagram" viewBox="0 0 480 312" role="img" aria-labelledby={`${title} ${description}`}>
      <title id={title}>Badge anatomy, enlarged Round / Outlined / Medium / Default schematic</title>
      <desc id={description}>Five annotations identify surface, label line box, padding, provisional inset border and corner radius. Guides and numbered markers are not source child nodes. Width is illustrative.</desc>
      <rect x="68" y="100" width="345" height="120" rx="60" fill="#F2F3F5" />
      <rect x="70.5" y="102.5" width="340" height="115" rx="57.5" fill="none" stroke="#D1D5DC" strokeWidth="5" />
      <rect className="cs03-label-guide" x="118" y="120" width="245" height="80" />
      <text x="240.5" y="160" dominantBaseline="central" textAnchor="middle" fill="#4A5565" fontFamily="DM Sans, sans-serif" fontWeight="500" fontSize="55">Tag Label</text>
      {callouts.map(({ number, feature, marker, anchor, points }) => <g data-feature={feature} key={number}>
        <polyline className="cs03-leader" points={points} vectorEffect="non-scaling-stroke" />
        <circle className="cs03-anchor" cx={anchor[0]} cy={anchor[1]} r="2.5" />
        <circle className="cs03-number-marker" cx={marker[0]} cy={marker[1]} r="14" />
        <text className="cs03-number" x={marker[0]} y={marker[1]} dominantBaseline="central" textAnchor="middle">{number}</text>
      </g>)}
    </svg>
    <div><p className="cs03-muted">5× height/padding/type schematic; illustrative content width. Annotations explain features, not an exact Figma layer tree.</p>
      <ol className="cs03-legend">
        <li>Container / surface: source-backed Default fill #F2F3F5; horizontal content layout.</li>
        <li>Label: DM Sans Medium (500), 11px / 16px, 0% tracking. Foreground #4A5565 is provisional. Dashed line box is a guide.</li>
        <li>Padding: Medium 4px vertical / 10px horizontal. Gap is 4px; only text is present.</li>
        <li>Border where applicable: source-backed #D1D5DC. Local 1px inset painted edge is provisional; source weight and alignment remain unknown.</li>
        <li>Corner radius: Round 9999px, rendered as a pill; source Square 8px remains deferred.</li>
      </ol>
    </div>
  </div>
}

export function GeometryTypography() {
  const rows: TokenRow[] = [
    ['Medium height', 'space/300', null, '24px single line', 'B'],
    ['Vertical padding', 'space/50', null, '4px', 'B'],
    ['Horizontal padding', 'space/125', null, '10px', 'B'],
    ['Adjacent gap', 'space/50', null, '4px; omitted with absent icons', 'B'],
    ['Icon box sizing', 'space/150', null, '12 × 12px; approximate Lucide artwork', 'B'],
    ['Round radius', 'radius/full', null, '9999px pill sentinel', 'B'],
    ['Font family', 'font/family/DM Sans', null, 'DM Sans', 'B'],
    ['Font weight', 'font/weight/medium', null, 'Medium; CSS 500', 'B'],
    ['Font size', 'font/size/50', null, '11; rendered 11px', 'B'],
    ['Line height', 'line-height/16', null, '16; rendered 16px', 'B'],
    ['Tracking', 'letter-spacing/normal', null, '0; rendered 0%', 'B'],
    ['Outlined edge', null, null, '1px inset shadow; source weight/alignment unknown', 'D'],
    ['Elevation / motion', null, null, 'No elevation or Badge transition', 'D'],
    ['Close focus', null, null, '2px currentColor outline; 1px offset; 2px button radius', 'D'],
    ['Solid Close rest alpha', null, null, '85% white; not icon/on-dark-disabled (80%)', 'D'],
    ['Docs Boolean capsule', null, null, 'Transform 160ms ease-out; none with reduced motion', 'D'],
  ]
  return <div className="cs03-reference cs03-table-wrap"><TokenTable className="cs03-geometry-table" caption="Badge geometry and typography — source values, proposed variable mappings" rows={rows} />
    <p className="cs03-muted">Horizontal layout, center aligned. Medium / Small example widths 69px / 65px are not fixed widths. Local long labels wrap and increase height; source multiline behavior is unresolved. Small (20px, padding 2px / 8px) and Square (8px radius) remain deferred.</p></div>
}

export function ColorReference() {
  const mappings = [
    ['Default', null, 'gray/100', 'border/primary', 'gray/300', null, 'gray/500'],
    ['Info', 'bg/info-primary', 'blue/50', 'border/info-secondary', 'blue/200', 'bg/info-solid', 'blue/600'],
    ['Success', 'bg/success-primary', 'green/50', 'border/success-secondary', 'green/200', 'bg/success-solid', 'green/700'],
    ['Warning', 'bg/warning-primary', 'amber/50', 'border/warning-secondary', 'amber/200', 'bg/warning-solid', 'amber/700'],
    ['Danger', 'bg/danger-primary', 'red/50', 'border/danger-secondary', 'red/200', 'bg/danger-solid', 'red/600'],
  ] as const
  const rows: TokenRow[] = mappings.flatMap(([name, fill, fp, border, bp, solid, sp]) => [
    [`${name} · Outlined / Flat background`, fill, fp, sourceColors[name].fill, fill ? 'B' : 'C'],
    [`${name} · Outlined border`, border, bp, sourceColors[name].border, 'B'],
    [`${name} · Solid background`, solid, sp, sourceColors[name].solid, solid ? 'B' : 'C'],
  ] satisfies TokenRow[])
  const textRows: TokenRow[] = [
    ['Default text / leading icon', 'text/secondary', 'gray/600', '#4A5565', 'B'],
    ['Info text / leading icon', 'text/info-primary', 'blue/700', '#1447E6', 'B'],
    ['Success text / leading icon', null, null, '#006B2C', 'D'],
    ['Warning text / leading icon', null, null, '#8F3B00', 'D'],
    ['Danger text / leading icon', null, null, '#B42318', 'D'],
    ['Solid text / leading icon', 'text/on-dark', 'white', '#FFFFFF', 'B'],
  ]
  return <div className="cs03-reference cs03-table-wrap"><TokenTable className="cs03-color-table" caption="Color and border reference — source colors with proposed mappings" rows={rows} />
    <TokenTable caption="Text and inherited leading-icon foregrounds — local choices" rows={textRows} />
    <p className="cs03-muted">All component alias bindings remain unresolved. Foreground mappings describe label roles; leading SVGs inherit currentColor without a separate icon binding. Custom Success/Warning/Danger foregrounds are not substituted with similarly named tokens. Default backgrounds show known primitives without selecting a semantic role by hex alone.</p>
  </div>
}

export function CloseTokens() {
  const rows = [
    ['Default', 'icon/secondary', 'gray/600', '#4A5565', 'icon/primary', 'gray/900', '#101828'],
    ['Info', 'icon/info-secondary', 'blue/500', '#2B7FFF', 'icon/info-primary', 'blue/700', '#1447E6'],
    ['Success', 'icon/success-secondary', 'green/700', '#008236', 'icon/success-primary', 'green/800', '#016630'],
    ['Warning', 'icon/warning-secondary', 'amber/600', '#E17100', 'icon/warning-primary', 'amber/700', '#BB4D00'],
    ['Danger', 'icon/danger-secondary', 'red/500', '#FB2C36', 'icon/danger-primary', 'red/700', '#C10007'],
    ['Solid · all Colors', 'icon/on-dark', 'white', '#FFFFFF at 85%', 'icon/on-dark', 'white', '#FFFFFF at 100%'],
  ]
  return <div className="zw-docs-table"><table><caption>Close icon — proposed Rest / Hover mappings (B); Solid 85% alpha is local (D)</caption>
    <thead><tr><th scope="col">Type / Color</th><th scope="col">Rest</th><th scope="col">Hover / focus-visible</th></tr></thead>
    <tbody>{rows.map(([name, rest, rp, rv, hover, hp, hv]) => <tr key={name}><th scope="row">{name}</th><td><code className="zw-docs-token">{rest}</code><br />{rp}<br /><span className="zw-docs-hex">{rv}</span></td><td><code className="zw-docs-token">{hover}</code><br />{hp}<br /><span className="zw-docs-hex">{hv}</span></td></tr>)}</tbody>
  </table><p>Outlined / Flat use intent rows. Only X color changes; the button stays transparent with no shadow in every state. Keyboard focus retains its outline. No original Badge binding or new global token is asserted.</p></div>
}

export function ContrastAudit() {
  return <div className="cs03-reference cs03-table-wrap"><table className="cs03-contrast-table">
    <caption>Text contrast — 15 combinations · minimum 4.5:1 for 11px text</caption>
    <thead><tr><th scope="col">Type / Color</th><th scope="col">Foreground</th><th scope="col">Background</th><th scope="col">Ratio</th><th scope="col">PASS / FAIL</th></tr></thead>
    <tbody>{badgeCombinations.map(({ type, color }) => {
      const colors = referenceColors(type, color), ratio = contrastRatio(colors.foreground, colors.fill)
      return <tr key={`${type}-${color}`}><th scope="row">{type} / {color}</th><td><span className="zw-docs-hex">{colors.foreground}</span></td><td><span className="zw-docs-hex">{colors.fill}</span></td><td><span className="zw-docs-number">{ratio.toFixed(2)}:1</span></td><td><span className={ratio >= 4.5 ? 'zw-docs-status-pass' : 'zw-docs-status-fail'}>{ratio >= 4.5 ? 'PASS' : 'FAIL'}</span></td></tr>
    })}</tbody>
  </table><p className="cs03-muted">Calculated with WCAG relative luminance using the actual local colors. Every foreground, including Solid white, has an unverified Figma value/binding. Passing contrast does not verify source fidelity or full accessibility.</p></div>
}

export function ContextExamples() {
  return <div className="cs03-reference cs03-panel cs03-context">
    <p>Synthetic workflow examples; no clinical thresholds or Data Grid consumer behavior are defined.</p>
    <p>Demo import: <ReferenceBadge type="Flat" color="Success" label="Import complete" /></p>
    <p>Demo validation: <ReferenceBadge type="Flat" color="Warning" label="Needs review" /></p>
    <p>Demo transfer: <ReferenceBadge type="Solid" color="Danger" label="Transfer failed" /></p>
    <p className="cs03-muted">Read each label independently of its color. Badges describe information; actions belong in separately specified controls.</p>
  </div>
}

export function OptionalContent() {
  const configurations = [
    { name: 'A. No icon / No Close', iconStart: false, close: false },
    { name: 'B. Leading icon only', iconStart: true, close: false },
    { name: 'C. Close only', iconStart: false, close: true },
    { name: 'D. Both enabled', iconStart: true, close: true },
  ]
  return <div className="cs03-reference cs03-optional-content">
    <div className="cs03-optional-grid">{configurations.map(({ name, iconStart, close }) => <section className="cs03-option-card" key={name}>
      <h3>{name}</h3>
      <RemovableExample type="Outlined" color="Default" label="Tag Label" iconStart={iconStart} close={close} />
      {iconStart && close && <p className="cs03-close-note">X removes the whole Badge; Restore Badge repeats the example.</p>}
    </section>)}</div>
    <p>Source-backed geometry: 12px icon instance boxes, 16px label line box, 4px adjacent spacing and centered alignment. Width follows visible content; a single-line Medium Badge stays 24px high.</p>
    <p className="cs03-muted">SquareDashed is a neutral, replaceable leading illustration. The trailing X is fixed. Both SVGs are decorative Lucide approximations using currentColor; the X's native button supplies the action and accessible name. A 24-unit viewBox with strokeWidth 2 at 12px gives approximately 1px rendered strokes; original paths and library bindings remain unverified.</p>
  </div>
}

export function ContextIconExamples() {
  const [view, setView] = useState(1)
  return <div className="cs03-reference cs03-panel cs03-icon-context">
    <section className="cs03-filter-context"><h3>Filter context</h3>
      <p>Applied filter information</p><ReferenceBadge type="Outlined" color="Info" label="Demo filter" iconStart leadingIcon={Funnel} />
      <p className="cs03-muted">Funnel reinforces the label. This synthetic Badge defines no criteria logic or clinical meaning.</p>
    </section>
    <section className="cs03-view-context"><h3>View context</h3>
      <p>Selected: Round / Flat / Info. Inactive: Round / Flat / Default.</p>
        <div className="cs03-view-toolbar" role="group" aria-label="View selection">
          {[1, 2, 3].map(number => <button className="cs03-view-choice" type="button" key={number} aria-pressed={view === number} onClick={() => setView(number)}>
            <ReferenceBadge type="Flat" color={view === number ? 'Info' : 'Default'} label={`View ${number}`} />
          </button>)}
        </div>
      <p className="cs03-view-selection">Selected: View {view}</p>
      <p className="cs03-muted">Native buttons own selection and keyboard activation. Their text-only Badge spans remain informational, without leading icons or Close.</p>
    </section>
    <p className="cs03-context-note cs03-muted">Related synthetic illustration, not Figma parity. Existing Data Grid views remain buttons; no consumer migration or application state changes. The generic Playground retains SquareDashed.</p>
  </div>
}

// Shared review harness; the stateless Badge only requests removal via callback.
export function RemovableExample(props: Omit<ComponentProps<typeof ReferenceBadge>, 'onRemove'>) {
  const [removedLabel, setRemovedLabel] = useState<string | null>(null)
  const preview = useRef<HTMLDivElement>(null), restore = useRef<HTMLButtonElement>(null)
  const restoring = useRef(false)
  useLayoutEffect(() => {
    if (removedLabel !== null) restore.current?.focus()
    else if (restoring.current) {
      restoring.current = false
      const target = preview.current?.querySelector<HTMLButtonElement>('button') ?? preview.current
      target?.focus()
    }
  }, [removedLabel])
  return <div className="cs03-removable-example">
    <div className="cs03-example-preview" ref={preview} role="group" aria-label="Badge preview" tabIndex={-1}>
      {removedLabel === null && <ReferenceBadge {...props} onRemove={() => setRemovedLabel(props.label)} />}
    </div>
    <p className="cs03-removal-status" role="status">{removedLabel !== null ? `Removed ${removedLabel}.` : ''}</p>
    {removedLabel !== null && <button className="cs03-demo-button" ref={restore} type="button" onClick={() => { restoring.current = true; setRemovedLabel(null) }}>Restore Badge</button>}
  </div>
}

export function RemovableGroup() {
  const examples = [
    { id: 'review', label: 'Needs review', type: 'Flat', color: 'Warning' },
    { id: 'complete', label: 'Import complete', type: 'Flat', color: 'Success' },
    { id: 'transfer', label: 'Transfer failed', type: 'Solid', color: 'Danger' },
  ] as const
  const [items, setItems] = useState<readonly typeof examples[number][]>(examples)
  const [message, setMessage] = useState('')
  const list = useRef<HTMLUListElement>(null), reset = useRef<HTMLButtonElement>(null)
  const focusAfterRemoval = useRef<string | null | undefined>(undefined)
  useLayoutEffect(() => {
    if (focusAfterRemoval.current === undefined) return
    const next = focusAfterRemoval.current
    focusAfterRemoval.current = undefined
    const button = next ? list.current?.querySelector<HTMLButtonElement>(`[data-demo-id="${next}"] button`) : null
    const target = button ?? reset.current
    target?.focus()
  }, [items])
  return <div className="cs03-reference cs03-panel cs03-removable-group">
    <p>Synthetic removable Badge group. X removes only its Badge; no Data Grid state changes.</p>
    <ul className="cs03-badge-list" ref={list}>{items.map(item => <li key={item.id} data-demo-id={item.id}>
      <ReferenceBadge type={item.type} color={item.color} label={item.label} close onRemove={() => {
        const index = items.findIndex(candidate => candidate.id === item.id)
        const remaining = items.filter(candidate => candidate.id !== item.id)
        focusAfterRemoval.current = remaining[Math.min(index, remaining.length - 1)]?.id ?? null
        setItems(remaining)
        setMessage(`Removed ${item.label}. ${remaining.length} remaining.`)
      }} />
    </li>)}</ul>
    {items.length === 0 && <p>All demo Badges removed.</p>}
    <p className="cs03-removal-status" role="status">{message}</p>
    <button className="cs03-demo-button" ref={reset} type="button" onClick={() => { focusAfterRemoval.current = undefined; setItems(examples); setMessage('Restored all three demo Badges.') }}>Reset Badges</button>
    <p className="cs03-muted">Focus moves to the next removal button, the previous one at the end, or Reset when none remain. Removal is designer-approved, not verified Figma prototype behavior.</p>
  </div>
}
