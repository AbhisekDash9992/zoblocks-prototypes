import { useLayoutEffect, useRef, useState } from 'react'
import { Filter } from 'lucide-react'
import { PrototypeIconButton } from '../../src/prototypes/data-grid/ui/PrototypeIconButton'
import { TokenTable, type TokenRow } from './ReferenceTokens'

export function Anatomy() {
  // Source-relative geometry at 6×: root 144, padding 24, slot 96, glyph box 84.
  const callouts = [
    { number: 1, feature: 'root', marker: [24, 124], anchor: [148, 124], points: '38,124 148,124' },
    { number: 2, feature: 'padding', marker: [24, 48], anchor: [220, 92], points: '38,48 110,48 110,92 220,92' },
    { number: 3, feature: 'slot', marker: [24, 204], anchor: [172, 178], points: '38,204 110,204 110,178 172,178' },
    { number: 4, feature: 'glyph', marker: [416, 150], anchor: [262, 150], points: '402,150 262,150' },
    { number: 5, feature: 'focus', marker: [416, 48], anchor: [244, 60], points: '402,48 330,48 330,60 244,60' },
    { number: 6, feature: 'name', marker: [416, 292], anchor: [292, 280], points: '402,292 350,292 350,280 292,280' },
  ]
  return <div className="dg-page cs01-reference cs01-panel cs01-anatomy">
    <svg className="cs01-anatomy-diagram" viewBox="0 0 440 330" aria-hidden="true">
      <rect className="cs01-anatomy-focus-outer" x="124" y="56" width="192" height="192" rx="60" />
      <rect className="cs01-anatomy-focus-inner" x="136" y="68" width="168" height="168" rx="48" />
      <rect className="cs01-anatomy-root" x="148" y="80" width="144" height="144" rx="36" />
      <rect className="cs01-anatomy-slot" x="172" y="104" width="96" height="96" />
      <rect className="cs01-anatomy-glyph-box" x="178" y="110" width="84" height="84" />
      <Filter className="cs01-anatomy-glyph" x="178" y="110" width="84" height="84" />
      <rect className="cs01-anatomy-name" x="148" y="267" width="144" height="26" rx="4" />
      <text className="cs01-anatomy-label" x="220" y="284" textAnchor="middle">aria-label: Filter</text>
      {callouts.map(({ number, feature, marker, anchor, points }) => <g className="cs01-callout" data-feature={feature} key={number}>
        <polyline className="cs01-leader" points={points} vectorEffect="non-scaling-stroke" />
        <circle className="cs01-anchor" cx={anchor[0]} cy={anchor[1]} r="2.5" />
        <circle className="cs01-number-marker" cx={marker[0]} cy={marker[1]} r="14" />
        <text className="cs01-number" x={marker[0]} y={marker[1]} textAnchor="middle" dominantBaseline="central">{number}</text>
      </g>)}
    </svg>
    <div><p className="cs01-muted">Ghost Focused · schematic enlarged 6×, not source artwork. Dashed/dotted slot and glyph-box guides are construction only. Numbered leaders terminate on each stated feature.</p><ol className="cs01-legend"><li><strong>Root:</strong> 24 × 24px interactive button, Square, 6px corner radius.</li><li><strong>Internal padding:</strong> 4px on every side.</li><li><strong>Content slot:</strong> 16 × 16px.</li><li><strong>Exported immediate icon instance:</strong> 14 × 14px. The centered Filter SVG uses a 14px box; Lucide artwork and stroke are approximate.</li><li><strong>Focus:</strong> solid white 2px inner shadow and neutral #4A5565 4px outer shadow. Background uses bg/primary-hover; no extra outline.</li><li><strong>Accessible name:</strong> “Filter” is supplied to aria-label by the label property; tooltip is supplemental.</li></ol></div>
  </div>
}

export function VariantsTable() {
  const rows = [
    ['Shape', 'Small Square; Sort Editor Delete Sort is Square', 'Simple Filter delete is Figma-specified Round, reference-only'],
    ['Type', 'Ghost, Ghost-primary', 'Primary, Secondary, Danger'],
    ['Size', 'Small (see Geometry)', 'Medium: root 30, slot 18, padding 6, radius/lg; Large: root 40, slot 20, padding 10, radius/xl'],
    ['State', 'Default, native hover, disabled behavior, real keyboard layered focus', 'Pressed feedback remains provisional'],
  ]
  return <div className="dg-page cs01-reference"><table><caption>Implemented scope and deferred source variants</caption><thead><tr><th scope="col">Dimension</th><th scope="col">Coded in this pilot</th><th scope="col">Reference only</th></tr></thead><tbody>{rows.map(([dimension, coded, reference]) => <tr key={dimension}><th scope="row">{dimension}</th><td>{coded}</td><td>{reference}</td></tr>)}</tbody></table></div>
}

