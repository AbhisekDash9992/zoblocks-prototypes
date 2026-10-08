import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { PrototypeMenu } from './PrototypeMenu'
import { PrototypeCheckbox } from './PrototypeCheckbox'
import { PrototypeButton } from './PrototypeButton'
import { PrototypeInput } from './PrototypeInput'
import type { PrototypeInputState } from './PrototypeInput'

export function PrototypeSelect({ label, value, options, onChange, placeholder = 'Select value', className = '', multiple = false, compact = false, autoOpen = false, searchable = false, state, disabled = false }: {
  label: string; value: string; options: string[]; onChange: (value: string) => void; placeholder?: string; className?: string; multiple?: boolean; compact?: boolean; autoOpen?: boolean; searchable?: boolean; state?: PrototypeInputState; disabled?: boolean
}) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState({ left: 0, top: 0, width: 180 })
  const [keepTriggerFocus, setKeepTriggerFocus] = useState(false)
  const isDisabled = disabled || state === 'disabled'
  const openMenu = useCallback((retainFocus = false) => {
    if (isDisabled) return
    const rect = trigger.current!.getBoundingClientRect()
    setPosition({ left: rect.left, top: rect.bottom + 4, width: compact ? 80 : Math.max(rect.width, multiple ? 240 : 180) })
    setKeepTriggerFocus(retainFocus && !searchable); setQuery(''); setOpen(true)
  }, [compact, multiple, searchable, isDisabled])
  useEffect(() => {
    if (!autoOpen || isDisabled) return
    let openFrame = 0
    const layoutFrame = requestAnimationFrame(() => {
      const control = trigger.current
      const stack = control?.closest<HTMLElement>('.dg-condition-stack')
      const row = control?.closest<HTMLElement>('.dg-rule-row') ?? control
      if (!control || !stack || !row) return
      const bounds = stack.getBoundingClientRect(), target = row.getBoundingClientRect()
      if (target.bottom > bounds.bottom) stack.scrollTop += target.bottom - bounds.bottom
      else if (target.top < bounds.top) stack.scrollTop -= bounds.top - target.top
      // Scroll only the stack, then measure the settled anchor on the next frame.
      openFrame = requestAnimationFrame(() => {
        control.focus({ preventScroll: true })
        openMenu(true)
      })
    })
    return () => { cancelAnimationFrame(layoutFrame); cancelAnimationFrame(openFrame) }
  }, [autoOpen, isDisabled, openMenu])
  const close = useCallback((restoreFocus: boolean) => { setOpen(false); if (restoreFocus) trigger.current?.focus({ preventScroll: true }) }, [])
  const selected = multiple ? value.split(', ').filter(Boolean) : [value]
  const filtered = options.filter(option => option.toLowerCase().includes(query.toLowerCase()))
  const toggle = (option: string) => onChange((selected.includes(option) ? selected.filter(item => item !== option) : options.filter(item => selected.includes(item) || item === option)).join(', '))
  const all = options.length > 0 && options.every(option => selected.includes(option))
  return <>
    <button ref={trigger} type="button" disabled={isDisabled} aria-invalid={state === 'error' || undefined} className={`dg-input dg-input-${isDisabled ? 'disabled' : state ?? (open ? 'active' : value ? 'filled' : 'default')} dg-select-trigger ${className}${!value ? ' dg-placeholder' : ''}${open ? ' dg-select-open' : ''}`} aria-label={label} aria-haspopup={multiple || searchable ? 'dialog' : 'listbox'} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => open ? close(true) : openMenu()} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); openMenu() } }}><span>{value || placeholder}</span><ChevronDown size={12} aria-hidden="true" /></button>
    {open && <PrototypeMenu id={id} label={label} trigger={trigger} position={position} onClose={close} keepTriggerFocus={keepTriggerFocus} role={multiple || searchable ? 'dialog' : 'listbox'}>
      {multiple ? <>
        <PrototypeInput className="dg-picker-search" aria-label="Search priorities" placeholder="Search" value={query} onChange={event => setQuery(event.target.value)} />
        <div className="dg-picker-section-header"><span className="dg-picker-heading">Priorities</span><PrototypeButton variant="text" textTone="primary" onClick={() => onChange(all ? '' : options.join(', '))}>{all ? 'Clear all' : 'Select all'}</PrototypeButton></div>
        {filtered.map(option => <label key={option} className="dg-menu-check-row"><span>{option}</span><PrototypeCheckbox label={option} checked={selected.includes(option)} onChange={() => toggle(option)} /></label>)}
        {filtered.length === 0 && <p className="dg-picker-empty">No results</p>}
      </> : searchable ? <>
        <PrototypeInput className="dg-picker-search" aria-label="Search fields" placeholder="Search fields…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); event.currentTarget.parentElement?.querySelector<HTMLButtonElement>('[role="option"]')?.focus() } }} />
        <div role="listbox" aria-label={label}>{filtered.map(option => <button key={option} type="button" role="option" aria-selected={value === option} onClick={() => { onChange(option); close(true) }}><span>{option}</span>{value === option && <Check size={14} aria-hidden="true" />}</button>)}</div>
        {filtered.length === 0 && <p className="dg-picker-empty">No matching fields</p>}
      </> : options.map(option => <button key={option} type="button" role="option" aria-selected={value === option} onClick={() => { onChange(option); close(true) }}><span>{option}</span>{value === option && <Check size={14} aria-hidden="true" />}</button>)}
    </PrototypeMenu>}
  </>
}
