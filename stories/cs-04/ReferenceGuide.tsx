import { useId, useRef, useState } from 'react'
import { ArrowRight, CircleDot, Download, Plus } from 'lucide-react'
import { Button, type ButtonShape, type ButtonSize, type ButtonVariant } from '../../src/oxygen-button/Button'

const variants: ButtonVariant[] = ['primary', 'secondary', 'danger', 'text-primary', 'text-secondary']
const shapes: ButtonShape[] = ['square', 'round']
const sizes: ButtonSize[] = ['large', 'medium', 'small']
const states = ['default', 'hover', 'disabled', 'focus-visible'] as const
const title = (value: string) => value.replaceAll('-', ' ').replace(/^./, char => char.toUpperCase())

export function StateMatrix() {
  return <div className="cs04-matrix"><p>2 shapes × 5 Types × 3 sizes × 4 states = <strong>120 specimens</strong>. Text only; optional icons are independent content.</p>
    <p>Hover and Focused are static visual references, excluded from Tab order. Disabled uses the native attribute. Try live states in Playground or Behavior examples.</p>
    {shapes.flatMap(shape => variants.map(variant => <section className="cs04-group" key={`${shape}-${variant}`}>
      <h3>{title(shape)} · {title(variant)}</h3>
      <div className="cs04-scroll" role="region" aria-label={`${title(shape)} ${title(variant)} state comparison`} tabIndex={0}>
        <table className="cs04-state-table"><caption>{title(shape)} / {title(variant)} — 12 states</caption><thead><tr><th scope="col">Size</th>{states.map(state => <th scope="col" key={state}>{state === 'focus-visible' ? 'Focused' : title(state)}</th>)}</tr></thead>
          <tbody>{sizes.map(size => <tr key={size}><th scope="row">{title(size)}</th>{states.map(state => <td key={state} data-cs04-case={`${shape}/${variant}/${size}/${state}`} data-cs04-reference={state}>
            <Button variant={variant} shape={shape} size={size} label="Review item" disabled={state === 'disabled'} tabIndex={-1} />
          </td>)}</tr>)}</tbody></table>
      </div>
    </section>))}
  </div>
}

export function IconConfigurations() {
  return <div className="cs04-icons"><p>All four content configurations at every size and shape. Adjacent gaps disappear with omitted icons. CircleDot is an illustrative replacement; original source paths are unavailable.</p>
    {shapes.flatMap(shape => sizes.map(size => <section className="cs04-group" key={`${shape}-${size}`}><h3>{title(shape)} · {title(size)}</h3>
      <div className="cs04-icon-grid">{['none', 'leading', 'trailing', 'both'].map(config => <div key={config} data-cs04-icons={`${shape}/${size}/${config}`}><h4>{title(config)}</h4>
        <Button shape={shape} size={size} label="Review item" leadingIcon={config === 'leading' || config === 'both' ? <CircleDot /> : undefined} trailingIcon={config === 'trailing' || config === 'both' ? <CircleDot /> : undefined} />
      </div>)}</div>
    </section>))}
    <section className="cs04-group"><h3>Separate disabled text and icon roles</h3><div className="cs04-actions">
      {(['primary', 'danger'] as const).map(variant => <Button key={variant} variant={variant} label={`Disabled ${variant}`} disabled leadingIcon={<CircleDot />} trailingIcon={<CircleDot />} />)}
    </div><p>Text: 50% white. Icons: 80% white. No whole-button opacity.</p></section>
    <section className="cs04-group"><h3>Replaceable decorative artwork</h3><div className="cs04-actions">
      <Button label="Add item" leadingIcon={<Plus />} /><Button label="Continue" trailingIcon={<ArrowRight />} variant="secondary" />
      <Button label="Export sample" leadingIcon={<Download />} trailingIcon={<ArrowRight />} variant="text-primary" />
    </div><p>Visible labels name actions. Icons add no separate action or tab stop.</p></section>
  </div>
}

