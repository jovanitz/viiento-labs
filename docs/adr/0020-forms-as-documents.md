# ADR-0020: Forms become documents — semantic definition + shipped themes, never a free canvas

- Status: Accepted
- Date: 2026-08-17
- Amended by: [ADR-0021](0021-formats-wrap-printable-templates.md) — the
  per-template layout designer and `DocumentDefinition` are superseded;
  themes, tokens, issuance and the renderer port stand.
- Builds on: [ADR-0003](0003-result-over-exceptions.md) (expected failures are
  `Result`), [ADR-0004](0004-ports-and-adapters-as-types.md) (the renderer is a
  port), [ADR-0007](0007-offline-first-sync.md) (a document must be issuable
  with no network) and [ADR-0019](0019-vertical-tag-axis.md) (the engine is
  `vertical:core`, the template catalog is a vertical's).

## Context

A Template today is an identity plus `blocks` — an ordered **capture schema**,
edited in the Template Builder and filled into a Timeline entry. That part
works end to end.

Printing does not. The first-pass print designer places elements at absolute
`x`/`y` on a fixed 480×620 canvas and prints **field labels, not filled
values**, through `window.print()`. Its own header says as much: no PDF
library, no backend, real values are future work.

The gap is not "add a PDF exporter". Some forms are only records; others — a
prescription, a consent, a certificate, a discharge note — are **artifacts that
leave the business** and get handed to a person, sent over a channel, and
archived. That second kind has requirements the first never had: it must look
professional, it must survive being reprinted years later, and it must be a
file, not a browser dialog.

Free absolute positioning cannot deliver the first of those. Four structural
failures, none fixable by adding features:

1. **Variable-length content.** A "Diagnosis" value may be three words or three
   paragraphs. A box pinned at `x:140, y:220` either clips it or overlaps the
   box beneath. This alone disqualifies the model for real values.
2. **One page.** The canvas is a single fixed rectangle. Real documents spill
   and need header/footer repeated per page.
3. **Schema drift is silent.** Add a block to the capture schema and it simply
   does not exist on the layout — quietly absent from the printed document.
   For a clinical or legal artifact that is a defect, not a cosmetic gap.
4. **No aesthetic floor.** Alignment, a baseline rhythm, consistent margins,
   one type scale. A human dragging boxes at pixel precision never lands on
   them; everything ends up three pixels off.

Underneath all four is one mistake: **the free canvas makes the customer the
designer.** Design responsibility got handed to the party least equipped to
carry it, and the output quality then varies per customer — while every
customer expects the document to look good.

## Decision

### 1 — Split the three axes that the canvas collapsed into one

| Axis          | Defines                                               | Owner                |
| ------------- | ----------------------------------------------------- | -------------------- |
| **Content**   | which values appear, grouped how, labelled how        | the business         |
| **Structure** | flow, sections, rows, page regions                    | the business, guided |
| **Style**     | typography, density, rules, accent, letterhead, paper | **us, as product**   |

The customer decides **what** is on the document. We own **how it looks**. That
inversion is the whole ADR; everything below is mechanism.

### 2 — Flow layout with regions and rows; free position only for marks

A page is regions: `header` (repeats), `body` (flows and paginates), `footer`
(repeats). The body is a stack of sections; a section is a stack of rows; a row
distributes 1..N slots across the width. Reflow, pagination and
non-overlap come out of the model rather than out of the customer's care.

Absolute position survives for **marks only** — logo, scanned signature, seal,
QR — anchored to a region corner, never carrying a captured value.

The existing `FieldWidth = 'full' | 'half'` hint on `TemplateBlock` is exactly
this row-distribution intent and carries over.

### 3 — Themes are product artifacts, not user content

A `DocumentTheme` is authored by us, versioned with the app, and shipped as a
small catalog (Clinical, Formal, Minimal, Letterhead). The customer picks one
and supplies **three brand levers only**: logo, accent color, and the business
identity block. Everything else — type scale, label placement, field rules,
section rules, margins, density — belongs to the theme.

Font families are a closed union (`FamilyKey`), not a free string: the renderer
must embed the font to produce a byte-identical PDF anywhere, so we can only
offer fonts we ship and are licensed to embed.

### 4 — Non-captured content is a token, never a typed literal

The current designer's `kind: 'text'` is a literal string, which means the
customer types the date and it is wrong forever. Anything not captured by the
form resolves at render time from context:

```
business.name · business.logo · business.address
issuer.name   · issuer.license
client.name   · client.age
document.folio · document.issuedAt · document.qr
```

Static text remains available, but only for genuinely fixed copy (a legal
disclaimer), never for data that has a source.

### 5 — Presentation is per `FieldKind`, defined by the theme

A `signature` prints as rule + name + date. `checkboxes` prints as ☐/☒ items.
`date` prints formatted to the account locale. The theme owns these presenters;
the customer never positions or styles them.

### 6 — Documentability is opt-in and validated

Not every form is a document. `documentDefinition` is optional on a template —
absent means "capture only", which is the default and stays free.

Where present, issuing is gated by a pure check:

```ts
canIssue(definition, template) → Result<void, readonly IssueBlocker[]>
```

Blockers: a required block bound nowhere, an unresolvable token, missing paper,
a theme that no longer exists. A half-built document cannot be emitted.

### 7 — Issuance is a first-class immutable artifact

Emitting is not printing. An issue records `folio`, `issuedAt`, `issuedBy`, the
rendered bytes, and — critically — **a frozen snapshot of the definition and
theme version used**. Editing the template afterwards changes future issues
only; reprinting a two-year-old prescription reproduces the two-year-old
document. Issues are append-only: a mistake is voided and superseded, never
edited.

**Folio under offline-first.** A monotonic per-account sequence cannot be
allocated locally without coordination, and a printed folio can never be
renumbered after the fact. So the server grants each device a **reserved folio
block** (e.g. 1001–1100); the device allocates from its own block offline, with
no collisions and no coordination, and requests a fresh block as it runs low.

### 8 — Rendering is a pure pipeline behind a port; PDF bytes are the contract

The resolution step is pure and framework-free:

```
resolve(definition, theme, values, context) → Result<RenderedDocument, ResolveError>
```

`RenderedDocument` is already paginated, with geometry in **points**, not
screen pixels. The same tree drives on-screen preview, print and PDF, so
WYSIWYG holds by construction rather than by two implementations agreeing.

Turning that tree into bytes is a port ([ADR-0004](0004-ports-and-adapters-as-types.md)):

```ts
type DocumentRenderer = {
  readonly toPdf: (
    doc: RenderedDocument,
  ) => Promise<Result<DocumentBytes, RenderError>>;
};
```

**The contract is bytes, not a print dialog.** A document that must leave the
business has to be attachable, sendable and archivable; `window.print()`
produces none of those.

First adapter is **client-side**, because [ADR-0007](0007-offline-first-sync.md)
requires a document to be issuable with no network — a practitioner in a clinic
with dead wifi still prints. A server-side adapter may be added later for
archival or heavy layouts and replaces the wiring in
`apps/*/composition-root.ts` without touching domain or application.

### 9 — Placement

```
domain          DocumentDefinition, DocumentTheme, resolve() + pagination
                (pure: no React, no browser, no DOM measurement — points only)
application     port DocumentRenderer, port IssuedDocumentStore,
                use case issueDocument(entry, template, context)
infrastructure  the PDF adapter, issued-document persistence
ui              the guided designer + theme picker + preview
```

"Forms become documents" is a generic engine, so it is `vertical:core`. The
template catalog that uses it (which forms exist, which are documents) belongs
to the vertical.

### 10 — The designer previews against stress samples

The preview renders **sample values, including a deliberate worst case** — the
longest plausible value for every field, enough content to force a page break.
Designing against labels is precisely why documents break in production; the
designer must show the customer the case that breaks.

## Domain-model sketch (illustrative — not final code)

```ts
type DocumentDefinition = {
  readonly templateId: string;
  readonly version: number; // frozen into every issue
  readonly paper: 'letter' | 'a4' | 'half-letter';
  readonly themeId: ThemeId;
  readonly header?: BandSpec;
  readonly body: readonly SectionSpec[];
  readonly footer?: BandSpec;
  readonly marks: readonly AnchoredMark[]; // the only free position
};

type SectionSpec = {
  readonly id: string;
  readonly title?: string;
  readonly rows: readonly RowSpec[];
  readonly emphasis?: 'normal' | 'boxed' | 'quiet';
};

type RowSpec = { readonly slots: readonly SlotSpec[] }; // width auto-distributed

type SlotSpec =
  | {
      readonly kind: 'field';
      readonly blockId: string;
      readonly label: LabelMode;
    }
  | { readonly kind: 'token'; readonly token: DocumentToken }
  | { readonly kind: 'static'; readonly text: string }
  | { readonly kind: 'spacer'; readonly size: 'sm' | 'md' | 'lg' };

type AnchoredMark = {
  readonly id: string;
  readonly asset: 'logo' | 'signature' | 'seal' | 'qr';
  readonly region: 'header' | 'footer' | 'last-page';
  readonly corner: 'left' | 'center' | 'right';
};

type DocumentTheme = {
  readonly id: ThemeId;
  readonly name: string;
  readonly typography: {
    readonly base: Pt;
    readonly scale: number;
    readonly family: FamilyKey;
  };
  readonly density: 'compact' | 'regular' | 'airy';
  readonly labels: 'above' | 'inline' | 'hidden';
  readonly fieldRule: 'underline' | 'box' | 'none';
  readonly sectionRule: 'line' | 'band' | 'none';
  readonly accent: HexColor;
  readonly margins: EdgeInsets;
};

type IssuedDocument = {
  readonly id: string;
  readonly folio: string;
  readonly entryId: string;
  readonly issuedAt: Date;
  readonly issuedBy: ActorId;
  readonly snapshot: {
    readonly definition: DocumentDefinition;
    readonly theme: DocumentTheme;
  };
  readonly status: 'issued' | 'voided';
  readonly supersededBy?: string;
};
```

## Rejected alternatives

- **Keep the free canvas.** Rejected for the four structural failures above.
  Kept only as the interaction idiom for `AnchoredMark`, where absolute
  position is actually correct.
- **Hand the customer HTML/CSS (or a Word-like WYSIWYG editor).** Maximum
  power, and it moves the aesthetic responsibility further onto the party who
  cannot carry it. Support cost scales with customer count.
- **`@media print` only.** Free, and produces no file. Fails "the document must
  leave the business" outright.
- **Server-only rendering.** Best font fidelity and one implementation, but
  breaks issuance offline, which ADR-0007 does not allow. Deferred to a second
  adapter behind the same port.
- **Derive the document fully automatically from the capture schema.** Zero
  customer effort, but a capture form's order is not a document's order, and
  tokens (folio, license, letterhead) have no counterpart in the schema.

## Accepted trade-offs (owner, 2026-08-17)

- **Customers lose pixel control.** A customer replicating a pre-printed pad
  exactly will not be able to. Accepted: the theme catalog grows to cover real
  cases instead.
- **Theme authoring is ours forever.** Every "can it look like X" becomes our
  backlog, not a customer self-service task. Accepted deliberately — it is the
  cost of a guaranteed aesthetic floor.
- **Client-side PDF ships weight.** Embedded fonts and a PDF writer land in the
  app bundle. Accepted for offline issuance; revisit against `pnpm harness perf`.
- **Snapshots duplicate data.** Every issue stores its definition and theme.
  Accepted: immutability of an emitted artifact outranks storage.
- **Folio blocks can leave gaps.** A device that never exhausts its block
  leaves unused numbers. Accepted: gaps are auditable, collisions are not.

## Owner decisions record (2026-08-17)

1. **Structural freedom** — the customer orders sections and groups fields into
   rows. No pixels, no dragging of data.
2. **Output** — the document must leave the business, so the port contract is
   PDF bytes, not a print dialog. Client-side adapter first (offline).
3. **Issuance** — first class: folio, `issuedAt`, `issuedBy`, immutable
   snapshot, void-and-supersede instead of edit.

## Guardrails

- `domain` holds `resolve()` and pagination and stays pure — no DOM
  measurement, no browser font metrics; text measurement enters through a
  passed-in metrics function, not an import.
- Geometry in the domain is **points**. Screen pixels exist only in the `ui`
  preview.
- No captured value may be positioned absolutely. `AnchoredMark` carries assets
  only, never a `blockId`.
- `issueDocument` returns `Result` and refuses on any `IssueBlocker`
  ([ADR-0003](0003-result-over-exceptions.md)).
- An `IssuedDocument` is never mutated. Void and supersede.
- The engine keeps `vertical:core` — no prescription-specific or bison-specific
  token, theme or field kind enters it ([ADR-0019](0019-vertical-tag-axis.md)).

## Consequences

- Document quality stops varying per customer: the floor is whatever the worst
  shipped theme is, which we control and can raise for everyone at once.
- Adding a block to a capture schema no longer risks silently vanishing from
  the printed document — an unbound required block is an `IssueBlocker`.
- Preview, print and PDF cannot drift, because all three consume the same
  paginated tree.
- Reprints are reproducible years later, which is what makes the artifact
  usable where records are regulated.
- The current `PrintLayout` / `PrintElement` types and the print designer screen
  are superseded and will be rewritten against this model; the free-drag canvas
  code survives as the interaction for marks.
