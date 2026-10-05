export function PrototypeSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="dg-review-switch"><span>{label}</span><input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} /><span className="dg-switch-track" aria-hidden="true"><span /></span></label>
}