export function Behavior() {
  const first = useRef<HTMLButtonElement>(null)
  const [count, setCount] = useState(0)
  const [submissions, setSubmissions] = useState(0)
  return <div className="cs04-panel cs04-behavior"><h3>Native activation and focus</h3>
    <p>Tab through enabled actions. Enter, Space and pointer clicks increment the same counter. Native disabled actions are skipped.</p>
    <div className="cs04-actions">{variants.map((variant, index) => <Button key={variant} ref={index === 0 ? first : undefined} variant={variant} label={`Try ${title(variant)}`} onClick={() => setCount(value => value + 1)} leadingIcon={<CircleDot />} />)}
      <Button label="Unavailable action" disabled onClick={() => setCount(value => value + 100)} trailingIcon={<CircleDot />} />
      <Button variant="secondary" label="Focus first action" onClick={() => first.current?.focus()} />
    </div><p role="status">Activations: {count}</p>
    <form onSubmit={event => { event.preventDefault(); setSubmissions(value => value + 1) }}><h3>Explicit form behavior</h3>
      <p>The default Button is type="button" inside a form. Only the explicit submit action submits this synthetic example.</p>
      <div className="cs04-actions"><Button variant="secondary" label="Default type action" onClick={() => setCount(value => value + 1)} /><Button type="submit" label="Submit sample" /></div>
      <p role="status">Submissions: {submissions}</p>
    </form>
  </div>
}

export function GeometryTable() {
  return <div className="zw-docs-table cs04-scroll" role="region" aria-label="Button geometry" tabIndex={0}><table><caption>Single-line geometry, all five Types</caption><thead><tr><th scope="col">Size</th><th scope="col">Height Square / Round</th><th scope="col">Padding T/B × L/R</th><th scope="col">Gap / icon</th><th scope="col">Square radius</th><th scope="col">Font size / line</th></tr></thead><tbody>
    <tr><th scope="row">Large</th><td>40 / 36px</td><td>8 × 16px; Round 6 × 16px</td><td>8 / 18px</td><td>10px</td><td>16 / 24px</td></tr>
    <tr><th scope="row">Medium</th><td>30 / 30px</td><td>4 × 12px</td><td>6 / 16px</td><td>8px</td><td>14 / 22px</td></tr>
    <tr><th scope="row">Small</th><td>24 / 24px</td><td>4 × 10px</td><td>4 / 14px</td><td>6px</td><td>12 / 16px</td></tr>
  </tbody></table></div>
}

