import { useLayoutEffect, useRef, useState } from 'react'
import { Filter } from 'lucide-react'
import { PrototypeIconButton } from '../../src/prototypes/data-grid/ui/PrototypeIconButton'

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
    <div><p className="cs01-muted">Ghost Focused · schematic enlarged 6×, not source artwork. Dashed/dotted slot and glyph-box guides are construction only. Numbered leaders terminate on each stated feature.</p><ol className="cs01-legend"><li>Root: 24 × 24px interactive button, Square, 6px corner radius.</li><li>Internal padding: 4px on every side.</li><li>Content slot: 16 × 16px.</li><li>Filter glyph box: approximately 14 × 14px, centered. Lucide art is approximate.</li><li>Focus: solid white 2px inner shadow and neutral 4px outer shadow, hsl(216 15% 34%). Background uses bg/primary-hover; no extra outline.</li><li>Accessible name: “Filter” is supplied to aria-label by the label property; tooltip is supplemental.</li></ol></div>
  </div>
}

export function VariantsTable() {
  const rows = [
    ['Shape', 'Small Square; Sort Editor Delete Sort is Square', 'Simple Filter delete is Figma-specified Round, reference-only'],
    ['Type', 'Ghost, Ghost-primary', 'Primary, Secondary, Danger'],
    ['Size', 'Small: root 24, slot 16, padding 4, radius 6px', 'Medium: root 30, slot 18, padding 6, radius/lg; Large: root 40, slot 20, padding 10, radius/xl'],
    ['State', 'Default, native hover, disabled behavior, real keyboard layered focus', 'Brand-disabled color withheld; Ghost-primary outer focus binding unverified'],
  ]
  return <div className="dg-page cs01-reference"><table><caption>Implemented scope and deferred source variants</caption><thead><tr><th scope="col">Dimension</th><th scope="col">Coded in this pilot</th><th scope="col">Reference only</th></tr></thead><tbody>{rows.map(([dimension, coded, reference]) => <tr key={dimension}><th scope="row">{dimension}</th><td>{coded}</td><td>{reference}</td></tr>)}</tbody></table></div>
}

export function TokensTable() {
  const rows = [
    ['Root 24px; slot 16px; padding 4px', 'Verified designer-supplied CS-01 measurements'],
    ['Radius 6px', 'Approved Oxygen-local radius/md; reference mode only'],
    ['Filter SVG box 14px', 'Approximate source artwork size; painted SVG geometry and stroke unverified'],
    ['icon/primary → --dg-secondary, #4A5565', 'Ghost Default/Hover/Focused; supplied binding, provisional number'],
    ['icon/disabled → --dg-disabled, #99A1AF', 'Ghost Disabled; supplied binding, provisional number'],
    ['icon/brand-primary → --dg-primary, #1447F6', 'Ghost-primary Default/Hover/Focused; supplied binding, provisional number'],
    ['icon/brand-disabled → value unavailable', 'Ghost-primary Disabled color specimen withheld; not visually accepted'],
    ['bg/primary-hover → --dg-level-one, #F2F3F5', 'Ghost Hover/Focused; supplied binding, provisional number'],
    ['bg/brand-primary-hover → #E2EEFE', 'Supplied state binding + read-only foundations inventory; not direct variant inspection'],
    ['Default/Disabled surfaces → transparent', 'Both Types; supplied state matrix'],
    ['Neutral pressed → --dg-subtle, #EAECF0', 'Existing prototype behavior; provisional'],
    ['Ghost-primary pressed → #D5E5FF', 'Existing prototype behavior; provisional, separate from source states'],
    ['Ghost Focused → white 2px + hsl(216 15% 34%) 4px', 'Source-inspected values supplied by designer; solid shadows, no third ring'],
    ['Ghost-primary Focused → white 2px + #155DFC 4px', 'Designer-directed layered adaptation from Primary bg/brand-solid; specific Ghost-primary outer binding remains provisional'],
    ['Forced-colors focus → solid 2px Highlight outline', 'Browser accessibility fallback; not Figma artwork'],
  ]
  return <div className="dg-page cs01-reference"><table><caption>Designer-workspace mappings, not production tokens</caption><thead><tr><th scope="col">Reference value / mapping</th><th scope="col">Source and status</th></tr></thead><tbody>{rows.map(([value, status]) => <tr key={value}><th scope="row">{value}</th><td>{status}</td></tr>)}</tbody></table></div>
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
  const rows: [keyof Measurements, string, string][] = [['root', 'Root', '24 × 24px'], ['slot', 'Slot', '16 × 16px'], ['padding', 'Padding', '4px'], ['radius', 'Radius / md', '6px'], ['glyph', 'Filter glyph box', '14 × 14px (approximate art)']]
  return <div className="dg-page cs01-reference cs01-panel">
    <div ref={anchor}><PrototypeIconButton referenceType="ghost" referenceGlyphSize={14} icon={Filter} label="Geometry example Filter" tooltip={false} /></div>
    <table><caption>Source measurements and this browser’s rendered result</caption><thead><tr><th scope="col">Aspect</th><th scope="col">Designer-supplied evidence</th><th scope="col">Rendered now</th></tr></thead><tbody>{rows.map(([key, name, evidence]) => <tr key={key}><th scope="row">{name}</th><td>{evidence}</td><td>{actual?.[key] ?? 'Awaiting browser measurement'}</td></tr>)}</tbody></table>
    <p className="cs01-muted">Rendered geometry is a local measurement, not a touch-target or painted-art certification.</p>
  </div>
}
