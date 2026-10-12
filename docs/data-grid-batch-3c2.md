# Data Grid Batch 3C.2 — Group / Multi-group and Reorder

Prototype/review implementation only. Fetched `origin/main`, local `main` and
the approved baseline matched `79dce5fb65e3f6a1f93a665936432f091affeb5f`.
The initial working tree was clean; no newer changes required reconciliation.
Reviewed the 3C.1–3C.1d reports, Group/Sort editors, catalog, semantic comparison,
Criteria sessions, Summary formatter, immutable commits and removal/Undo paths.

## Result and contract

The existing Group editor now handles multiple ordered `GroupDraftRule` rows.
There is still one shared Criteria session and `GroupRule[]` committed snapshot;
no additional Group state system or host-specific behavior was introduced.
Validation requires at least one row and a valid field-aware Order on every row.
The first row has the highest precedence. Ordered field/Order pairs determine
dirtiness; generated IDs identify controls and focus only. Apply clones the
draft into the existing commit path. Summary and Undo continue to read exact
committed snapshots, independently of Filter and Sort.

A new Group opens one incomplete starter with its searchable Field picker and
Search focused. Existing Group opens exactly its committed rows and values,
with Apply disabled and no extra starter. Add Subgroup becomes available only
when every current row is complete; it appends a new ID, opens that row's Field
picker and disables Apply until selection assigns a valid default Order.
Selecting the same field preserves a deliberately chosen Order.

The existing Group catalog always supplied all eight fields and had no
duplicate-field exclusion or uniqueness validator. That contract is retained;
Sort's separate uniqueness rule is not imposed on Group. The available approved
request and repository reports contain no numeric Group depth maximum. No
maximum was inferred or enforced. The focused suite exercises nine rows,
including repeated catalog fields, to check these retained boundaries. This is
not a new approved depth or duplicate-field product decision.

Completed rows have the existing Sort rank/grip treatment. Pointer dragging
previews a gap and changes the draft only on an inside drop. Outside drop or
Escape cancels it. The existing pointer hook accepts opt-in Group row selectors;
its Sort defaults remain unchanged. Autoscroll and wheel scrolling target only
the Condition Stack. Dragging dismisses incompatible pickers and never activates
Field/Order controls. Arrow Up/Down on a focused grip moves that row, clamps at
the ends, announces its precedence, keeps the same ID/pairs and restores visible
handle focus. Returning to the committed order disables Apply again.

Clear all appears in the workspace only with two or more rows. It resets the
draft to one incomplete starter. Row deletion removes only that row and focuses
an adjacent Field control; deleting the last row retains a starter. A committed
Group reduced to the empty starter exposes destructive Clear group. Cancel
discards explicitly without the dirty navigation guard. Implicit navigation
retains the shared guard and Keep/Discard behavior. Clear group, Summary removal
and Summary Clear All preserve the existing exact removal/Undo implementation.

The existing formatter supplies `Group · N fields` for multiple committed rows;
the tooltip lists their committed fields and Orders in numbered precedence.
The Summary order remains Group → Sort → divider → Advanced → Simple. No
standalone toolbar Group button was added. Header and Summary remain 48px/40px.

## Scope and visual assumptions

Changed only:

- `src/prototypes/data-grid/components/GroupEditorShell.tsx`
- `src/prototypes/data-grid/components/useSortReorder.ts` (opt-in row identity)
- `src/prototypes/data-grid/model/groupFields.ts` (multi-row validity)
- `src/prototypes/data-grid/styles/data-grid.css` (Group uses existing reorder styling)
- `scripts/data-grid-batch-3c1.browser.mjs` (superseded Add Subgroup assertion)
- `scripts/data-grid-batch-3c2.browser.mjs` (new focused regression)
- This report.

No shared `src/prototype-system/` code, tokens, dependencies, dataset, global
overlay policy or other editor implementation changed. Rank/grip, focus ring,
drop indicator and preview reuse the task-local Sort presentation. The Group
heading, field controls, disabled More/AI affordances and Criteria composition
retain the existing Group anatomy. Accepted 05G A–H Figma states/reference images
were not supplied or accessible; direct comparison was not performed. Existing
Criteria presentation and the written batch requirements are the visual basis.

Narrow screens retain the established horizontally scrollable 920px review
workspace. At 480px there is no document overflow; at 280px the unchanged shared
shell's `body { min-width: 320px; }` causes a 320px document. Tests assert no added
overflow beyond that baseline, with Group pickers clamped inside the actual
280px viewport. Final narrow-screen product layout remains unresolved.

## Actual verification

| Check | Chrome | Edge |
| --- | --- | --- |
| New 3C.2 targeted browser suite | Passed | Passed |
| Existing 3C.1, 3C.1a, 3C.1b, 3C.1c, 3C.1d | All passed | All passed |
| Existing 3B.5/3B.6, 3B.7, 3B.8/3B.9 | All passed | All passed |
| Available legacy Filter regression | 98 checks passed | 98 checks passed |
| Available legacy Sort regression | 53 checks passed | 53 checks passed |
| Available legacy cross-editor regression | 40 checks passed | 40 checks passed |

