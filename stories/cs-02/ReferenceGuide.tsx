import { useId } from 'react'
import { TokenTable, type TokenRow } from '../cs-01/ReferenceTokens'

export function Anatomy() {
  const title = useId(), description = useId(), shadow = useId()
  // Verified 64 × 28px example at 4×; guides and callouts are annotations.
  const callouts = [
    { number: 1, feature: 'surface', marker: [24, 160], anchor: [92, 160], points: '38,160 92,160' },
    { number: 2, feature: 'padding', marker: [24, 48], anchor: [220, 112], points: '38,48 70,48 70,88 220,88 220,112' },
    { number: 3, feature: 'label', marker: [416, 160], anchor: [308, 160], points: '402,160 308,160' },
    { number: 4, feature: 'shadow', marker: [416, 276], anchor: [260, 220], points: '402,276 376,276 376,220 260,220' },
  ]
  return <div className="dg-page cs02-reference cs02-anatomy">
    <svg className="cs02-anatomy-diagram" viewBox="0 0 440 330" role="img" aria-labelledby={`${title} ${description}`}>
      <title id={title}>Label-only Tooltip anatomy, enlarged schematic</title>
      <desc id={description}>One rounded container with one text child. Four numbered callouts identify the surface, padding, label line box and shadow. Guides and callouts are annotations, not extra Figma children.</desc>
      <defs><filter id={shadow} x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#18181b" floodOpacity="0.05" /></filter></defs>
      <rect className="cs02-anatomy-root" x="92" y="104" width="256" height="112" rx="32" fill="#101828" filter={`url(#${shadow})`} />
      <rect className="cs02-label-guide" x="132" y="120" width="176" height="80" />
      <text x="220" y="160" textAnchor="middle" dominantBaseline="central" fill="white" fontFamily="DM Sans, sans-serif" fontSize="56" fontWeight="400">Tooltip</text>
      {callouts.map(({ number, feature, marker, anchor, points }) => <g className="cs02-callout" data-feature={feature} key={number}>
        <polyline className="cs02-leader" points={points} vectorEffect="non-scaling-stroke" />
        <circle className="cs02-anchor" cx={anchor[0]} cy={anchor[1]} r="2.5" />
        <circle className="cs02-number-marker" cx={marker[0]} cy={marker[1]} r="14" />
        <text className="cs02-number" x={marker[0]} y={marker[1]} textAnchor="middle" dominantBaseline="central">{number}</text>
      </g>)}
    </svg>
    <div><p className="cs02-muted">Enlarged 4× schematic of the supplied 64 × 28px Hug example. Four visual features, one TEXT child; dashed line-box guides are construction only.</p><ol className="cs02-legend">
      <li><strong>Container / surface:</strong> #101828, Hug content, 8px radius.</li>
      <li><strong>Padding:</strong> 4px vertical and 10px horizontal. The leader ends inside the top padding band.</li>
      <li><strong>Label:</strong> one TEXT child, white DM Sans Regular, 14px / 20px. The leader ends at the right edge of its line box. No shortcut child.</li>
      <li><strong>Shadow / elevation:</strong> 0 1px 2px rgb(24 24 27 / 5%). The endpoint marks the shadow below the surface.</li>
    </ol></div>
  </div>
}

export function GeometryTokens() {
  const rows: TokenRow[] = [
    ['Background', 'bg/inverse', 'gray/900', '#101828', 'B'],
    ['Text', 'text/on-dark', 'white', '#FFFFFF', 'B'],
    ['Font family', 'font/family/DM Sans', null, 'DM Sans', 'B'],
    ['Font weight', 'font/weight/regular', null, 'Regular; CSS 400', 'B'],
    ['Font size', 'font/size/200', null, '14; rendered 14px', 'B'],
    ['Line height', 'line-height/20', null, '20; rendered 20px', 'B'],
    ['Vertical padding', 'space/50', null, '4px', 'B'],
    ['Horizontal padding', 'space/125', null, '10px', 'B'],
    ['Corner radius', 'radius/lg', null, '8px', 'B'],
    ['Elevation (named style)', 'shadow/xs', null, '0 1px 2px; #18181B at 5%; spread 0', 'B'],
    ['Border / icon', null, null, 'None; one TEXT child', 'D'],
    ['Positioning', null, null, '6px trigger gap; 8px feasible viewport gutter', 'D'],
    ['Motion', null, null, 'No local Tooltip transition', 'D'],
  ]
  return <div className="dg-page cs02-reference"><TokenTable caption="Verified geometry and values — existing token mappings proposed for Tooltip" rows={rows} />
    <p className="cs02-muted">Source node 317:890: one TEXT child, Hug example 64 × 28px. The measured values are source-backed; token/style names above are role-appropriate reference mappings, not proof of node alias bindings. The one-child source's 10px item-spacing property does not establish a shortcut slot.</p></div>
}

export function ShortcutTokens() {
  const rows: TokenRow[] = [
    ['Background', null, null, 'Transparent', 'D'],
    ['Text', null, 'gray/200', '#EAECF0', 'C'],
    ['Border color', null, 'gray/500', '#6A7282', 'C'],
    ['Border width / vertical padding', null, null, '1px / 1px', 'D'],
    ['Height / minimum width', 'space/250', null, '20px', 'B'],
    ['Horizontal padding', 'space/75', null, '6px', 'B'],
    ['Label gap', 'space/150', null, '12px', 'B'],
    ['Corner radius', 'radius/sm', null, '4px', 'B'],
    ['Font family', 'font/family/DM Sans', null, 'DM Sans', 'B'],
    ['Font weight', 'font/weight/medium', null, 'Medium; CSS 500', 'B'],
    ['Font size', 'font/size/100', null, '12; rendered 12px', 'B'],
    ['Line height', 'line-height/16', null, '16; rendered 16px', 'B'],
    ['Shadow / motion', null, null, 'None', 'D'],
    ['Future Kbd semantic role', null, null, 'Candidate only; no token created', 'E'],
  ]
  return <div className="dg-page cs02-reference"><TokenTable caption="Outlined Kbd — optional contextual proposal, separate from Tooltip source" rows={rows} />
    <p className="cs02-muted">A noninteractive span, not a source variant or production Kbd component. Primitive reuse does not select dark-theme text/border semantics for a Tooltip shown in a light application.</p></div>
}
