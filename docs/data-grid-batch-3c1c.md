# Data Grid Batch 3C.1c — View Settings hover association and lifecycle

Prototype/review correction only. Starting local `main` and fetched `origin/main`:
`0791d6471b4014bcf8179a9562416ec077597787`. The fetch found no newer commits.
This implements the revised prompt's existing-hover association; it introduces
no selected/applied design, blue open background or new design tokens.

## Confirmed causes and scoped corrections

A pre-edit browser probe reproduced both premature-dismissal paths independently:

- Leaving the settings trigger alone kept the popup open, but its background
  changed from `rgb(242, 243, 245)` to transparent.
- Hovering Search emitted `dg-overlay-change` with the tooltip's owner ID and
  removed settings. `PrototypeTooltip.show` claimed the same ownership used by
  click-open menus, whose overlay-change listener then dismissed settings.
- Dispatching an unrelated document scroll removed settings and released its
  owner. `PrototypeMenu`'s global capture scroll listener dismissed whenever the
  event target was outside the menu. No mouseleave or generic blur dismissal was
  responsible for the parent popup closing.

The trigger now has a scoped `dg-view-settings-trigger` class. Its existing
`aria-expanded="true"` joins the actual winning ghost-button hover declaration,
which uses the existing `--dg-level-one` background. The earlier icon-button
hover declaration is overridden by that ghost-button selector; blindly reusing
its `--dg-surface` would give the wrong appearance. Color, radius and dimensions
retain the existing icon-button styling, and closing removes the forced hover
association. Genuine hover and keyboard focus-visible still apply normally.

Computed Chrome/Edge comparisons match exactly:

| Property | Closed, unhovered/unfocused | Genuine hover | Popover open, pointer elsewhere |
| --- | --- | --- | --- |
| backgroundColor | `rgba(0, 0, 0, 0)` | `rgb(242, 243, 245)` | `rgb(242, 243, 245)` |
| color / SVG color | `rgb(74, 85, 101)` | `rgb(74, 85, 101)` | `rgb(74, 85, 101)` |
| borderRadius | `4px` | `4px` | `4px` |
| dimensions | `24 × 24px` | `24 × 24px` | `24 × 24px` |

View Settings opts into `PrototypeMenu`'s `dismissalPolicy="explicit"`. It claims
persistent ownership that rejects passive tooltip/hover-preview claims, while
allowing explicit overlay transitions and the existing exclusive dirty guards.
Tooltip and Saved View preview callers identify their claims as passive. With
no persistent owner, their behavior is unchanged. Other menus retain default
scroll dismissal and ownership policy; no global picker dismissal was removed.

The opt-in menu remeasures its trigger on scroll and resize instead of dismissing.
The Density child's placement also follows scrolling, using an animation frame
after parent placement so its measurements are current. Both retain viewport
clamping. Cleanup removes listeners, cancels the child frame, and releases
ownership only when still owned by that component.

Settings still closes on trigger toggle, outside pointer/touch, Escape, its
Filter/Group/Sort routes, explicit incompatible overlays and page navigation.
Pointer departure, unrelated hover, ordinary scroll and focus changes alone
leave it open. Density keeps the same parent ownership; selection closes only
the child, and Escape closes the child before the parent. Restored keyboard
focus can retain its existing focus-visible surface; that is separate from
the removed open association.

## Changed files

- `src/prototypes/data-grid/components/DataGridToolbar.tsx`
- `src/prototypes/data-grid/components/ViewSettingsPopover.tsx`
- `src/prototypes/data-grid/ui/PrototypeMenu.tsx`
- `src/prototypes/data-grid/ui/PrototypeTooltip.tsx`
- `src/prototypes/data-grid/ui/ViewPreviewPopover.tsx`
- `src/prototypes/data-grid/ui/overlayState.ts`
- `src/prototypes/data-grid/styles/data-grid.css`
- `scripts/data-grid-batch-3c1c.browser.mjs` (new)
- This note.

## Validation and boundaries

The new A–U suite compares actual computed hover/open styles, checks passive
ownership attempts, real wheel scrolling and anchor movement, parent/child
scrolling and narrow/short viewport containment, keyboard and touch dismissal,
explicit overlay replacement without an outside pointer, routes, page navigation,
and restored tooltip/preview behavior after dismissal. It also verifies retained
3C.1b geometry, focus and Density selection treatment. Existing 3C.1a/3C.1b and
3C.1 suites cover the full geometry, all density modes/heights, Group draft/Apply,
Summary routes, shared dirty guards and unfinished Criteria drafts. 3B.5/3B.6,
3B.7 and 3B.8/3B.9 retain Filter/Sort/Criteria and responsive coverage.

All seven repository suites passed locally in Chrome and Edge. Existing external
QA copies also passed locally in Chrome: 98 Filter, 53 Sort and 40 cross-editor
checks, with zero errors/warnings. Lint, TypeScript/production build and whitespace
checks passed. Browser scripts use external `PLAYWRIGHT_MODULE` / installed `BROWSER_PATH` and
accept a published URL as argv[2]. Final local/published results and deployment
SHA are reported in the delivery message. Temporary baseline probes and legacy
QA copies stay outside the repository.

No shared `src/prototype-system/` code, tokens or product model changed. Saved
View persistence/rename/delete (05J), Manage Columns (05I) and Group 3C.2 remain
deferred. Verification is automated Chrome/Edge; Safari/Firefox and manual
assistive-technology testing are not covered. Touch dismissal uses a synthetic
pointer event rather than physical-device testing. No Drive/Figma edits.
Stop after 3C.1c.
