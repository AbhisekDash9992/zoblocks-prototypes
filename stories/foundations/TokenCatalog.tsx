import type { ReactNode } from 'react'
import catalog from '../../src/oxygen-reference-tokens/catalog.json'
import '../../src/oxygen-reference-tokens/tokens.css'
import './oxygen-tokens.css'

function cssName(name: string) {
  return `--ox-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

function Swatch({ value }: { value: string }) {
  return <span className="tf01-swatch" style={{ backgroundColor: value }} aria-hidden="true" />
}

function Table({ caption, headings, children }: { caption: string; headings: string[]; children: ReactNode }) {
  return <div className="tf01-scroll" role="region" aria-label={caption} tabIndex={0}><table>
    <caption>{caption}</caption><thead><tr>{headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
    <tbody>{children}</tbody>
  </table></div>
}

const sections = ['Evidence', 'Primitives', 'Semantics', 'Typography', 'Spacing', 'Effects', 'Usage']

function SemanticPreview({ name, mode, alias }: { name: string; mode: 'light' | 'dark'; alias: string }) {
  const token = cssName(name)
  const alpha = alias.startsWith('FFFFFF@')
  const [family, level] = alias.split('/')
  const primitives: Record<string, Record<string, string>> = catalog.primitives
  const resolved = alias === 'white' ? catalog.specialPrimitives.white.value : alpha ? `#FFFFFF / ${alias.split('@')[1]}` : primitives[family]?.[level] ?? 'Unresolved'
  return <td data-oxygen-mode={mode} className="tf01-mode" data-tf01-semantic={name}>
    <Swatch value={`var(${token})`} /><code>{alias}</code><br /><span>{String(resolved)}</span><br />
    <small>{alpha ? 'Verified direct color and alpha' : 'Verified alias and value'}</small>
  </td>
}