export function Anatomy() {
  const titleId = useId(), descriptionId = useId()
  // Source-relative geometry at 5×: height 150, padding 20/60, gap 30,
  // radius 40, line box 110, icons 80. Only the content width is illustrative.
  const callouts = [
    { number: 1, feature: 'surface', marker: [44, 240], anchor: [145, 240], points: '44,240 145,240' },
    { number: 2, feature: 'leading-icon', marker: [180, 44], anchor: [230, 195], points: '180,44 180,110 230,110 230,195' },
    { number: 3, feature: 'label', marker: [420, 44], anchor: [420, 180], points: '420,44 420,180' },
    { number: 4, feature: 'trailing-icon', marker: [660, 44], anchor: [610, 195], points: '660,44 660,110 610,110 610,195' },
    { number: 5, feature: 'padding', marker: [180, 416], anchor: [380, 300], points: '180,416 180,350 380,350 380,300' },
    { number: 6, feature: 'spacing', marker: [660, 416], anchor: [555, 235], points: '660,416 660,350 555,350 555,235' },
    { number: 7, feature: 'radius', marker: [796, 240], anchor: [698.284, 171.716], points: '796,240 752,240 752,171.716 698.284,171.716' },
    { number: 8, feature: 'focus', marker: [796, 416], anchor: [650, 325], points: '796,416 744,416 744,344 650,344 650,325' },
  ]
  return <div className="cs04-anatomy"><section className="cs04-panel cs04-anatomy-panel"><h3>Button anatomy · Medium / Square / Primary / Focused</h3>
    <div className="cs04-anatomy-layout">
      <svg className="cs04-anatomy-diagram" viewBox="0 0 840 460" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>Button anatomy, enlarged Medium / Square / Primary / Focused schematic</title>
        <desc id={descriptionId}>Eight numbered callouts identify the container, leading icon slot, visible label line box, trailing icon slot, padding, adjacent spacing, corner radius and two-layer focus treatment. Geometry is enlarged five times in the drawing coordinates; content width is illustrative. Solid white separates the surface from the outer solid blue focus ring. Dashed text and icon boxes are construction guides. Decorative circles are illustrative shapes, not verified Figma glyph paths. The numbered textual legend provides the measurements.</desc>
        <rect className="cs04-diagram-focus-outer" x="110" y="140" width="620" height="190" rx="60" />
        <rect className="cs04-diagram-focus-inner" x="120" y="150" width="600" height="170" rx="50" />
        <rect className="cs04-diagram-surface" x="130" y="160" width="580" height="150" rx="40" />
        <rect className="cs04-box-guide" data-anatomy-box="leading-icon" x="190" y="195" width="80" height="80" />
        <rect className="cs04-box-guide" data-anatomy-box="label" x="300" y="180" width="240" height="110" />
        <rect className="cs04-box-guide" data-anatomy-box="trailing-icon" x="570" y="195" width="80" height="80" />
        <g className="cs04-diagram-icons" aria-hidden="true">
          <circle cx="230" cy="235" r="23" /><circle className="cs04-diagram-icon-dot" cx="230" cy="235" r="6" />
          <circle cx="610" cy="235" r="23" /><circle className="cs04-diagram-icon-dot" cx="610" cy="235" r="6" />
        </g>
        <text className="cs04-diagram-label" x="420" y="235" dominantBaseline="central" textAnchor="middle">Review</text>
        <path className="cs04-dimension-guide" data-anatomy-dimension="padding" d="M130 210H190 M130 204V216 M190 204V216 M380 290V310 M374 290H386 M374 310H386" />
        <path className="cs04-dimension-guide" data-anatomy-dimension="spacing" d="M270 235H300 M270 229V241 M300 229V241 M540 235H570 M540 229V241 M570 229V241" />
        {callouts.map(({ number, feature, marker, anchor, points }) => <g className="cs04-callout" data-feature={feature} key={number} aria-hidden="true">
          <polyline className="cs04-leader" points={points} vectorEffect="non-scaling-stroke" />
          <circle className="cs04-anchor" cx={anchor[0]} cy={anchor[1]} r="3" />
          <circle className="cs04-number-marker" cx={marker[0]} cy={marker[1]} r="14" />
          <text className="cs04-number" x={marker[0]} y={marker[1]} dominantBaseline="central" textAnchor="middle">{number}</text>
        </g>)}
      </svg>
      <div className="cs04-anatomy-notes"><p>5× source-relative schematic; width is illustrative. It scales to fit the page. Dashed boxes and dimension brackets are annotations, not source child nodes. Decorative circles are illustrative shapes, not verified Figma glyph paths.</p>
        <ol className="cs04-legend" aria-label="Button anatomy legend">
          <li data-feature="surface"><strong>Container / surface:</strong> 30px Medium height; Primary fill #155DFC. The endpoint is inside the surface.</li>
          <li data-feature="leading-icon"><strong>Leading decorative icon slot:</strong> 16 × 16px, vertically centered. The endpoint meets the top of its box.</li>
          <li data-feature="label"><strong>Visible text label / line box:</strong> 14px / 22px, white. The endpoint meets the top of the dashed line box. DM Sans / 500 / zero tracking remain provisional TF-01 reuse.</li>
          <li data-feature="trailing-icon"><strong>Trailing decorative icon slot:</strong> independent 16 × 16px slot. The endpoint meets its top edge; it is not a separate action.</li>
          <li data-feature="padding"><strong>Internal padding:</strong> 4px vertical / 12px horizontal. Brackets show both; the endpoint marks the bottom 4px padding band.</li>
          <li data-feature="spacing"><strong>Adjacent content spacing:</strong> 6px between each present icon and label. The endpoint meets the middle of the right gap bracket.</li>
          <li data-feature="radius"><strong>Corner radius:</strong> Square / Medium 8px. The endpoint lies on the top-right surface arc.</li>
          <li data-feature="focus"><strong>Two-layer focused treatment:</strong> solid 2px white separation, then solid #155DFC extending to 4px from the surface. The endpoint lies in the outer colored band below the button; neither layer is dashed.</li>
        </ol>
      </div>
    </div>
    <div className="cs04-anatomy-actual"><h4>Actual-size specimen · same configuration</h4>
      <div className="cs04-anatomy-specimen" data-cs04-reference="focus-visible"><Button label="Review" leadingIcon={<CircleDot />} trailingIcon={<CircleDot />} tabIndex={-1} /></div>
      <p>The working renderer is secondary to the schematic. CircleDot is illustrative artwork; the schematic width is not a fixed Button width.</p>
    </div>
  </section><GeometryTable /><p>Round radius uses TF-01's 9999px pill sentinel. Long labels wrap and may increase height; this is local resilience behavior, not an inspected multiline design.</p></div>
}

