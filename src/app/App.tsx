import { PrototypeShell } from '../prototype-system/shell/PrototypeShell'
import { defaultHostMode } from '../prototype-system/host/hostMode'

export default function App() {
  return (
    <PrototypeShell hostMode={defaultHostMode}>
      <section className="introduction" aria-labelledby="page-title">
        <p className="eyebrow">Design review workspace</p>
        <h1 id="page-title">ZoBlocks Prototypes</h1>
        <p className="description">Interactive design prototypes for reviewing proposed ZoBlocks behavior before production engineering.</p>
      </section>
      <section aria-labelledby="prototypes-title">
        <h2 id="prototypes-title">Prototype explorations</h2>
        <article className="prototype-card" aria-labelledby="grid-title">
          <div className="card-heading">
            <h3 id="grid-title">Data Grid</h3>
            <span className="status">Design exploration</span>
          </div>
          <p className="card-description">Filters, Search &amp; Views</p>
          <dl className="prototype-details">
            <div><dt>Status</dt><dd>Design exploration</dd></div>
            <div><dt>Prototype</dt><dd>Not started</dd></div>
          </dl>
        </article>
      </section>
    </PrototypeShell>
  )
}
