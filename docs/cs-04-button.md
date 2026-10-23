# CS-04 Oxygen Button — local implementation and QA

22 October 2026. Baseline: `main` at `a33557aa63c235c88ab38d91bd556bf0928713ee`; initial working tree clean. Local implementation/review only. No commit, push, deployment or Drive update.

## Changed files

| File | Purpose |
| --- | --- |
| `.storybook/main.ts` | Register CS-04 stories and MDX. |
| `.storybook/preview.tsx` | Bypass `.dg-page` for CS-04; preserve existing branches. |
| `src/oxygen-button/Button.tsx` | Standalone typed React renderer and forwarded ref. |
| `src/oxygen-button/button.css` | Geometry, separate text/icon roles and native pseudo-states. |
| `stories/cs-04/Button.stories.tsx` | Playground, seven native Controls and five story entries. |
| `stories/cs-04/Button.mdx` | Docs, API, evidence provenance and accessibility notes. |
| `stories/cs-04/ReferenceGuide.tsx` | 120-state matrix, icon configurations, native behavior, anatomy and token table. |
| `stories/cs-04/button-reference.css` | CS-04 specimen/documentation surroundings and contained horizontal scrolling. |
| `stories/cs-04/stateReference.ts` | Storybook-only selectors derived from actual hover/focus declarations. |
| `scripts/cs-04.browser.mjs` | Focused browser QA using installed external tooling. |
| `scripts/cs-04-anatomy.browser.mjs` | Anatomy refinement QA and focused behavior/Docs checks, without private evidence dependencies. |
| `docs/cs-04-button.md` | This handoff. |

Shared TF-01 definitions, shared prototype-system code, CS-01/02/03 sources and prototype consumers are unchanged. No dependency or lockfile changes. Private evidence, local QA scratch scripts/results, baseline measurements and screenshots remain ignored under `.local-context/`.

## Reusable API

Import from `src/oxygen-button/Button`. The renderer imports its own CSS and opt-in TF-01 variables, uses React only, loads no font and imports neither Storybook nor prototype code.

```tsx
import { Button } from './src/oxygen-button/Button'
import { Plus, ArrowRight } from 'lucide-react'

<section data-oxygen-mode="light">
  <Button
    variant="primary"
    shape="square"
    size="medium"
    label="Add item"
    leadingIcon={<Plus />}
    trailingIcon={<ArrowRight />}
    onClick={handleAdd}
    ref={buttonRef}
  />
</section>
```

`variant`: primary / secondary / danger / text-primary / text-secondary. `shape`: square / round. `size`: large / medium / small. The local defaults are primary / square / medium, with no icons. `label` is a required visible string; blank labels render no unnamed action. Both icon slots accept decorative SVG React elements using currentColor, independently or together. Native button props and an HTMLButtonElement ref are forwarded; `children` is excluded. Native `type` defaults to button; explicit submit/reset remains available. There is no public state prop. `iconLeft` and `iconRight` exist only as Storybook Controls adapters.

## Evidence and token mapping

The designer-supplied 22 October component inspection for Oxygen Button covers all 120 variants without truncation or errors. The implementation preserves its derived geometry, font sizes/line heights, root fills, text colors, borders and effect layers. The full Light mapping table is in Storybook Docs.

- Primary uses TF-01 brand-solid / brand-solid-hover / brand-disabled surfaces; Danger uses the corresponding danger surfaces.
- Secondary uses white / primary-hover / disabled-secondary backgrounds and secondary / primary / disabled border roles. Text-only Types retain transparent Default/Disabled surfaces and the inspected tinted Hover/Focused fills.
- Text and icon roles remain separate. Disabled solid text uses `--ox-text-on-dark-disabled` (50% white); icons use `--ox-icon-on-dark-disabled` (80% white). The text value is component evidence; the separate icon role/alpha follows the task and verified TF-01 definitions, with component icon bindings unverified.
- Published space, radius and Button typography compositions are reused. Square radii are 10/8/6px for all five Types; Round uses 9999px. Large Square is 40px high and Large Round is 36px; Medium is 30px and Small 24px. Icons are 18/16/14px.
- Focus preserves 2px white separation and color extending to 4px. Component-local primitive reuse preserves blue/600, red/600 and gray/600 ring colors without inventing a shared focus token.
- Secondary's default shadow remains the inspected `0 1px 2px #101828 / 5%`; TF-01 shadow/xs has a different color and is not substituted.

