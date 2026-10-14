import { useId } from 'react'

export function Anatomy() {
  const title = useId(), description = useId()
  return <div className="dg-page cs02-reference cs02-anatomy">
    <svg viewBox="0 0 320 180" role="img" aria-labelledby={`${title} ${description}`}>
      <title id={title}>Label-only Tooltip anatomy, enlarged schematic</title>
      <desc id={description}>One dark rounded container with one text child. Number 1 marks the container; number 2 marks the label. Dashed lines show padding guides, not extra children.</desc>
      <rect x="64" y="48" width="192" height="84" rx="24" fill="#101828" />
      <rect x="94" y="60" width="132" height="60" fill="none" stroke="white" strokeDasharray="3 3" />
      <text x="160" y="101" textAnchor="middle" fill="white" fontFamily="DM Sans, sans-serif" fontSize="42">Filter</text>
      <path d="M36 48H64 M284 101H226" fill="none" stroke="#475467" />
      <text x="20" y="52" fill="#101828">1</text><text x="294" y="105" fill="#101828">2</text>
    </svg>
    <ol className="cs02-legend"><li>Container: Hug content, 4px vertical / 10px horizontal padding, 8px radius and subtle shadow.</li><li>One TEXT child: meaningful label, white DM Sans Regular, 14px / 20px. No verified shortcut child.</li></ol>
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
