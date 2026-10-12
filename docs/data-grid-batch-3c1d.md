# Data Grid Batch 3C.1d — Density anchor/focus and Criteria icons

Narrow prototype correction. Fetched `origin/main`, local `main` and approved
baseline matched `b704bad31f233422e1b84d1721fb3a367c9eebee`; working tree was clean.
No divergence, unrelated changes, shared prototype-system edits, tokens,
dependencies, models or datasets were introduced.

## Reproduction and exact changes

Before editing, an automated browser probe measured the Density row bottom at
454.5px, ChevronDown frame bottom at 444.5px and picker top at 458.5px: 4px below
the row, but 14px below the icon. Both Escape restorations matched native
`:focus-visible` and painted a 2px blue outline. First Escape already closed
only the child; that propagation boundary remains intact.

Density now holds a ref to the actual rendered `ChevronDown` SVG frame and
measures that frame's `getBoundingClientRect()`. The picker starts 6px below it,
with its right edge aligned to the chevron's right edge. The existing flip/clamp
logic uses this same frame and a 6px gap when placing above; viewport containment
takes priority where space is constrained. Existing scroll/resize scheduling
continues to follow parent placement without guessed offsets.

At the same 1440×1200 viewport after correction, the icon bottom remains
444.5px, picker top is 450.5px, and both right edges are 1419px. Pointer and
keyboard flows match. After a 40px document scroll, both anchors/picker move
40px and retain the 6px gap. 480×420, 280×280 and parent-content scrolling also
retain the measured gap and containment.

Escape restoration marks only the Density row / View Settings trigger with a
transient `data-dismissal-focus` attribute before focusing them. Two scoped CSS
selectors suppress only their dismissal-driven outlines. Native focus stays
on the valid control; the attribute clears on blur or the next non-Escape key.
Tab/Shift+Tab and normal keyboard entry therefore retain genuine 2px focus
indicators. Selection still restores Density normally. Toolbar outside-dismissal
restoration uses the same quiet programmatic-focus policy and existing scheduled
focus repair. No shared/default focus rules or overlay ownership were changed.

The sole Data Grid Criteria disclosure implementation is in `DataGridToolbar`.
Its confirmed assignments were Hide → `PanelTopClose`, Show → `PanelTopOpen`.
They are now exchanged: Hide → `PanelTopOpen`, Show → `PanelTopClose`. The same
control renders in expanded, collapsed and compact states; action callbacks,
names/tooltips, `aria-expanded`, `aria-controls`, sizes and geometry are unchanged.

## Files changed

- `src/prototypes/data-grid/components/ViewSettingsPopover.tsx`
- `src/prototypes/data-grid/components/DataGridToolbar.tsx`
- `src/prototypes/data-grid/styles/data-grid.css`
- `scripts/data-grid-batch-3c1d.browser.mjs` (new targeted A–G coverage)
- `scripts/data-grid-batch-3c1c.browser.mjs` (superseded gap/restoration assertions)
- This report.

## Actual validation

- `npm.cmd run lint`: passed.
- `npm.cmd run build` (`tsc -b` then production Vite build): passed.
- `git diff --check` and `git diff --cached --check`: passed.
- `node scripts/data-grid-batch-3c1d.browser.mjs`: passed in local Chrome/Edge.
  Checks real SVG/picker rects (0.5px tolerance), horizontal alignment,
  scroll/resize/containment, separate Escape events, quiet focus, real Tab/Shift+Tab
  indicators, all three density modes/heights/checks, persistent overlay lifecycle,
  and exact Criteria icon identity/actions/tooltips in all toolbar variants.
- Existing suites 3C.1, 3C.1a, 3C.1b, 3C.1c, 3B.5/3B.6, 3B.7 and 3B.8/3B.9:
  all passed locally in Chrome/Edge, covering Group/Sort/Filter drafts, dirty
  guards, snapshots, Apply/Cancel/Undo, geometry, toolbar and Criteria behavior.
- External legacy QA copies: 98 Filter, 53 Sort and 40 cross-editor checks passed
  locally in Chrome, with zero browser errors/warnings. These sources stay in Temp.

Browser commands use the established external `PLAYWRIGHT_MODULE` and installed
`BROWSER_PATH`. Pass the published Data Grid URL as argv[2] for deployment tests.
Final commit SHA, Pages workflow status and published results are reported in the
delivery message after push.

Optional `ARTIFACT_DIR` captures cropped evidence and `geometry.json`. Local
Chrome evidence was captured and visually inspected in
`C:/Users/purva/AppData/Local/Temp/data-grid-3c1d-evidence-local/`: pointer/keyboard
Density anchor, first Escape and second Escape screenshots. These synthetic-data
artifacts remain outside the repository; published captures use a separate folder.

## Limitations and manual QA checklist

Automated Chrome/Edge coverage and screenshot inspection were performed. No
interactive manual QA, Safari/Firefox, screen-reader or physical-device testing
was performed. Highly constrained viewports retain the existing flip/clamp policy.

1. On the live build, open settings and Density with pointer and keyboard. Inspect
   the 6px chevron gap; scroll/resize and confirm both overlays remain anchored.
2. Press Escape twice: child then parent, sensible focus without rings. Use
   Tab/Shift+Tab to revisit both controls and confirm visible keyboard indicators.
3. Choose Patient/Standard/Clinical (52/40/30px). Check trailing selection only.
   Toggle Criteria in expanded/collapsed layouts: Hide uses PanelTopOpen; Show
   uses PanelTopClose; names/tooltips and visibility actions remain correct.

No Drive/Figma changes. No future features. Stop after 3C.1d.
