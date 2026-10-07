// 05A working candidates for host validation; only Filter is functional.
export const gridShortcuts = {
  filter: { label: 'Filter', display: 'F', aria: 'F', active: true },
  sort: { label: 'Sort', display: 'S', aria: 'S', active: false },
  search: { label: 'Search current grid', display: 'Ctrl/Cmd + F', aria: 'Control+F Meta+F', active: false },
  view: { label: 'View/Display', display: 'Shift + V', aria: 'Shift+V', active: false },
  columns: { label: 'Columns', display: 'Shift + C', aria: 'Shift+C', active: false },
  saveView: { label: 'Save View', display: 'Alt/Option + V', aria: 'Alt+V', active: false },
} as const
