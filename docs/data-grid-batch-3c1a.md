# Data Grid Batch 3C.1a — View Settings and Group entry correction

Prototype/review implementation only. Starting local `main` and fetched
`origin/main`: `2f494053fa9a270d1dd64fd5adbbf0ac66893914`.

## Result

Removed the incorrect standalone Group icon from the primary toolbar. Filter,
Sort, Search, Full Screen, View Settings and the far-right Criteria disclosure
retain their existing order, collapse behavior and 40px toolbar treatment.
Save View remains separate. Group creation uses View Settings → Group; the
committed Summary Group chip remains an edit entry. Column-header Group stays
deferred. No Group model or editor behavior was removed.

The dedicated `ViewSettingsPopover` replaces the temporary Sort/Group menu.
It reuses task-local input/button/menu primitives, the existing route callbacks
and overlay ownership. Its three groups are View identity, Data configuration
and View actions, separated by two explicit horizontal dividers. Working width
is 320px, outer padding 4px, group spacing 8px, and rows 36px. Identity has
8px horizontal/top padding and a 4px input/row gap. Configuration rows retain
8px padding, 12px icon/label gaps, 8px corners and zero intervening row gaps.

View identity derives `View 1` from the toolbar's existing fixed preview index.
The 32px View name input is read-only, with an accessible review-only description
and no visible label. View 2/3 remain previews; there is no new selection,
rename, persistence or ownership model.

Configuration order is Manage columns → Filter → Group → Sort. The shown-column
count derives from the same five-column inventory rendered by the table. Filter
count is committed Advanced leaf rules plus Simple filters; Group shows its
committed field; Sort count is its committed workspace rows, separate from the
existing direct column-header sort. Supporting values are plain secondary text.
Manage columns and Delete view are disabled, with their deferrals identified;
neither performs a fake action or clears criteria.

Filter, Group and Sort close settings and reuse shared entry callbacks with the
original View Settings toolbar button as source. They respect existing dirty
navigation guards, keep/discard semantics, starter-picker focus and clean exact
snapshot reopening. The Summary Group → Sort → divider → Advanced → Simple
order remains intact.

## Density and overlay behavior

The actual default changes from internal Figma baseline (42px rows) to Standard
(40px). The visible options follow the latest request: Patient / Standard /
Clinical, using existing 52px / 40px / 30px CSS modes. No duplicate density
styles or global tokens are introduced. Baseline remains available in Prototype
Controls. If selected there, settings honestly displays Figma baseline (review)
without adding a fourth picker option.

The Density row has no leading icon. ChevronRight becomes ChevronDown with a
neutral open background. Its 120px anchored listbox uses 4px outer padding,
36px options with 8px horizontal padding and zero gaps, and exactly one trailing
check for a visible selected mode. Selection updates the shared density state
and modified-view indication only when the mode changes. It preserves other
view state and committed criteria, and leaves unfinished editor drafts intact.

The child listbox sits within the parent's single overlay ownership/dismissal
boundary, without a nested dialog or separate owner that would close settings.
Escape first closes Density and returns focus to its row; the next Escape closes
settings and restores the toolbar trigger. Outside dismissal also restores
focus after the browser's pointer default. Arrow/Home/End navigation selects
options; Tab can return to parent controls. Fixed positioning permits the compact
child to escape parent overflow. Viewport clamping, vertical flipping, resize
placement and short-viewport scrolling preserve access.

`PrototypeMenu` adds opt-in class/focus behavior for settings and remeasures
placement on resize. Existing pickers retain their default outside-dismissal
behavior. Shared `src/prototype-system/` code and tokens remain unchanged.

## Changed files

- `src/prototypes/data-grid/components/ViewSettingsPopover.tsx` (new)
- `src/prototypes/data-grid/components/DataGridToolbar.tsx`
- `src/prototypes/data-grid/components/PrototypeDataGrid.tsx`
- `src/prototypes/data-grid/components/PrototypeStateControls.tsx`
- `src/prototypes/data-grid/DataGridPrototypePage.tsx`
- `src/prototypes/data-grid/model/dataGridPrototypeState.ts`
- `src/prototypes/data-grid/ui/PrototypeMenu.tsx`
- `src/prototypes/data-grid/styles/data-grid.css`
- `scripts/data-grid-batch-3c1a.browser.mjs` (new)
- `scripts/data-grid-batch-3c1.browser.mjs` (correct new Group entry helper)
- `docs/data-grid-batch-3c1.md` (superseding entry correction)
- This note.

## Verification and boundaries

The focused 3C.1a browser suite covers A–T: primary toolbar correction/order;
popover identity, hierarchy, counts and geometry; selected density/check/chevron;
actual table heights and modified state; empty/committed Group; existing
Filter/Sort routing; disabled deferred actions; parent/child Escape and outside
dismissal; all four editor modes' draft preservation and dirty navigation;
collapsed access; narrow/short viewport collision, resize and overflow access;
and the review-only baseline boundary. It passed in local Chrome and Edge.

Repository 3C.1 and 3B.5/3B.6, 3B.7, 3B.8/3B.9 suites passed locally in both
browsers. Existing external Filter/Sort/cross-editor checks use the temporary
copies already updated for accepted 3B.9 dynamic widths and Group labels; the
Sort copy additionally expects the new View name input to receive settings
entry focus instead of the former first Sort button. All 98 Filter, 53 Sort and
40 cross-editor checks passed in Chrome. These temporary QA sources and
screenshots remain outside the repository.

Lint, TypeScript/build and diff/whitespace checks passed before delivery.
Browser scripts use the same externally installed Playwright / BROWSER_PATH
setup documented in Batch 3C.1; pass the published Data Grid URL as argv[2]
to exercise deployment. Published verification and final SHA are reported in
the delivery message after push.

This composition follows the detailed user specification. No direct Figma
reference was supplied for visual comparison. Working geometry remains local
prototype review values, and final narrow-screen product behavior/framework
skins remain unresolved. Manage Columns (05I), Saved Views rename/delete (05J),
column-header Group, Multi-group 3C.2–3C.4, Group More configuration, grouped rows,
Search and real AI remain deferred. No Drive/Figma edits; stop after 3C.1a.
