import { useEffect, useState } from 'react'
import { PrototypeShell } from '../prototype-system/shell/PrototypeShell'
import { defaultHostMode } from '../prototype-system/host/hostMode'
import { DataGridPrototypePage } from '../prototypes/data-grid/DataGridPrototypePage'
import './app.css'

export default function App() {
  const [route, setRoute] = useState(window.location.hash)
  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return (
    <PrototypeShell hostMode={defaultHostMode}>
      {route === '#/data-grid' ? <DataGridPrototypePage /> : <>
      <section className="introduction" aria-labelledby="page-title">
        <p className="eyebrow">Design review workspace</p>
        <h1 id="page-title">ZoBlocks Prototypes</h1>
        <p className="description">Interactive design prototypes for reviewing proposed ZoBlocks behavior before production engineering.</p>
      </section>
      <section aria-labelledby="prototypes-title">
        <h2 id="prototypes-title">Prototype explorations</h2>
        <a className="prototype-card prototype-card-link" href="#/data-grid" aria-labelledby="grid-title">
          <div className="card-heading">
            <h3 id="grid-title">Data Grid</h3>
            <span className="status">In progress</span>
          </div>
          <p className="card-description">Toolbar &amp; Criteria Area · Batch 1</p>
          <dl className="prototype-details">
            <div><dt>Status</dt><dd>In progress</dd></div>
            <div><dt>Prototype</dt><dd>05A / 05B available</dd></div>
          </dl>
        </a>
      </section>
      </>}
    </PrototypeShell>
  )
}
