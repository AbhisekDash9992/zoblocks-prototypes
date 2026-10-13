# ZoBlocks Prototypes

An interactive prototype and review repository for exploring proposed ZoBlocks behavior before production engineering. Intended for design review, interaction validation, and stakeholder/developer walkthroughs.

**Prototype code only.** This is not production ZoBlocks code, a production package, an API contract, or the developer implementation architecture. Production developers remain responsible for actual implementation and engineering decisions.

## Run locally

Stack: React, TypeScript, Vite, and normal CSS. Use a Node version supported by Vite (Node 20.19+ or 22.12+; Node 24 is suitable).

From the repository root in PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the URL printed by Vite, under `/zoblocks-prototypes/`. Use `npm.cmd` if PowerShell blocks `npm.ps1`; no execution-policy change is needed.

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run preview
```

Build includes TypeScript validation. The Vite base path remains `/zoblocks-prototypes/`. The prepared GitHub Pages workflow assembles the application and Storybook into one artifact and uses one deployment.

## Foundation

- `src/app/`: landing page and app composition.
- `src/prototype-system/`: shared shell, host-mode type, temporary shell styling, and reserved components/utilities folders.
- `src/prototypes/`: future reviewed interactive explorations.

The landing page links to the Data Grid prototype at `/zoblocks-prototypes/#/data-grid`. ZoBlocks, Ant Design, and Material UI are typed future presentation modes; framework skins and packages are not included. Future modes should share one behavior/state model.

Shell styling is temporary and does not establish final ZoBlocks brand tokens.

## CS-01 Storybook

```powershell
npm.cmd run storybook
npm.cmd run typecheck-storybook
npm.cmd run build-storybook
```

Open `http://localhost:6006/?path=/docs/cs-01-icon-button--docs`. The native Docs page includes working Controls, anatomy, live geometry and minimal Filter/Sort examples. Only Small Square Ghost/Ghost-primary are coded. The opted-in reference uses the approved 6px Oxygen-local radius; existing application buttons retain their current appearance and behavior. Colors, icon art and focus fidelity are explicitly provisional.

This designer-owned, non-production handoff library is not the actual Joblogs design-system implementation. Storybook output is isolated in ignored `storybook-static/`; its CSS is loaded only by Storybook. No private source images or Drive files are included. Ghost-primary Disabled remains pending: the exact `icon/brand-disabled` value is unresolved and its color specimen is withheld. Other color mappings, icon art, the Ghost-primary outer focus binding, tooltip design and touch-target suitability remain provisional. The full 120-variant matrix is reference-only.

Focused browser QA uses the existing external tooling convention:

```powershell
# Set PLAYWRIGHT_MODULE to an installed Playwright entry file and BROWSER_PATH to Chrome/Edge.
node scripts/cs-01.browser.mjs http://localhost:6006 http://localhost:5173/zoblocks-prototypes/#/data-grid
```

The browser check does not write screenshots or public artifacts. Automated geometry and keyboard checks do not certify complete accessibility or exact Figma visual fidelity.

## Combined Pages preparation

Use Node 24 (locally tested with Node 24.19.0 / npm 11.17.0). In a fresh checkout or an isolated source copy outside an existing development worktree:

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck-storybook
npm.cmd run build-pages
npm.cmd run check-pages
# Uses an existing external Playwright installation and Chrome/Edge; installs nothing.
$env:PLAYWRIGHT_MODULE = '<absolute path to existing playwright/index.mjs>'
$env:BROWSER_PATH = '<absolute path to Chrome or Edge executable>'
npm.cmd run qa-pages
```

`build-pages` runs the existing application build, Storybook build and portable Node assembly. The assembler validates required files, rejects private/evidence output and collisions, and preserves every application file byte for byte. It never deletes or replaces an existing artifact: repeat checks can reuse it; a repeat build requires a fresh directory. For alternate build directories use `node scripts/assemble-pages.mjs <app-dir> <storybook-dir> <new-output-dir>` and `node scripts/pages-artifact.browser.mjs <output-dir> [--static-only]`.

```text
pages-artifact/       (ignored generated output)
  index.html
  assets/
  storybook/
    index.html
    iframe.html
    index.json
    assets/
    sb-manager/
    sb-addons/
    sb-common-assets/
```

Existing app: https://abhisekdash9992.github.io/zoblocks-prototypes/#/data-grid

Proposed Storybook: https://abhisekdash9992.github.io/zoblocks-prototypes/storybook/?path=/docs/cs-01-icon-button--docs

Storybook's existing relative `./` base handles nested preview assets; the application's base is unchanged. QA serves the actual `/zoblocks-prototypes/` prefix and checks direct links, reloads, Controls, manager/iframe navigation, fonts and critical network/console failures. It also reuses the existing CS-01 behavior tests and opens the existing Group/View Settings surfaces. The optional host-root `/favicon.ico` 404 is reported separately; other failures stop QA. The local redirect test models directory slash behavior; future live Pages behavior still requires verification.

The single workflow uses `npm ci`, lint, Storybook type-check, combined build and dependency-free static artifact/path/content checks before upload. Full Chrome/Edge QA is local using existing external tooling. Pattern scans do not prove the absence of PHI or unknown secrets; source review remains required. No source maps, raw screenshots, evidence archives, environment files or private context belong in the public artifact.

Gate 1 authorizes local preparation and validation only. Gate 2 requires explicit approval of the complete uncommitted CS-01/publication diff and commit scope. Pushing to `main` triggers publication automatically, so push/deployment approval is a separate gate. No workflow dispatch, push or release is authorized by local preparation. Before release the designer must choose whether to resolve the exact disabled token first or publish a limited pilot with the specimen explicitly pending.

If a future approved publication breaks Pages, review a safe revert of the publication changes and redeploy through this same workflow, then retest the Data Grid route and behavior. The last verified app-only deployment is `5f23b28e4733607da779421462beeaf182338bf4`. Preserve intervening unrelated work; use reviewed revert commits, never reset or force-push. No rollback is performed during local preparation.

## Public repository safety

Use synthetic/demo data only. Never add PHI, real patient data, secrets, private Drive/Figma material, internal-only screenshots, or internal meeting notes. Keep supplemental local context in ignored `.local-context/` and environment files untracked. Review every change before publishing.
