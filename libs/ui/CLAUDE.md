# libs/ui — `layer:ui`, `vertical:core`

The SHARED half of the UI. **May import `application` and `shared` only.**

- **Holds:** the design system (used by every vertical), the React DI seam
  factory, the dev debug bridge, and shared identity chrome —
  `src/{design-system,di,debug,identity}`. Shared chrome takes its use cases as
  **props**: core instantiates no vertical's seam and so cannot read one.
- **Does NOT hold a vertical's screens.** Since
  [ADR-0019](../../docs/adr/0019-vertical-tag-axis.md) each vertical's UI is its
  own Nx project — `libs/verticals/<name>/ui`, tagged `vertical:<name>` — and
  this project is tagged `vertical:core`, so the boundary rule fails the build
  if vertical-specific UI lands here. A vertical reaches the design system
  through `@acme/ui`, never by a relative path out of its own tree. Layout and
  Storybook titles: [screens.md](../../docs/ai/screens.md).
- **Forbidden:** `infrastructure`, `platform`, **and `domain`**. A screen never
  news up an adapter and never imports the DB/native APIs.
- **Pattern (one-way flow — see [flows.md](../../docs/ai/flows.md)):**
  - A **component reads a ViewModel** from a store selector and **dispatches
    actions**. It holds NO orchestration: no `Promise.all`, no deriving `canX`,
    no building a permission set, no choosing which use case to call.
  - A **store** (Zustand) is a thin reactive cache + dispatch; each action just
    calls a headless **controller** in `application/flows` and `set(...)`s the
    result. Build it from the DI bundles in the app's `store/hooks.ts` (the ONLY
    place that reads `useUseCases`).
  - Cross-module orchestration lives in the controller, **never** in a component
    or a store. If a component decides anything beyond what to render, move it down.
  - Test components against the same DI mocks — the store reads them, so specs
    stay behavior-level. See
    [client/manage-org/manage-org-section.spec.tsx](src/client/manage-org/manage-org-section.spec.tsx).
  - State libs: Zustand for the flow stores; TanStack Query only for pure
    high-frequency reads; React Hook Form + Zod for forms.

Template (one-way slice): [client/manage-org](src/client/manage-org) +
[client/store](src/client/store) · DI: [src/di](src/di).