Component alias IDs are unresolved: equal TF-01 values do not establish source bindings. DM Sans / weight 500 / zero tracking are provisional reuse of TF-01; only component font size/line height is in the digest. Source icon artwork and per-state icon fills are uninspected. The visible 1px edge is represented with an inset painted border to preserve supplied padding/heights; source alignment is unresolved. All inspected specimens explicitly use Light. Dark parity is not claimed. Long-label wrapping is a documented local resilience choice.

## Coverage and QA

The matrix contains exactly **2 × 5 × 3 × 4 = 120** unique Shape / Type / Size / State specimens, using synthetic labels. Static Hover and Focused recipes are derived only in Storybook from the renderer's real CSS; native Disabled is never simulated. Comparison buttons are excluded from Tab order. Separate behavior examples use live native interaction.

| Check | Result |
| --- | --- |
| `npm.cmd run lint` | Passed. |
| `npm.cmd run typecheck-storybook` | Passed. |
| `npm.cmd run build-storybook` | Passed; existing large-chunk/performance notices remain. |
| `node scripts/cs-04.browser.mjs http://127.0.0.1:6013` | Passed with external Playwright and installed Chrome. |
| Local CS-01/02/03 baseline comparison | Passed: computed properties, dimensions, focused behavior and Docs rendering unchanged. |
| `git diff --check` | Passed. |

PowerShell uses `npm.cmd` because this machine blocks the npm.ps1 launcher. Storybook bundling required approved execution outside the Windows sandbox; no dependency downloads or changes were needed. Browser tooling uses the existing `PLAYWRIGHT_MODULE` and `BROWSER_PATH` environment setup documented by the other repository browser scripts.

Focused browser coverage includes:

- All 120 cases checked independently against the local evidence for height, padding, gaps, radii, font size/line height, fill, text alpha, visible edge and shadow/focus layers.
- Actual hover and keyboard focus compared with static references across all 30 Shape / Type / Size combinations.
- 24 icon specimens checked for dimensions, content-based widths, gaps, aria-hidden/non-focusable SVGs and inherited colors; separate disabled text/icon alpha verified.
- All 30 axis configurations × four icon settings exercised through native Docs Controls, plus disabled, reset, cleared selects and empty/long labels.
- Pointer, Enter and Space activation; native disabled blocking and Tab skipping; forwarded-ref focus; default button versus explicit submit; forced-colors focus outline.
- All five stories and Docs at 1280/768/390/320px, with no document overflow. All 120 matrix heights remain source-accurate; comparison tables scroll by keyboard. Long labels with both icons wrap without clipping.
- No unexpected browser runtime, console or network errors. Screenshots visually reviewed at wide and narrow widths.

The regression baseline came from the existing pre-change static Storybook before rebuilding. No unrelated prototype browser suite was run. These checks do not certify screen-reader behavior or complete accessibility conformance.

## Outstanding review questions

Confirm component alias identities; icon paths, painted bounds and per-state fills; font family/weight/tracking; border alignment; long-label guidance; compact touch-target suitability; and Dark appearance. Active, loading and selected appearances are uninspected and not added.

## Local review and Git state

Local built preview: <http://127.0.0.1:6013/?path=/docs/cs-04-button--docs>. The local static server serves `storybook-static` only.

Final Git state: two modified Storybook configuration files and ten new files listed above; nothing staged. `main` HEAD remains `a33557aa63c235c88ab38d91bd556bf0928713ee`. No commit, push, deployment or Drive update.

## Designer-requested anatomy correction and structural review

The original actual-size Button plus numbered list did not follow the accepted anatomy presentation. The correction follows CS-03's restrained schematic/legend arrangement, with 24px spacing and CS-04-scoped styles. Both the Anatomy story and Button Docs use the same `Anatomy` renderer.

Changed during this correction only:

- `stories/cs-04/ReferenceGuide.tsx`: enlarged SVG schematic, eight external numbered callouts, routed leaders/dots, accessible legend and title/description. The actual-size renderer is secondary; GeometryTable values are unchanged.
- `stories/cs-04/button-reference.css`: scoped diagram/legend layout, solid focus fills, construction guides and responsive marker sizing.
- `stories/cs-04/Button.mdx`: consistent eight-part anatomy description, scale and evidence limitations.
- `scripts/cs-04-anatomy.browser.mjs`: standalone focused review checks that do not require private source evidence.
- `docs/cs-04-button.md`: this updated handoff and correction results.

