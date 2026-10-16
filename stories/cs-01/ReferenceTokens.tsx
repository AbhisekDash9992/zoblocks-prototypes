// Documentation only: reference names/values, never global token definitions.
export type TokenRow = readonly [role: string, token: string | null, primitive: string | null, value: string, level: 'A' | 'B' | 'C' | 'D' | 'E']
const levels = { A: 'Confirmed binding', B: 'Proposed mapping', C: 'Primitive only', D: 'Local literal', E: 'Unapproved candidate' }

export function TokenKey() {
  return <details><summary>How to read token references</summary>
    <p>Light-mode values from the 14 October Oxygen inspection register. A matching value alone does not establish a component binding. Local CSS uses resolved values; these tables do not create shared tokens.</p>
    <ul>{Object.entries(levels).map(([key, value]) => <li key={key}><strong>{key}</strong> — {value}{key === 'C' ? '; semantic binding unresolved' : key === 'E' ? '; not created or approved' : ''}.</li>)}</ul>
    <p>Typography variables contain raw numbers or named weights; px and numeric CSS weights describe their local rendering. The named white alias is not independently resolved in the primitive screenshots; #FFFFFF is the rendered value.</p>
  </details>
}

export function TokenTable({ caption, rows, className = '' }: { caption: string; rows: readonly TokenRow[]; className?: string }) {
  return <div className="zw-docs-token-region" role="region" aria-label={caption} tabIndex={0}><table className={`zw-docs-token-table ${className}`}><caption>{caption}</caption>
    <thead><tr><th scope="col">Role</th><th scope="col">Semantic token / variable</th><th scope="col">Primitive</th><th scope="col">Resolved value</th></tr></thead>
    <tbody>{rows.map(([role, token, primitive, value, level]) => <tr key={role}>
      <th scope="row">{role}<small className="zw-docs-binding">{level} · {levels[level]}</small></th>
      <td>{token ? <code className="zw-docs-token">{token}</code> : '—'}</td>
      <td>{primitive ? <code className="zw-docs-token">{primitive}</code> : '—'}</td>
      <td>{/^#[\da-f]{6}$/i.test(value) ? <span className="zw-docs-hex">{value}</span> : value}</td>
    </tr>)}</tbody>
  </table></div>
}
