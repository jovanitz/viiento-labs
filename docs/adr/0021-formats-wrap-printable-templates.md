# ADR-0021: Every template prints itself; a Format wraps it

- Status: Accepted
- Date: 2026-08-18
- Amends: [ADR-0020](0020-forms-as-documents.md) — supersedes its
  per-template layout designer and `DocumentDefinition`; its themes,
  tokens, issuance model and renderer port stand unchanged.

## Context

ADR-0020 §2 gave every printable template a designed layout: a
`DocumentDefinition` the business builds in a structural editor (sections,
rows, merge/split). The editor shipped, and the owner's verdict on it was
direct: **building a document per template is too complex and will be
tedious for the customer.** The realization behind that verdict: the
structure the designer asks for already exists. A capture schema has an
order, has sections (`section` blocks), and has width hints
(`FieldWidth = 'full' | 'half'`, added for exactly this). Asking the
business to restate all of that on a second canvas duplicates work and
reopens the gap the block-id binding had just closed.

What the schema does NOT carry is identity and tone: whose letterhead,
which footer, which marks, which theme. That is the part worth an editor —
and it is per ACCOUNT, not per template.

## Decision

### 1 — The body derives from the capture schema

Every template is printable, from day zero, with zero layout work. The
body is the schema, in capture order: `section` blocks become page
sections, `help-text` is skipped, `width: 'half'` pairs two fields on one
row (max two), presenters per `FieldKind` unchanged (ADR-0020 §5).
Reordering the printed page = reordering the form. There is no second
structure to build or to drift.

### 2 — A Format is the wrapper, and it is account-level

```
Format = { name, theme, paper, headerTokens, footerTokens, marks }
document = wrap(format, deriveBody(template, values), accountTokens)
```

Letterhead and footer are ordered **account tokens** (ADR-0020 §4 — never
typed text); marks are toggled assets with fixed anchor positions. One
format serves many templates; the app ships a small example catalog
(product artifacts, like themes — names pending the owner's naming pass)
and the business edits or adds its own.

### 3 — The format is chosen when the document leaves

From a Timeline entry: Document → pick a format (default: the first) →
issue / print / send. The pairing template×format is a per-use choice, not
a binding.

### 4 — Coherence is now by construction

With no per-template definition there is nothing to drift: `unbound` and
`unknown` blockers cease to exist as categories. The only issue-time
blocker left is a required field with no value on the entry.

## Rejected alternatives

- **Keep the structural designer** (ADR-0020 §2 as shipped). Correct
  output, but the owner judged the authoring cost per template too high —
  and the schema already encodes the structure.
- **Bind one format per template.** Simpler pick-flow, but the same entry
  legitimately leaves as different artifacts (print vs. WhatsApp).

## Signed trade-offs (owner, 2026-08-18)

- **No paper-only reordering.** The printed order is the capture order; to
  change one you change the other.
- **No ad-hoc per-document composition** (interleaved fixed text,
  spacers). Fixed copy lives in the format's footer or the schema's
  `help-text`-adjacent blocks.
- **Shipped format names are placeholders** until the owner names them.

## Consequences

- The designer (`document/designer/`), `DocumentDefinition` and the
  per-template layout state are deleted; `document/format/` replaces them.
- The engine survives intact: themes, tokens, `render/`, sample
  generation, and the future pure `resolve()` + `DocumentRenderer` port
  (ADR-0020 §8) — `deriveBody` becomes part of that resolve.
- A new template is immediately printable, which also kills the
  "capture-only" empty state: every form has a printed form.