const tokenRows = [
  ['Primary surfaces', '--ox-bg-brand-solid / --ox-bg-brand-solid-hover / --ox-bg-brand-disabled', '#155DFC / #1447E6 / #8EC5FF', 'Verified source values; semantic bindings unresolved.'],
  ['Danger surfaces', '--ox-bg-danger-solid / --ox-bg-danger-solid-hover / --ox-bg-danger-disabled', '#E7000B / #C10007 / #FFC9C9', 'Verified source values; semantic bindings unresolved.'],
  ['Secondary surfaces', '--ox-bg-white / --ox-bg-primary-hover / --ox-bg-disabled-secondary', '#FFFFFF / #F2F3F5 / #F2F3F5', 'Verified source values; semantic bindings unresolved.'],
  ['Text primary surfaces', '--ox-bg-brand-primary-hover / --ox-bg-brand-primary', 'Hover #E2EEFE; Focused #F2F8FF', 'Default/Disabled transparent. Verified values; bindings unresolved.'],
  ['Text secondary surfaces', '--ox-bg-primary-hover', 'Hover/Focused #F2F3F5', 'Default/Disabled transparent. Verified values; bindings unresolved.'],
  ['Solid text / icons', '--ox-text-on-dark / --ox-icon-on-dark', '#FFFFFF / #FFFFFF', 'Text verified. Icon role chosen locally; icon fills absent from digest.'],
  ['Disabled solid text / icons', '--ox-text-on-dark-disabled / --ox-icon-on-dark-disabled', '50% white / 80% white', 'Text verified. Separate icon alpha required by task; not verified component binding.'],
  ['Neutral text / icons', '--ox-text-primary / --ox-icon-primary; --ox-text-disabled / --ox-icon-disabled', '#101828; disabled #99A1AF', 'Text verified; separate icon roles chosen locally.'],
  ['Brand text / icons', '--ox-text-brand-primary / --ox-icon-brand-primary; --ox-text-brand-disabled / --ox-icon-brand-disabled', '#1447E6; disabled #8EC5FF', 'Text verified; separate icon roles chosen locally.'],
  ['Secondary edge', '--ox-border-secondary / --ox-border-primary / --ox-border-disabled', '1px #EAECF0; Hover/Focused #D1D5DC', 'Verified colors and width; inset alignment chosen locally.'],
  ['Focus layers', '--ox-color-blue-600 / --ox-color-red-600 / --ox-color-gray-600 / --ox-color-white', 'Brand #155DFC; Danger #E7000B; Neutral #4A5565; separation #FFFFFF', 'Verified effect values; primitive reuse is not a semantic binding. No TF-01 shadow token is claimed.'],
  ['Secondary default shadow', 'Component-local literal', '0 1px 2px #101828 at 5%', 'Verified source effect. TF-01 shadow/xs has a different color; intentionally not substituted.'],
  ['Padding and gaps', '--ox-space-50 / -75 / -100 / -125 / -150 / -200', '4 / 6 / 8 / 10 / 12 / 16px', 'Verified dimensions; equal-value TF-01 reuse, bindings unresolved.'],
  ['Radii', '--ox-radius-md / -lg / -xl / -full', '6 / 8 / 10 / 9999px', 'Verified dimensions; equal-value TF-01 reuse, bindings unresolved.'],
  ['Typography', '--ox-type-button-large / -medium / -small; --ox-letter-spacing-normal', '16/24; 14/22; 12/16; local zero tracking', 'Size/line verified. DM Sans 500 and tracking reuse TF-01 provisionally; component family, weight and tracking uninspected.'],
] as const

export function Tokens() {
  return <div className="zw-docs-table cs04-scroll" role="region" aria-label="Button token provenance" tabIndex={0}><table className="cs04-token-table"><caption>Light reference mapping and evidence provenance</caption><thead><tr><th scope="col">Role</th><th scope="col">TF-01 consumption</th><th scope="col">Inspected / used value</th><th scope="col">Evidence status</th></tr></thead><tbody>{tokenRows.map(([role, token, value, evidence]) => <tr key={role}><th scope="row">{role}</th><td><code>{token}</code></td><td>{value}</td><td>{evidence}</td></tr>)}</tbody></table></div>
}
