# Oxygen reference tokens

TF-01 is a portable, opt-in reference derived from the designer-supplied 14 October 2026 Oxygen Figma inspection register, reconciled with the 22 October native Figma exports. Native evidence takes precedence on conflicts. It is not certification of an official production ZoBlocks token system. `catalog.json` contains public-safe derived values and evidence metadata; `tokens.css` works without React, Storybook or the catalog. No existing component is migrated.

```tsx
import './oxygen-reference-tokens/tokens.css'

<section data-oxygen-mode="light" className="future-example">…</section>
```

```css
.future-example {
  background: var(--ox-bg-primary);
  color: var(--ox-text-primary);
  padding: var(--ox-space-200);
  border-radius: var(--ox-radius-md);
  font: var(--ox-type-body-medium);
  letter-spacing: calc(var(--ox-letter-spacing-normal) * 1px);
}
```

Choose `light` or `dark` explicitly on each scope. Both modes define all 87 semantic aliases, including aliases that intentionally remain identical. Nested scopes re-resolve aliases. Importing CSS alone changes no rendered property, global theme or reset. Use text, icon, background and border roles separately. Component bindings require component evidence.

## Names and representations

- Primitive `blue/700` → `--ox-color-blue-700`; semantic `text/brand-primary` → `--ox-text-brand-primary`. Semantic properties reference primitive properties with `var()`.
- Raw typography names map to `--ox-font-*`, `--ox-line-height-*`, `--ox-letter-spacing-*`. Names are lowercased; spaces/slashes become hyphens. Raw numbers stay unitless, and raw weight names stay named. Use `calc(... * 1px)` only when dimensional use is supported. The separate `--ox-css-weight-*` helpers interpret Regular/Medium/Semi Bold/Bold as 400/500/600/700.
- Space and radius have dimensional px representations. `--ox-radius-full: 9999px` is a pill sentinel, not an element width.
- Twelve `--ox-type-{style}-{size}` font shorthands compose inspected family, weight, size and line-height. Reusing equal-valued size/line-height variables is a local assembly choice, not proof of Figma alias bindings; weight bindings are recorded in the source. Button/medium alone has a style-local `22px` line-height; no global `line-height/22` is defined. All twelve have inspected zero tracking. Case, trim, paragraph and list settings are evidence metadata, not imposed browser behavior. Font fallbacks are local web choices; no fonts are imported here.
- `--ox-shadow-sm`, `md`, `lg` retain both visible layers through layer aliases. `--ox-shadow-xl-visible` describes only the inspected visible layer. There is intentionally no complete `--ox-shadow-xl` definition. CSS box-shadow is a browser representation; Figma's behind-transparency behavior is recorded in the catalog and not promised by CSS.

## Native reconciliation

Combined evidence supports **124 known primitives**: the existing 121 scale values plus white, black and transparent. The native export confirms 99 scale values and the three specials; the 22 brand-1/brand-2 scale values remain supported by the older register and are preserved. No separate Dark primitive palette was inspected. The 87 semantic entries have independently verified Light/Dark mappings.

`--ox-color-white: #FFFFFF` is a verified standalone primitive. All nine white-alias mode occurrences now reference it directly, without a fallback or consumer override. `--ox-color-black` aliases `--ox-color-gray-950` (#030712), not #000000. `--ox-color-transparent` is literal #000000 at 0% alpha, not a reference to the differently colored black alias. Directly exported text/on-dark-disabled (50% white) and icon/on-dark-disabled (80% white) remain separate colors; do not apply opacity to a whole container.

Two older aliases are explicitly superseded: **Light border/brand-primary** changes blue/500 → blue/600 (#155DFC), while Dark remains blue/500; **Dark icon/danger-primary** changes red/700 → red/500 (#FB2C36), while Light remains red/700. `catalog.json` records these mode-specific changes in `supersededAliases`.

The native Figma name is misspelled **bg/success-disbaled**. `sourceNameNormalizations` records its normalization to the existing public **bg/success-disabled** / `--ox-bg-success-disabled`. Light green/500 and Dark green/800 stay unchanged. No misspelled public CSS alias is added.

## Unknown and provisional

`Label` is list-only (12/16); family, weight and tracking remain uninspected, so no named style composition is exported. Nonzero raw tracking units remain unresolved. Advanced Details/Variable text settings and the technical label of the first vertical-trim option remain unknown.

Seven shadow records preserve ten visible layers; the extra hidden xl layer has unknown parameters and is omitted. None of these establishes a component focus-ring binding. Five gradient records preserve exact source names, including two distinct `Gradient` entries identified by catalog order. Only endpoint colors, stop positions 0%/100%, linear fill and 100% opacity were inspected. No gradient CSS or angle is invented.

Private native JSON, variable IDs, source text, screenshots, links and hashes stay in ignored local context. Only derived values, public token names and concise reconciliation metadata enter the catalog. The source register contains older CS-01 correction notes; current accepted pilot code and its newer component evidence take precedence when describing today's implementation. The earlier source-review ZIP predates this reconciliation and is not refreshed by this task.

## Validation

`node scripts/tf-01.check.mjs` validates catalog/CSS agreement, coverage, aliases, scoping and unknown-value guards. When available, all five local native exports are compared against derived values and aliases in both modes, including the normalized spelling. The older private register is still checked, with exactly the two superseded mode-specific mappings reported explicitly. An explicit register path may be supplied as the first argument and a native sources directory as the second. A public checkout without private evidence reports those comparisons as skipped; a present but incomplete native bundle fails.

`node scripts/tf-01.browser.mjs http://127.0.0.1:6011` checks browser resolution, nested modes, narrow navigation and existing Storybook pilots with installed external Playwright and Chrome/Edge. Set `PLAYWRIGHT_MODULE` and `BROWSER_PATH` to those existing installations. No prototype suite is invoked.
