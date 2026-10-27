# CS-05 Tabs design reference

Local Batch 2 review, 23 October 2026. This is a developer-facing interactive design reference, not a production-certified API or integration contract. Production developers independently choose their component architecture.

Geometry specification finalized as tables on 27 October 2026, local review only.

Native Storybook Docs: `CS-05 / Tabs / Docs`. Stories: Playground, Five parent styles, Twelve Atom states, Icon and badge configurations, Anatomy and geometry, Usage examples. Docs includes overview, source mapping, geometry, colors/token correspondence, composition, usage, accessibility and QA boundaries.

## Evidence and geometry

Verified designer inspection establishes five Light parent styles, each with four visible atoms; seven additional serialized instances are hidden. Preserve source spelling in traceability: `w underline` and `w underline and icons` map to `Undeline`; `pills` to `Pill on gray`; `pills w brand color` to `Pill with brand color`; `pills w barnd border` to `Pill with brand underline`. Public display names normalize spelling without creating variants.

The first four parents are 30px high with 16px gaps; brand-border is 38px with 6px gaps. Standalone Underline is 40×32px with 4/8 padding; gray/brand pills are 48×32px with 4/12 padding; nested brand underline is 40×38px with root 4/0 padding and inner 40×30px, 4/8 padding, 6px gap and 8px radius. Other atom content gaps are 8px. Gray Active/Hover and brand Active use 6px radius. Text-only widths describe inspected examples, not universal fixed widths. All four Types have Active, Hover and Inactive specimens. Active means selected. Static Hover differs from live pointer hover.

Labels: DM Sans Medium 500, 14/22px, zero tracking. Decorative icon slots: 14×14px. Colors and exact state mapping are in the Docs tables. TF-01 values are consumed without changing token definitions; equal values do not prove source variable binding. Indicator color #155DFC is verified; thickness is unresolved and rendered locally as 2px.

The clean nine-callout Anatomy schematic identifies nested surface, leading icon, label, Badge, trailing icon, padding, spacing, corner/border and selected indicator. It removes shaded padding/gap rectangles and the dashed label box. Small brackets in empty space retain meaningful padding/gap endpoints. A compact schematic sits left of one vertical ordered legend in sufficiently wide containers and stacks above it in narrow containers. Its viewport retains readable markers at a 420px minimum width and 520px maximum width, with named keyboard/touch scrolling. The anatomy Canvas removes its own extra Docs padding.

The **Geometry & spacing** subsection uses two semantic specification tables: Standalone atom geometry and Geometry provenance and context. The first covers the four Types, source states, inspected text-only sizes, root/nested padding, gaps, radii and selected treatment. The second distinguishes parent heights/gaps, typography, icon slots, shared Badge context versus standalone Medium, verified borders/alignment and unresolved evidence. Both have captions and column/row headings inside named keyboard-accessible horizontal scroll regions. Nested surface border alignment remains local, while Badge inside alignment is verified. Selected color #155DFC is source-backed; 2px thickness stays LOCAL / PROVISIONAL. The Anatomy is the only annotated component illustration in this section; the tables precede the unchanged actual-size reference and Reference notes. No combined component width is asserted as measured.

## Actual component reuse

`Tabs` → `TabAtom` → optional SVG slot, label, shared `Badge`, optional SVG slot.

- `src/oxygen-tabs/Tabs.tsx`: controlled selection, focus, keyboard and unique panel relationships. No application routing or persistence.
- `src/oxygen-tabs/TabAtom.tsx`: reusable stateless visual/control unit, independent of panel management. `TabAtomSpecimen` supplies noninteractive gallery composition.
- `src/oxygen-badge/Badge.tsx`: the same portable reference implementation consumed by CS-03 through `stories/cs-03/ReferenceBadge.tsx` and directly by CS-05. The CS-03 adapter remains Storybook-only. Existing Close behavior remains available to CS-03 but is off inside Tabs.
- `lucide-react`: existing replaceable SVG rendering mechanism. Artwork is illustrative; decorative icons are not Icon Buttons. No new Icon primitive is required.
- `ReferenceGuide.tsx`, MDX and story CSS: Storybook-only documentation, guides and demo controls.

Figma has actual nested Icon and Badge instances under its Container. That design hierarchy informs composition without mandating a production React tree. Original vectors and component variable bindings are unverified.

Badge source configuration is **Round / Outlined / Medium / Default**, label “2”, Close=false, Icon start=false. Standalone CS-03 Medium stays minimum 24px with 4px vertical / 10px horizontal padding. Tabs-context Medium changes only minimum height to 20px and block padding to 2px. Keep the source Size Medium. All four inspected Active Types have measured Badge geometry 27×20px, 11/16px type at weight 500, fill #F2F3F5 and 1px inside #D1D5DC edge. Browser Hug width for “2” is about 26.44px with the bundled font, not exact source 27px; longer values remain content-driven. Foreground and Hover/Inactive Badge combinations remain unverified.

## Interaction and accessibility

Manual activation is a local decision compatible with the [WAI-ARIA APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Left/Right wrap focus; Home/End focus endpoints; Enter/Space/click select. Selection and focus are independent. One tablist entry stop and a focusable visible panel support keyboard traversal; hidden panels are excluded. Every instance has unique bidirectional tab/panel IDs. Decorative content has no extra action or tab stop. Pointer icon hits activate the tab; keyboard focus stays visible on the tab.

Responsive behavior is one horizontally scrollable row, with focused tabs revealed locally and 6px focus clearance. No wrapping, truncation or overflow menu is inferred. Forced colors uses system-color focus/edge fallbacks and selected-label underline. The reference retains compact source targets; full touch, contrast and screen-reader certification require contextual review. No Disabled, Focused, Loading or Error source state is invented.

Use tabs for peer sections in one workspace. Use links for destinations and appropriate choice/filter controls for filtering. Optional trailing artwork does not create a close/menu action. The six usage configurations are synthetic and use one live Tabs instance. No Data Grid integration is implemented.

## Reproducible local QA

Use existing browser tooling; set `PLAYWRIGHT_MODULE` to its installed Playwright entry and `BROWSER_PATH` to Chrome or Edge. No tool download is required by these scripts.

```text
npm run lint
npm run typecheck-storybook
npm run build
npm run build-storybook
git diff --check
node scripts/cs-05.browser.mjs <local-storybook-base>
node scripts/cs-05-anatomy.browser.mjs <local-storybook-base>
node scripts/tf-01.browser.mjs <local-storybook-base>
```

The focused scripts write screenshots/results into ignored local context. Coverage includes five styles, twelve atom states, eight content combinations, both icon pointer paths, manual keyboard activation, panel relationships, native Docs Controls/reset, all Docs sections, usage configurations, forced colors, anatomy endpoint/leader geometry and 320/390/768/1280px overflow checks. They also smoke-test CS-01/02/03/04 and the local Data Grid. CS-03 visual parity is compared separately against the accepted local baseline, including all 15 Type/Color combinations, optional content and Close interactions. Browser checks are not assistive-technology certification.

Remaining review: exact source indicator thickness, source artwork/bindings, alternate modes, enabled-content widths, Badge foreground/states and font-metric width discrepancy. Local results and screenshots are review evidence, not a claim of public publication. Release requires designer review and separate authorization; no commit, push, deployment or Drive update is included.