The schematic uses 5× source-relative coordinates: 150px height, 20/60px padding, 30px gaps, 40px corner radius, 70/110px text and 80px icon boxes. The surface width is illustrative. Focus uses separate solid white and blue rectangles extending 10px/20px from the surface; dashed boxes identify only text and icon bounds. Number 7 terminates exactly on the surface's top-right radius arc, number 5 inside the bottom padding band, number 6 at the right gap bracket and number 8 inside the outer focus band. Decorative circles are not claimed as source glyph paths. SVG display scales to fit narrow pages while annotation markers/type enlarge independently for readability.

Structural review covered every current CS-04 source, story, CSS, MDX, state-reference and QA file, plus Storybook registration and the accepted CS-01/02/03 patterns. No additional component or story-structure defect was found in this focused review:

| Area | Evidence / finding |
| --- | --- |
| Registration and Docs links | `.storybook/main.ts` registers CS-04 CSF and MDX; `Button.mdx` references all five exported story entries. Manager and Docs rendering pass. |
| Isolation and native API | `src/oxygen-button/Button.tsx` imports React, its CSS and opt-in token CSS only. The standalone renderer has no Storybook/prototype imports. Defaults, native props and ref remain unchanged. |
| TF-01 | `src/oxygen-button/button.css` consumes published variables and keeps disabled text/icon roles separate. `ReferenceGuide.tsx` token table explicitly marks unresolved component bindings and typography/icon assumptions. Shared token definitions are unchanged. |
| Controls and reset | `Button.stories.tsx` retains seven native Controls; focused variant/icon/label edits and reset pass. The activation counter is intentionally independent of args. |
| Matrix | `ReferenceGuide.tsx` retains ten Shape/Type groups with 12 cases each, totaling 120 unique cases. State forcing remains Storybook-only in `stateReference.ts`. |
| Icons and behavior | `IconConfigurations` and `Behavior` remain unchanged. Native activation, disabled blocking/Tab skip, ref focus and form semantics pass. |
| Documentation CSS | All new diagram styles use the `cs04-` prefix. The existing shared documentation classes are consumed without modification. Story/Docs fit the tested widths. |
| Evidence/accessibility | Font family/weight/tracking, aliases and icon artwork remain explicitly provisional. Source stroke alignment, compact targets, long-label guidance and Dark appearance still require review. No new product behavior is introduced. |

Review reproducibility limitation: the original `scripts/cs-04.browser.mjs` reads the ignored Figma evidence digest to check all source-derived values. That private digest is intentionally excluded from the ZIP. The new `scripts/cs-04-anatomy.browser.mjs` can run without it against a local Storybook build in a baseline repository checkout with existing browser tooling. This is a source-review bundle, not a standalone dependency/vendor or compiled-site bundle.

Correction QA completed:

- `npm.cmd run lint`: passed.
- `npm.cmd run typecheck-storybook`: passed.
- `npm.cmd run build-storybook`: passed; existing chunk-size/performance notices remain.
- `node scripts/cs-04-anatomy.browser.mjs http://127.0.0.1:6013`: passed.
- Story and Docs at 1280, 390 and 320px: eight visible legend entries, unclipped numbered markers, no line intersections or marker collisions, precise endpoints, solid separate focus layers, correct source-relative dimensions and 30px actual specimen. The smallest rendered annotation number was 12.57px in 320px Docs. No horizontal document overflow or unexpected browser errors.
- Wide and narrow synthetic captures were visually reviewed. CS-04 native behavior/Controls smoke and CS-01/02/03 manager/Docs anatomy regression checks passed. No unrelated prototype suite was run.
- Initial implementation's full 120-case source/color QA above is historical and retained; this correction leaves the reusable Button and matrix logic/styles unchanged and runs the focused refinement suite.

Source-review archive: `.local-context/CS04_Source_Review.zip`. It contains current CS-04 implementation/story files, the two current Storybook configuration files, both QA scripts, this handoff and root `REVIEW_SUMMARY.md`, preserving repository-relative paths. Private evidence, screenshots, credentials, exports, dependencies and built artifacts are excluded.
