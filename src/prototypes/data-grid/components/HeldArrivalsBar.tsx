import { PrototypeButton } from '../ui/PrototypeButton'
export function HeldArrivalsBar({ visible, actionVisible }: { visible: boolean; actionVisible: boolean }) {
  if (!visible) return null
  return <div className="dg-held-arrivals"><span>2 DEMO ARRIVALS HELD</span>{actionVisible && <PrototypeButton className="dg-let-them-in" variant="secondary">LET THEM IN</PrototypeButton>}</div>
}