export function TokenCatalog() {
  return <article className="tf01-catalog" data-oxygen-mode="light" aria-label="Oxygen reference token catalog">
    <nav aria-label="Token categories">{sections.map(section => <a key={section} href={`#tf01-${section.toLowerCase()}`}>{section}</a>)}</nav>
    <section id="tf01-evidence" tabIndex={-1}><h2>Evidence and limits</h2>
      <p>Verified means supported by the supplied inspection register or newer native Figma exports, not a live Figma readback or component binding. Native exports take precedence on conflicts. Provisional means a disclosed local representation. Unresolved means no supported value is supplied.</p>
      <p>124 known primitives (121 scale colors plus white, black and transparent) · 87 semantic entries with Light/Dark aliases · 23 raw typography variables · 14 spaces · 7 radii · 12 inspected text styles · 7 shadow records · 5 gradient endpoint pairs.</p>
      <p><strong>Unresolved:</strong> Label composition, nonzero tracking units, advanced text settings, hidden xl shadow layer and gradient directions. No values are fabricated for them.</p>
    </section>
    <section id="tf01-primitives" tabIndex={-1}><h2>Primitive colors</h2>
      <p>124 known primitives from combined evidence: 99 scale colors and three special primitives verified by native exports; 22 brand-1/brand-2 colors preserved from the older register. No independent Dark primitive collection was inspected. CSS names use the <code>--ox-color-</code> prefix.</p>
      {Object.entries(catalog.primitives).map(([family, values]) => <details key={family} open><summary>{family} · 11 verified values</summary>
        <ul className="tf01-palette">{Object.entries(values).map(([level, value]) => <li key={level} data-tf01-primitive={`${family}/${level}`}>
          <Swatch value={`var(${cssName(`color/${family}/${level}`)})`} /><strong>{family}/{level}</strong><span>{value}</span><code>{cssName(`color/${family}/${level}`)}</code>
        </li>)}</ul>
      </details>)}
      <details open><summary>Special primitives · 3 verified entries</summary>
        <ul className="tf01-palette">{[
          ['white', catalog.specialPrimitives.white.value],
          ['black', `gray/950 alias → ${catalog.primitives.gray['950']}`],
          ['transparent', `${catalog.specialPrimitives.transparent.value} / 0% alpha`],
        ].map(([name, value]) => <li key={name} data-tf01-primitive={name}>
          <Swatch value={`var(${cssName(`color/${name}`)})`} /><strong>{name}</strong><span>{value}</span><code>{cssName(`color/${name}`)}</code>
        </li>)}</ul>
      </details>
    </section>
    <section id="tf01-semantics" tabIndex={-1}><h2>Semantic colors · Light and Dark</h2>
      <p>Text and icon roles remain separate. Text/on-dark-disabled is 50% white; icon/on-dark-disabled is 80%. The swatches use the actual mode-scoped CSS aliases.</p>
      <p>White-dependent semantics resolve through the verified white primitive. Black aliases gray/950 (#030712); transparent is literal #000000 at 0% alpha. Matching colors do not prove a component binding or accessible contrast.</p>
      <p>Native source spelling <code>bg/success-disbaled</code> is normalized to the existing public name <code>bg/success-disabled</code> / <code>--ox-bg-success-disabled</code>.</p>
      <p>Native corrections: Light border/brand-primary is blue/600 (#155DFC); Dark icon/danger-primary is red/500 (#FB2C36). Their opposite-mode aliases remain unchanged.</p>
      {['bg', 'text', 'icon', 'border'].map(group => <Table key={group} caption={`${group} semantic tokens`} headings={['Figma / CSS name', 'Light alias / value / status', 'Dark alias / value / status']}>
        {Object.entries(catalog.semantics).filter(([name]) => name.startsWith(`${group}/`)).map(([name, aliases]) => <tr key={name}>
          <th scope="row">{name}<br /><code>{cssName(name)}</code></th>
          <SemanticPreview name={name} mode="light" alias={aliases.light} /><SemanticPreview name={name} mode="dark" alias={aliases.dark} />
        </tr>)}
      </Table>)}
    </section>
    <section id="tf01-typography" tabIndex={-1}><h2>Typography variables and named styles</h2>
      <p>Raw numbers preserve the register without inferred units. Raw weight names are separate from CSS weight interpretation helpers (400 / 500 / 600 / 700). Families list availability in Figma; only the existing bundled DM Sans may be available here, with system fallback. No font is installed or imported by the foundation.</p>
      <Table caption="23 raw typography variables" headings={['Figma name', 'CSS variable', 'Raw value', 'Evidence / interpretation']}>
        {Object.entries(catalog.typography).map(([name, value]) => <tr key={name}><th scope="row">{name}</th><td><code>{cssName(name)}</code></td><td>{value}</td><td>Verified raw value{typeof value === 'number' ? '; unit not asserted by variable cells' : ''}</td></tr>)}
      </Table>
      <Table caption="12 inspected named text styles" headings={['Figma / CSS composition', 'Specimen', 'Properties', 'Basics case selection']}>
        {Object.entries(catalog.textStyles).map(([name, style]) => <tr key={name}><th scope="row">{name}<br /><code>{cssName(`type/${name}`)}</code></th>
          <td><span data-tf01-style={name} style={{ font: `var(${cssName(`type/${name}`)})`, letterSpacing: 0 }}>Oxygen reference</span></td>
          <td>DM Sans · {style.weight} · {style.size}px / {style.lineHeight}px · tracking 0</td><td>{style.caseSelection}; not imposed in CSS</td>
        </tr>)}
      </Table>
      <p>The font shorthands locally assemble equal-valued size/line-height variables; this does not certify those Figma alias bindings. Weight bindings are source-recorded. All 12 inspected Basics panels show no decoration, first/left vertical-trim selection (technical label unknown), list/paragraph spacing 0 and wrap Auto. These are source metadata, not a blanket CSS transform/trim contract. Details and Variable settings remain uninspected.</p>
      <p><strong>Button/medium:</strong> 14px / 22px is a named style composition. There is no verified global <code>line-height/22</code> variable. <strong>Label:</strong> list-only 12/16; family, weight and tracking are unknown, so no runtime Label style is exported. Nonzero raw tracking units remain unresolved.</p>
    </section>
    <section id="tf01-spacing" tabIndex={-1}><h2>Spacing and radius</h2>
      <p>Verified numbers rendered as px for UI layout. Names are identifiers, not their numeric dimensions. radius/full is a 9999 pill sentinel.</p>
      {(['space', 'radius'] as const).map(group => <Table key={group} caption={`${group} scale`} headings={['Figma name', 'CSS variable', 'UI value', 'Specimen']}>
        {Object.entries(catalog[group]).map(([name, value]) => <tr key={name}><th scope="row">{name}</th><td><code>{cssName(name)}</code></td><td>{value}px · verified</td><td>
          <span className={`tf01-${group}-sample`} style={group === 'space' ? { width: `var(${cssName(name)})` } : { borderRadius: `var(${cssName(name)})` }} aria-hidden="true" />
        </td></tr>)}
      </Table>)}
    </section>
    <section id="tf01-effects" tabIndex={-1}><h2>Shadows and gradient endpoints</h2>
      <p>CSS box-shadow represents the inspected visible layers. Figma behind-transparency settings are retained below; browser painting parity is unverified. Named shadows are not evidence of component focus-ring bindings.</p>
      <Table caption="Seven shadow records" headings={['Figma / CSS name', 'Visible layers', 'Preview / evidence']}>
        {Object.entries(catalog.shadows).map(([name, shadow]) => <tr key={name}><th scope="row">{name}<br /><code>{cssName(name)}{shadow.uninspectedHiddenLayer ? '-visible' : ''}</code></th>
          <td>{shadow.layers.map((layer, index) => <p key={index}>Layer {index + 1}: {layer.x} / {layer.y} / {layer.blur} / {layer.spread}px · {layer.color} at {layer.opacity}% · behind transparency: {layer.behindTransparency ? 'Yes' : 'No'}</p>)}</td>
          <td><span className="tf01-shadow-sample" style={{ boxShadow: `var(${cssName(name)}${shadow.uninspectedHiddenLayer ? '-visible' : ''})` }}>Visible layers</span><p>{shadow.uninspectedHiddenLayer ? 'Partial: extra hidden layer uninspected; omitted. Full style unresolved.' : 'Visible parameters verified; CSS representation provisional.'}</p></td>
        </tr>)}
      </Table>
      <Table caption="Five gradient endpoint pairs · no gradient CSS" headings={['Exact Figma name / catalog order', '0% stop', '100% stop', 'Evidence']}>
        {catalog.gradients.map(gradient => <tr key={gradient.order}><th scope="row">{gradient.name} · #{gradient.order}</th>
          {gradient.stops.map((stop, index) => <td key={index}><Swatch value={stop} />{stop}</td>)}<td>Endpoints verified; linear, fill/stops 100% opacity. Angle/direction unknown.</td>
        </tr>)}
      </Table>
      <p>Two distinct source styles are both named Gradient; catalog order disambiguates without renaming them. No directional gradient preview or runtime gradient definition is supplied.</p>
    </section>
    <section id="tf01-usage" tabIndex={-1}><h2>Usage and limitations</h2>
      <pre><code>{`import './src/oxygen-reference-tokens/tokens.css'\n\n<section data-oxygen-mode="light" className="example">…</section>\n\n.example {\n  color: var(--ox-text-primary);\n  background: var(--ox-bg-primary);\n  padding: var(--ox-space-200);\n  font: var(--ox-type-body-medium);\n  letter-spacing: calc(var(--ox-letter-spacing-normal) * 1px);\n}`}</code></pre>
      <p>Opt in with light or dark explicitly; nested mode scopes re-resolve semantic aliases. Import alone applies no rendered styles. White-dependent semantics resolve without consumer overrides; 50% text and 80% icon white alpha values remain separate.</p>
      <p>Use semantic roles before primitives when source intent supports them. Component-to-token bindings, interaction design, contrast, theme readiness and visual parity need separate evidence. Existing CS-01/02/03 and the prototype are unchanged. No CS-04 Button is implemented.</p>
    </section>
  </article>
}
