import type { ReactNode } from 'react'
import type { HostMode } from '../host/hostMode'

type PrototypeShellProps = { children: ReactNode; hostMode: HostMode }

export function PrototypeShell({ children, hostMode }: PrototypeShellProps) {
  return (
    <div className="prototype-shell" data-host-mode={hostMode}>
      <header className="shell-header">
        <span className="wordmark">ZoBlocks</span>
        <span className="shell-label">Prototype workspace</span>
      </header>
      <main>{children}</main>
      <footer>Prototype code — not production ZoBlocks implementation.</footer>
    </div>
  )
}
