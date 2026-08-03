# ADR-0019: A `vertical:*` tag axis makes vertical isolation a lint error

- Status: Accepted
- Date: 2026-07-30
- Builds on: [ADR-0009](0009-nx-monorepo-boundaries.md) (one `layer:*` tag per
  project, boundaries enforced by `@nx/enforce-module-boundaries`) and
  [ADR-0017](0017-giro-isolation.md) (verticals are fully isolated — this ADR
  is the mechanism 0017 asked for and could not yet provide).

## Context

ADR-0017 decided that business verticals ("giros") are isolated worlds sharing
code at compile time only, and that **nothing vertical-specific may enter the
shared libs**. It shipped that rule as prose, and said so in its own guardrails:

> imports BETWEEN giro dirs inside `libs/ui` are NOT yet lint-enforced
> (`libs/ui` is one Nx project) … Until then, review guards naming/content drift.

The drift arrived before the second vertical did. Three symptoms, all in tree
today:

1. **`apps/` is flat** — `api, app-b, bison-manager, client, dashboard, desktop,
mobile, web`, every one tagged only `layer:app`. Nothing in the tree or in
   the lint says which vertical an app belongs to.
2. **`libs/ui/src` mixes worlds** — the design system (shared) sits beside
   `bison-manager/dashboard` (a vertical's screens) and `dashboard`, `client`,
   `access`, `example` (template screens), with no boundary between them.
3. **The DI seam leaks across verticals.** `AppUseCases` in
   `libs/ui/src/di/use-cases-context.tsx` is a shared type that enumerates one
   vertical's features: `items` (a template feature) is **required**, and
   twelve of its remaining fields are documented "Present in the staff
   dashboard". Bison pays for this in code — its composition root instantiates
   a dead Item repository with the comment _"Unused stub: this app satisfies
   AppUseCases but renders no item screens."_ Meanwhile every bison field is
   optional, so bison's own screens defensively guard a `undefined` that never
   occurs.

Symptom 3 is the important one: it is not sloppiness, it is the predictable
result of having no place to say "this belongs to one vertical". A second
vertical would have added its own optional fields to the same shared type, and
all three verticals would read each other's contract.

The root cause is granularity. Tags live in `project.json`, and there is **one
Nx project per layer** — so `layer:ui` is the finest distinction the boundary
rule can make. Enforcing per-vertical isolation requires per-vertical projects.

## Decision

**Add a second tag axis, `vertical:*`, orthogonal to `layer:*`.** Every project
carries exactly one of each. `@nx/enforce-module-boundaries` evaluates every
constraint whose `sourceTag` matches and requires the dependency to satisfy all
of them, so the two axes compose with no matrix to maintain:

```js
{ sourceTag: 'vertical:core',  onlyDependOnLibsWithTags: ['vertical:core'] },
{ sourceTag: 'vertical:bison', onlyDependOnLibsWithTags: ['vertical:bison', 'vertical:core'] },
{ sourceTag: 'vertical:lab',   onlyDependOnLibsWithTags: ['vertical:lab', 'vertical:core'] },
```

The first line is the one ADR-0017 was missing: **shared code may depend only on
shared code**, so anything vertical-specific that leaks into core fails `nx
lint`. The rest give each vertical the same shape, and A never sees B.

### Layout

Core keeps the bare layer names. Anything belonging to one vertical hangs off
`verticals/`:

```
libs/
  shared/ domain/ application/ infrastructure/ platform/ ui/   vertical:core
  verticals/
    bison/  ui/ (domain, application when it has its own)      vertical:bison
    lab/    domain/ application/ ui/                           vertical:lab
apps/
  bison/  dashboard/ api/                                      vertical:bison
  lab/    dashboard/ client/ web/ desktop/ mobile/             vertical:lab
```

Deliberately _not_ `libs/core/<layer>/`: relocating six projects would touch
four config files each plus every path in vitest/tsconfig/harness/docs, and buy
nothing the tag does not already enforce. The bare name reads as "the shared
engine"; `verticals/` reads as "belongs to one world". Aliases stay `@acme/ui`
for core and gain `@acme/<vertical>-<layer>` for slices, so the pending
`@acme` → `@viiento` rename remains a single `sed`.

### `lab` is the reference implementation, not a junk drawer

The template code becomes a real (fake) vertical: its own `AccessConfig`, its
own domain slice (the canonical `Item`), its own dashboard + client + web +
desktop + mobile apps. Three consequences, all wanted:

- **Standing up a vertical is "copy `lab`"** — a stronger instruction than
  "copy the Item example", and one that cannot go stale, because lab is built
  and tested like any other vertical.
- **Lab is the canary.** Until a second real vertical exists, lab is what proves
  core stayed generic: if bison-specific code creeps into a shared lib, lab
  stops compiling.
- **`apps/app-b` is absorbed.** ADR-0017 introduced it as the living proof that
  `AccessConfig` is injectable; a complete vertical proves that better than two
  spec files, and lab inherits the role.

### The DI seam becomes parametric

Core stops naming anyone's use cases. It provides the mechanism; each vertical
declares its own bundle, with **required** fields:

```ts
// core — knows nothing about what use cases exist
export const createUseCasesSeam = <T>() => ({ UseCasesProvider, useUseCases });

// libs/verticals/bison/ui
export const { UseCasesProvider, useUseCases } =
  createUseCasesSeam<BisonUseCases>();
```

This is what removes bison's dead Item stub and the defensive `?.` in its
screens. It is not a side quest: without it, splitting `libs/ui` is impossible,
because both verticals import the same concrete type.

### Known exception: the `Item` slice stays in core, for now

Lab's UI moved; its `Item` domain/application/infrastructure slices did not.
Extracting them surfaced a coupling that predates this ADR: **the offline-first
sync engine (ADR-0007) is written against `Item`, not against an entity
abstraction** — `sync-engine.ts` and `dexie-db.ts` import `ItemDto` /
`ItemRepository` directly. Only lab's apps use it; bison is online-only.

Moving `Item` into lab would therefore drag the whole offline stack in with it,
and a vertical cannot be imported by another vertical — the capability would be
buried inside the reference implementation, unreachable the day a real vertical
wants offline. The right fix is to make the sync engine generic over an entity
and _then_ move `Item`, which is design work, not mechanics.

So `Item` stays in `libs/{domain,application,infrastructure}/src/example` and is
the one piece of vertical-flavoured code left in core. It is honesty debt, not a
leak: the boundary rule still cannot be violated without failing lint, because
`example` lives inside a `vertical:core` project. Revisit when the sync engine
is genericized.

## Signed trade-offs (owner, 2026-07-30)

- **N verticals = N sets of lib projects.** Each new vertical adds
  `project.json` + tsconfig + vitest per layer it actually uses. Accepted: it is
  the same plurality ADR-0017 already signed for runtime, and it is what buys
  per-vertical `nx affected` (today, touching bison rebuilds everything).
- **Template code is now built and tested for real.** Lab is not excluded from
  the gate, so its screens must keep passing. Accepted deliberately: template
  code that does not compile is worse than no template.
- **Two axes to tag correctly.** A new project missing `vertical:*` gets no
  constraint and silently escapes isolation. Mitigated by the guardrail below.

## Guardrails

- Every `project.json` carries exactly one `layer:*` **and** one `vertical:*`
  tag; the structure sensor fails a project missing either.
- Core may never depend on a vertical — enforced by the `vertical:core` line
  above, not by review. ADR-0017's "review guards naming/content drift" note is
  superseded by this ADR.
- A vertical's own domain lives in `libs/verticals/<name>/domain`, never in
  `libs/domain`. `libs/domain` holds only vertical-agnostic engines (access,
  billing).
- Per-vertical data keeps ADR-0017's rule: separation is by project/schema,
  never a discriminator column in a shared table.

## Consequences

- The tree answers "who owns this?" without reading imports, which is what the
  flat `apps/` could not do.
- The day a second real vertical exists, its isolation is one `depConstraints`
  line — and it is enforced from the first commit rather than retrofitted.
- `nx affected` scopes to a vertical, so CI stops running bison's suite for a
  lab-only change.
- "Vertical" replaces the mixed English gloss in the harness docs: CLAUDE.md
  called these "products", ADR-0017 called them "business verticals". One word
  now, with _(giros)_ kept once as a bridge to the owner's vocabulary.