export function TokensTable() {
  const rows: TokenRow[] = [
    ['Ghost icon', 'icon/primary', 'gray/900', '#101828', 'A'],
    ['Ghost disabled icon', 'icon/disabled', 'gray/400', '#99A1AF', 'A'],
    ['Ghost-primary icon', 'icon/brand-primary', 'blue/700', '#1447E6', 'A'],
    ['Ghost-primary disabled icon', 'icon/brand-disabled', 'blue/300', '#8EC5FF', 'A'],
    ['Ghost hover / focus background', 'bg/primary-hover', 'gray/100', '#F2F3F5', 'A'],
    ['Ghost-primary hover / focus background', 'bg/brand-primary-hover', 'blue/100', '#E2EEFE', 'A'],
    ['Rest / disabled background', null, null, 'Transparent; no border or shadow', 'D'],
    ['Focus inner layer', null, 'white', '#FFFFFF', 'C'],
    ['Ghost focus outer layer', null, 'gray/600', '#4A5565', 'C'],
    ['Ghost-primary focus outer layer', null, 'blue/600', '#155DFC', 'C'],
    ['Ghost pressed background', null, 'gray/200', '#EAECF0', 'C'],
    ['Ghost-primary pressed background', null, null, '#D5E5FF', 'D'],
    ['Forced-colors focus', null, null, 'System Highlight; 2px solid outline', 'D'],
    ['Button motion', null, null, 'No local transition', 'D'],
    ['Docs Boolean capsule', null, null, 'Transform 160ms ease-out; none with reduced motion', 'D'],
  ]
  return <div className="dg-page cs01-reference"><TokenTable caption="Icon Button color and interaction references" rows={rows} />
    <p className="cs01-muted">Six component mappings are established by the accepted CS-01 evidence. Focus appearance is also established: zero offset/blur, white 2px inner and intent 4px outer layers; their semantic effect names remain unresolved. Pressed feedback is provisional. The button has no visible text; typography belongs to its separately specified Tooltip.</p>
  </div>
}

type Measurements = { root: string; slot: string; padding: string; radius: string; glyph: string }
export function Geometry() {
  const anchor = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState<Measurements | null>(null)
  useLayoutEffect(() => {
    const button = anchor.current?.querySelector('button')
    const slot = button?.querySelector('.cs01-icon-slot')
    const glyph = slot?.querySelector('svg')
    if (!button || !slot || !glyph) return
    const dimensions = (element: Element) => { const bounds = element.getBoundingClientRect(); return `${bounds.width} × ${bounds.height}px` }
    const measure = () => { const style = getComputedStyle(button); setActual({ root: dimensions(button), slot: dimensions(slot), padding: style.padding, radius: style.borderRadius, glyph: dimensions(glyph) }) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(button)
    return () => observer.disconnect()
  }, [])
  const rows: [keyof Measurements, string, string][] = [['root', 'Root', '24 × 24px; space/300 matching size (B)'], ['slot', 'Implemented icon slot', '16 × 16px; space/200 matching size (B)'], ['padding', 'Padding', 'space/50 = 4px (B)'], ['radius', 'Radius / md', 'radius/md = 6px (A)'], ['glyph', 'Filter SVG box', '14 × 14px immediate instance; local sizing literal (D); artwork approximate']]
  return <div className="dg-page cs01-reference cs01-panel">
    <div ref={anchor}><PrototypeIconButton referenceType="ghost" referenceGlyphSize={14} icon={Filter} label="Geometry example Filter" tooltip={false} /></div>
    <table><caption>Source measurements and this browser’s rendered result</caption><thead><tr><th scope="col">Aspect</th><th scope="col">Designer-supplied evidence</th><th scope="col">Rendered now</th></tr></thead><tbody>{rows.map(([key, name, evidence]) => <tr key={key}><th scope="row">{name}</th><td>{evidence}</td><td>{actual?.[key] ?? <span className="zw-docs-status-pending">Awaiting browser measurement</span>}</td></tr>)}</tbody></table>
    <p className="cs01-muted">Rendered geometry is a local measurement, not a touch-target or painted-art certification.</p>
  </div>
}
