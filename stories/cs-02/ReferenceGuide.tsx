import { useId } from 'react'

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
      <li>Container / surface: #101828, Hug content, 8px radius.</li>
      <li>Padding: 4px vertical and 10px horizontal. The leader ends inside the top padding band.</li>
      <li>Label: one TEXT child, white DM Sans Regular, 14px / 20px. The leader ends at the right edge of its line box. No shortcut child.</li>
      <li>Shadow / elevation: 0 1px 2px rgb(24 24 27 / 5%). The endpoint marks the shadow below the surface.</li>
    </ol></div>
  </div>
}

export function GeometryTokens() {
  const rows = [
    ['Source', 'Oxygen Design System → ❖ Tooltip, node 317:890'],
    ['Structure', 'Standalone component; one TEXT child'],
    ['Sizing', 'Hug; supplied example 64 × 28px (not a fixed width)'],
    ['Padding', '4px vertical / 10px horizontal'],
    ['Radius', '8px'],
    ['Background / text', '#101828 / #FFFFFF'],
    ['Typography', 'DM Sans Regular (400), 14px / 20px'],
    ['Shadow', '0 1px 2px rgb(24 24 27 / 5%)'],
  ]
  return <div className="dg-page cs02-reference"><table><caption>Verified geometry and values supplied by the designer</caption><thead><tr><th scope="col">Property</th><th scope="col">Reference</th></tr></thead><tbody>{rows.map(([property, value]) => <tr key={property}><th scope="row">{property}</th><td>{value}</td></tr>)}</tbody></table></div>
}