The targeted suite verifies new starter/picker focus; all eight field defaults;
valid two/three-row drafts; exact committed values, IDs and reopening; clean
menus/focus; edits, incomplete additions, valid additions/removals; pointer and
keyboard reorder/restoration; cancelled/outside drops; picker dismissal during
drag; nine-row drag with stack autoscroll/wheel; focus and live announcements;
Apply commits, Cancel restoration, dirty guard Keep/Discard and Filter/Sort/Hide
transitions; draft Clear all and last deletion; destructive Clear group; Summary
count, ordered committed tooltip, exact removal/Undo; semantic equality across
new IDs; 48px/40px geometry; 480px/280px keyboard and picker containment; and no
browser errors/orphan overlays. Existing 3C.1d covers Density anchor, separate
Escape restorations, genuine keyboard focus rings and exact Criteria icon
assignments; all its assertions remain unchanged.

Available external legacy QA copies are in Temp and were not added to the
repository. Edge copies change only the browser executable and artifact names,
preserving UTF-8 source text. All legacy suites reported zero runtime errors and
warnings. Initial test-harness failures were corrected: the new suite used the
wrong case for the existing `Add Filter` accessible name and initially assumed
no shared-shell overflow below 320px; an initial temporary Edge copy decoded
UTF-8 using PowerShell's legacy default encoding. None required product changes.

`npm.cmd run lint`, standalone TypeScript (`node node_modules/typescript/bin/tsc -b`),
production build (`npm.cmd run build`), `git diff --check` and
`git diff --cached --check` passed. Browser checks used installed headless Chrome
and Edge with the existing external Playwright installation; no dependency was
added. Run the new suite as follows:

```powershell
$env:PLAYWRIGHT_MODULE = '<absolute path to playwright/index.mjs>'
$env:BROWSER_PATH = '<absolute path to Chrome or Edge executable>'
node scripts/data-grid-batch-3c2.browser.mjs
# Optional argv[2]: published Data Grid URL.
# Optional ARTIFACT_DIR: cropped screenshots and geometry.json.
```

Before/after synthetic-data screenshots were captured and visually inspected in
`C:/Users/purva/AppData/Local/Temp/data-grid-3c2-evidence/`: `before.png`,
`three-row-committed.png`, `reordered-draft.png` and `narrow-multi-group.png`,
plus `geometry.json`. Edge after captures use `data-grid-3c2-evidence-edge/`.
They stay outside the repository. The narrow screenshot records the existing
clipped/scrollable review surface, not a responsive product layout approval.

The user completed manual QA and confirmed multi-group, Add Subgroup, reorder,
Apply/Cancel and Clear all work as expected. No agent-performed interactive
human QA, screen-reader testing, Safari/Firefox, physical touch device testing
or direct Figma comparison was performed. Keyboard focus, live region content
and geometry were checked automatically; assistive technology speech output
remains for human review.

The user explicitly approved committing, pushing to main and deploying Batch
3C.2 after manual QA. Final lint, standalone TypeScript/build, the targeted
3C.2 suite and all eight existing repository browser suites are rerun before
commit. The final commit SHA, Pages workflow result and targeted published-URL
Chrome/Edge results are reported in the delivery message after verification.
Deployment uses the unchanged `deploy-pages.yml` workflow; no further features
or workflow changes are part of this batch.

## Manual QA checklist

1. Enter Group through View Settings after removing the committed Group. Confirm
   one starter, Search focus, disabled Apply/Add Subgroup, then correct default
   Order after choosing Status, Priority or Next Contact.
2. Add two subgroups. Confirm their picker/focus behavior, first-row precedence,
   stable field/Order pairs, disabled Apply while incomplete and enabled Apply
   when valid. Apply and reopen: exactly the committed ordered rows, clean Apply.
3. Drag a completed grip and use Arrow Up/Down on it. Inspect gap/grip treatment,
   focus and announced rank. Restore the original order: Apply disabled. Try
   outside drop, Escape and a long scrolling stack; no unwanted picker/navigation.
4. Cancel a reorder and reopen. Try implicit Sort, Filter and Hide transitions
   from a dirty draft: Keep preserves it, Discard opens the intended destination.
   Summary tooltip must continue showing committed precedence before Apply.
5. Clear all or delete rows down to the last starter. Confirm draft-only reset,
   no one-row workspace Clear all, correct destructive Clear group, Cancel
   restoration and exact Undo after committed removal/Summary Clear All, with
   Filter and Sort preserved.
6. At narrow widths, scroll the review workspace to controls; verify picker
   containment, usable keyboard focus and no stale overlays. Recheck Density's
   chevron anchor/two Escapes and Show/Hide Criteria icon assignments.

No Drive/Figma edits. Group More, group-value visibility/reordering, empty-record
groups, grouped table rows/collapse/server grouping, 05G I healthcare visual
normalization, Saved Views, Manage Columns, Search, direct header integration,
05K and AI Group remain deferred. Stop after Batch 3C.2.
