import { useId, useRef, useState, type ReactNode } from 'react'
import { TabAtom, type TabAtomVariant, type TabIcon } from './TabAtom'

export type TabsVariant = 'underline' | 'underline-icons' | 'pills' | 'pills-brand' | 'pills-brand-border'
export interface TabsItem {
  id: string
  label: string
  panel: ReactNode
  leadingIcon?: TabIcon
  trailingIcon?: TabIcon
  badge?: string
}
export interface TabsProps {
  label: string
  items: readonly TabsItem[]
  selectedId: string
  onSelectionChange: (id: string) => void
  onFocusedItemChange?: (id: string | null) => void
  variant?: TabsVariant
}

const atoms: Record<TabsVariant, TabAtomVariant> = {
  underline: 'underline', 'underline-icons': 'underline', pills: 'pill-gray',
  'pills-brand': 'pill-brand', 'pills-brand-border': 'pill-brand-underline',
}

/** Controlled, horizontal manual-activation reference. No routing or application state. */
export function Tabs({ label, items, selectedId, onSelectionChange, onFocusedItemChange, variant = 'underline' }: TabsProps) {
  const instanceId = useId()
  const scroller = useRef<HTMLDivElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const selection = items.some(item => item.id === selectedId) ? selectedId : items[0]?.id

  // Reveal only on the local horizontal axis; never scroll the surrounding page.
  const reveal = (button: HTMLButtonElement) => {
    const viewport = scroller.current
    if (!viewport) return
    const outer = viewport.getBoundingClientRect(), inner = button.getBoundingClientRect()
    const gutter = 6 // Local focus clearance, not source geometry.
    if (inner.left < outer.left + gutter) viewport.scrollLeft += inner.left - outer.left - gutter
    else if (inner.right > outer.right - gutter) viewport.scrollLeft += inner.right - outer.right + gutter
  }

  // No unnamed or partially missing tabs if a consumer supplies incomplete demo data.
  if (!label.trim() || !items.length || items.some(item => !item.label.trim()) || new Set(items.map(item => item.id)).size !== items.length) return null

  return <div className={`ox-tabs ox-tabs--${variant}`}>
    <div className="ox-tabs__scroller" ref={scroller}>
      <div className="ox-tabs__list" role="tablist" aria-label={label} aria-orientation="horizontal"
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocusedId(null)
            onFocusedItemChange?.(null)
          }
        }}>
        {items.map((item, index) => <TabAtom key={item.id} ref={element => { buttons.current[index] = element }}
          id={`${instanceId}-tab-${index}`} role="tab" aria-controls={`${instanceId}-panel-${index}`}
          aria-selected={selection === item.id} tabIndex={(focusedId ?? selection) === item.id ? 0 : -1}
          variant={atoms[variant]} label={item.label} selected={selection === item.id}
          leadingIcon={item.leadingIcon} trailingIcon={item.trailingIcon} badge={item.badge}
          onFocus={event => { setFocusedId(item.id); onFocusedItemChange?.(item.id); reveal(event.currentTarget) }}
          onClick={() => onSelectionChange(item.id)}
          onKeyDown={event => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
            let next: number
            switch (event.key) {
              case 'ArrowLeft': next = (index - 1 + items.length) % items.length; break
              case 'ArrowRight': next = (index + 1) % items.length; break
              case 'Home': next = 0; break
              case 'End': next = items.length - 1; break
              default: return // Enter/Space retain native button click behavior.
            }
            event.preventDefault()
            buttons.current[next]?.focus({ preventScroll: true })
          }} />)}
      </div>
    </div>
    {items.map((item, index) => <div key={item.id} id={`${instanceId}-panel-${index}`}
      className="ox-tabs__panel" role="tabpanel" aria-labelledby={`${instanceId}-tab-${index}`}
      hidden={selection !== item.id} tabIndex={selection === item.id ? 0 : -1}>{item.panel}</div>)}
  </div>
}
