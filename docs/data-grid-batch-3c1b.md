# Data Grid Batch 3C.1b — View Settings focus, tooltip and spacing

Prototype/review correction only. Starting local `main` and fetched
`origin/main`: `69b943c015550b17d32bcd7e8c74f1825e7237a4`.
The fetch found no newer commits to reconcile.

## Causes and fixes

`PrototypeMenu` focused its first input on opening, producing a caret and blue
border on the read-only View name. A new local `focusPolicy="surface"` opt-in
focuses the settings dialog (`tabIndex=-1`) instead. Other pickers keep their
default first-control autofocus. View name retains its normal resting border
on opening; Tab deliberately reaches it, then Density, Filter, Group and Sort.
Arrow/Home/End navigation remains available, and disabled controls are skipped.
The neutral dialog surface has no focus outline; enabled controls retain theirs.

The tooltip's click suppression could be cleared by the trigger's blur/leave
while settings was opening. Focus restoration could then show it again, claim
overlay ownership, and interfere with settings. The settings trigger now passes
its popup-open state to its tooltip. Rendering and show events are blocked while
open, with suppression retained through blur/leave and restored focus. The layout
effect releases any tooltip ownership before the menu claims it; the existing
overlay-change listener clears visibility. Later real pointer entry or blur/focus
re-arms the tooltip. Other tooltip callers retain their defaults.

The groups added 8px horizontal padding on top of the popover's outer 4px, and
identity added 8px above its input. Group padding is now zero, without substitute
margins. Input, list-row backgrounds and both dividers share the content edges.
Width stays 320px; outer padding stays 4px; main gap stays 8px; identity item gap
stays 4px; configuration row gaps stay zero. Rows remain 36px with 8px internal
horizontal padding and 12px icon/label gaps.

Density inherited the generic picker's selected background. A Density-only rule
now gives selected options the same resting surface/text as the other options,
while retaining `aria-selected` and exactly one trailing checkmark. Explicit
scoped hover, active and focus rules preserve interaction feedback. Shared field
pickers retain their selected styling and default search autofocus.

## Changed files

- `src/prototypes/data-grid/components/DataGridToolbar.tsx`
- `src/prototypes/data-grid/components/ViewSettingsPopover.tsx`
- `src/prototypes/data-grid/ui/PrototypeMenu.tsx`
- `src/prototypes/data-grid/ui/PrototypeIconButton.tsx`
- `src/prototypes/data-grid/ui/PrototypeTooltip.tsx`
- `src/prototypes/data-grid/styles/data-grid.css`
- `scripts/data-grid-batch-3c1b.browser.mjs` (new A–O assertions)
- `scripts/data-grid-batch-3c1a.browser.mjs` (only superseded focus/padding assertions)
- `docs/data-grid-batch-3c1a.md` (superseding note)
- This note.

## Verification

The focused browser suite verifies pointer/keyboard initial focus and resting
input border; enabled keyboard entry; tooltip opening, ownership, three dismissal
paths and later hover/focus recovery; zero group insets, exact alignment, gaps,
dividers and retained row padding; selected Density resting/hover/active/focus
states and check semantics; other toolbar tooltips and field-picker styles.
A DOM observer also checks that the settings tooltip never overlaps the open
popover during these interactions.

All six repository browser suites (3B.5/3B.6, 3B.7, 3B.8/3B.9, 3C.1, 3C.1a and
3C.1b) passed locally in Chrome and Edge. They retain Group draft/Apply, Summary
entry, Filter/Sort routes, dirty guards, all density heights, toolbar geometry,
responsive collision/overflow and deferred-action checks. Lint, TypeScript/Vite
build and whitespace checks passed. The existing external Filter/Sort/cross-editor
QA copies remain outside the repository; the Sort copy's superseded focus
expectation now targets the neutral settings dialog. All 98 Filter, 53 Sort and
40 cross-editor checks passed locally in Chrome. Browser scripts use the
external `PLAYWRIGHT_MODULE` and installed `BROWSER_PATH`; a published URL can
be passed as argv[2]. Final SHA, deployment and published results are reported
after push in the delivery message.

Automated checks cover Chrome and Edge, not manual assistive-technology testing
or Safari/Firefox. No shared `src/prototype-system/` code or tokens changed.
View name remains read-only; Saved Views/persistence (05J), Manage Columns (05I),
Group 3C.2 and later work remain deferred. No Drive/Figma updates. Stop at 3C.1b.
