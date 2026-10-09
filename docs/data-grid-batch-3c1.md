# Data Grid Batch 3C.1 — Group foundation

Prototype/review implementation only. Starting `main` and fetched `origin/main`:
`fd314a041f6f96b9ab1f5d8ddb479dfe3c921761` (completed Batch 3B.9).

## Behavior and state

`groupSnapshot: GroupRule[]` replaces `groupCommitted` entirely. Each committed
row carries an ID, a typed catalog field and a typed order. An empty array means
no committed Group. Draft rows permit empty field/order values. IDs identify
controls; ordered field/order pairs determine semantic dirtiness. This batch
validates exactly one complete row; the snapshot representation can support
ordered rows in a later batch.

Toolbar Group, View Settings → Group (also available with collapsed controls)
and the committed Summary Group chip route to the same Criteria editor. A new
Group reveals the Criteria Area and opens one searchable Select field starter,
with Search focused. Selecting a field assigns a valid default order immediately.
Status defaults to A to Z, Priority to High to Low, and Next Contact to Newest to
Oldest. Provider/program/risk labels use alphabetical ordering; PHQ-9 and
Disengagement use numerical ordering without clinical severity or threshold
inference. The catalog follows the eight fields supplied in the batch request.

Apply requires a valid changed draft and commits a cloned snapshot. Existing
Group opens exactly its committed rows with Apply disabled; reverting field/order
changes restores that disabled state. Cancel discards explicitly and bypasses
the shared implicit-navigation guard. Delete always retains one starter. A
committed Group reduced to that starter exposes destructive Clear group; Cancel
still restores the committed state. No single-row workspace Clear all is shown.

The Summary chip displays `Group by: <field>`, becomes solid while Group is
active, and describes committed field/order in its tooltip. It retains the
Group → Sort → divider → Advanced Filter → Simple Filter order. Removal, Clear
group and Summary Clear All use the existing Undo mechanism with exact Group
snapshots, leaving other criterion families intact for individual removal.
Sample committed state and Reset migrate to Status / A to Z. Editor closures
retain the established Summary transition; Hidden reveals Summary on entry.

Existing task-local UI primitives provide pickers, tooltips, menus, buttons,
focus handling and guard behavior. Header remains 48px and Summary 40px, with
the editor directly above Summary. No shared prototype-system code or tokens
changed. Host skins remain future presentation modes using the common model.

## Files

- `src/prototypes/data-grid/model/dataGridPrototypeState.ts`
- `src/prototypes/data-grid/model/groupFields.ts` (new)
- `src/prototypes/data-grid/components/GroupEditorShell.tsx` (new)
- `src/prototypes/data-grid/components/CriteriaArea.tsx`
- `src/prototypes/data-grid/components/CriteriaSummary.tsx`
- `src/prototypes/data-grid/components/DataGridToolbar.tsx`
- `src/prototypes/data-grid/components/DirtyNavigationGuard.tsx`
- `src/prototypes/data-grid/components/PrototypeStateControls.tsx`
- `src/prototypes/data-grid/DataGridPrototypePage.tsx`
- `src/prototypes/data-grid/styles/data-grid.css`
- `scripts/data-grid-batch-3c1.browser.mjs` (new)
- This batch note.

## Verification

Lint, TypeScript (`tsc -b`), production build and diff/whitespace checks passed.
The focused 3C.1 browser script covers requested A–O behavior, all eight field
types, new/existing Cancel, non-preset field/order removal and exact Undo,
sample/reset, dirty guard, picker placement/search, selected chip, tooltips,
48px/40px composition, compact control alignment and narrow-screen keyboard
access without document overflow. It passed in installed Chrome and Edge.

Repository scripts for 3B.5/3B.6, 3B.7 and 3B.8/3B.9 passed in Chrome and Edge.
One initial Edge 3B.7 run failed an immediate post-delete focus assertion; the
unchanged script passed on recheck. This intermittent assertion is recorded,
not counted as an initial pass.

External local 3B.4 suites were also exercised via temporary copies: 98 Filter,
53 Sort and 40 cross-editor checks passed in Chrome, including nested Advanced
Filter, dirty guard, Summary, Undo and reset. Their original fixed Advanced
240px/320px bounds predate the accepted 3B.8/3B.9 dynamic-width behavior. The
temporary copies updated those checks to dynamic width/containment, plus the
intentional Group label/tooltip changes. Originals first failed at obsolete
width checks. No external source files or artifacts were added to the repository.

Run browser scripts with an externally installed Playwright module and an
installed browser (no new repository dependency):

```powershell
$env:PLAYWRIGHT_MODULE = '<absolute path to playwright/index.mjs>'
$env:BROWSER_PATH = '<absolute path to Chrome or Edge executable>'
node scripts/data-grid-batch-3c1.browser.mjs
# Optional second argument: the published Data Grid URL.
```

The approved 05G A–I reference URL/images were not supplied or accessible in
this session. Implementation uses the detailed batch request and existing
Criteria presentation. Screenshot review and browser measurements were done,
but direct Figma A/B/C/G visual comparison is unverified. Responsive containment
uses the established scrollable review workspace; final narrow-screen product
behavior and framework skins remain unresolved.

## Deferred boundaries

Add Subgroup, More group options and AI Group are visible disabled affordances.
No multiple Group fields, Group drag/keyboard reorder, value reordering or
visibility, empty-record groups, More popover, grouped table rows, healthcare
data-consistency rebuild, guard redesign, Saved Views/Manage Columns, Search,
real AI, column-header Group integration or 05K direct Sort integration is built.
Multi-field labels are supported by the snapshot formatter without fabricating
multi-field committed state. Stop after 3C.1; no later batch starts automatically.

For 3C.4 planning only, preserve the supplied More-popover reference: Group
visibility / Group values headings; 32px heading frames with 8px padding;
DM Sans Bold 12px/16px; no extra gap before grouped content; optional
right-aligned counts; 36px value rows; one Show groups with no records toggle;
one reorder grip and one trailing visibility control per value; no redundant
checkbox plus eye, and no new global typography token without independent
validation. This popover is not implemented in 3C.1.
