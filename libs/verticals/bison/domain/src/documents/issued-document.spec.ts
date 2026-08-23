import { describe, expect, it } from 'vitest';
import type { IssuedDocumentId, IssuedSnapshot } from './issued-document';
import {
  attachIssuedPdf,
  createIssuedDocument,
  folioLabel,
  voidIssuedDocument,
} from './issued-document';

const SNAPSHOT: IssuedSnapshot = {
  templateName: 'Evidencia',
  blocks: [],
  values: { motivo: 'Consulta' },
  format: {
    id: 'fmt-1' as never,
    name: 'Receta',
    themeId: 'clinical',
    paper: 'letter',
    headerTokens: ['business.name'],
    footerTokens: ['document.folio'],
    marks: [],
    createdAt: '2026-08-21T12:00:00.000Z',
    updatedAt: '2026-08-21T12:00:00.000Z',
  },
  tokens: { 'business.name': 'Aurora' },
};

const issue = () => {
  const created = createIssuedDocument({
    id: 'iss-1' as IssuedDocumentId,
    entryId: 'ent-1',
    clientId: 'cli-1',
    folio: 4,
    issuedAt: '2026-08-21T12:00:00.000Z',
    issuedBy: 'user-1',
    snapshot: SNAPSHOT,
  });
  if (!created.ok) throw new Error('fixture issue must be valid');
  return created.value;
};

describe('issued documents', () => {
  it('creates as issued, PDF-less, with a positive folio', () => {
    const doc = issue();
    expect(doc.status).toBe('issued');
    expect(doc.pdfPath).toBe('');
    expect(folioLabel(doc.folio)).toBe('0004');
    expect(folioLabel(12345)).toBe('12345');
    expect(
      createIssuedDocument({ ...doc, folio: 0, snapshot: SNAPSHOT }).ok,
    ).toBe(false);
  });

  it('attaches the rendered bytes exactly once', () => {
    const doc = issue();
    const attached = attachIssuedPdf(doc, 'issued/iss-1');
    expect(attached.ok && attached.value.pdfPath).toBe('issued/iss-1');
    if (!attached.ok) return;
    expect(attachIssuedPdf(attached.value, 'issued/other').ok).toBe(false);
  });

  it('voids once, optionally superseded, never edits back', () => {
    const doc = issue();
    const voided = voidIssuedDocument(doc, 'iss-2');
    expect(voided.ok && voided.value.status).toBe('voided');
    expect(voided.ok && voided.value.supersededBy).toBe('iss-2');
    if (!voided.ok) return;
    expect(voidIssuedDocument(voided.value).ok).toBe(false);
  });
});
