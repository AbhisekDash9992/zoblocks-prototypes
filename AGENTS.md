# Repository guidance

- Prototype/review purpose only: not production ZoBlocks code, API contracts, or developer implementation architecture.
- Read existing code before editing. Keep implementation proportional; avoid production-app architecture.
- Use one shared behavior/state model for ZoBlocks, Ant Design, and Material UI presentation modes.
- Host-framework visual chrome may adapt; never silently replace healthcare/clinical semantics with generic framework semantics.
- Do not invent unresolved design or product behavior.
- Use synthetic/demo data only. Never expose secrets, PHI, real patient data, private Drive/Figma material, internal-only screenshots, or internal meeting notes.
- Reuse shared `src/prototype-system/` code before duplicating it.
- Do not change shared prototype design-system code or tokens without explicit approval. Shell styling is temporary, not final ZoBlocks branding.
- If `.local-context/` exists, treat it as supplemental local-only context and never commit it.
- Do not commit or push unless explicitly requested.
