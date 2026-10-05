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

Build includes TypeScript validation. The Vite base path is prepared for `/zoblocks-prototypes/`; GitHub Pages deployment is not configured.

## Foundation

- `src/app/`: landing page and app composition.
- `src/prototype-system/`: shared shell, host-mode type, temporary shell styling, and reserved components/utilities folders.
- `src/prototypes/`: future reviewed interactive explorations.

The landing page contains a Data Grid placeholder only. ZoBlocks, Ant Design, and Material UI are typed future presentation modes; framework skins and packages are not included. Future modes should share one behavior/state model.

Shell styling is temporary and does not establish final ZoBlocks brand tokens.

## Public repository safety

Use synthetic/demo data only. Never add PHI, real patient data, secrets, private Drive/Figma material, internal-only screenshots, or internal meeting notes. Keep supplemental local context in ignored `.local-context/` and environment files untracked. Review every change before publishing.
