import { useEffect, useRef } from 'react'
export function PrototypeCheckbox({ label, checked, indeterminate = false, onChange }: { label: string; checked: boolean; indeterminate?: boolean; onChange: (checked: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate }, [indeterminate])
  return <input ref={ref} className="dg-checkbox" type="checkbox" aria-label={label} checked={checked} onChange={event => onChange(event.target.checked)} />
}
