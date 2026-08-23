import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { paginateDocument } from '@acme/domain';
import type { DocumentModel, DocumentTheme } from '@acme/domain';
import { createPdfDocumentRenderer } from './pdf-document-renderer';

const THEME: DocumentTheme = {
  id: 'clinical',
  name: 'Clinical',
  blurb: '',
  family: 'sans',
  basePt: 10,
  scale: 1.2,
  density: 'compact',
  labels: 'above',
  fieldRule: 'underline',
  sectionRule: 'line',
  accent: '#0f766e',
  margins: { top: 40, right: 44, bottom: 40, left: 44 },
};

const model = (rows: number): DocumentModel => ({
  title: 'Consulta',
  paper: 'letter',
  theme: THEME,
  marks: [],
  sections: [
    {
      id: 'body',
      title: 'Datos',
      rows: Array.from({ length: rows }, (_, i) => ({
        slots: [
          { kind: 'field' as const, label: `Campo ${i}`, value: 'valor' },
        ],
      })),
    },
  ],
});

const fakeMeasure = (text: string, style: { sizePt: number }) =>
  text.length * style.sizePt * 0.5;

// No font bytes on purpose: the adapter must degrade to the PDF standard
// fonts (a failed fetch dims the look, never blocks issuance).
const renderer = createPdfDocumentRenderer({ loadFonts: async () => ({}) });

describe('createPdfDocumentRenderer', () => {
  it('produces a real PDF with the paginated page count', async () => {
    const doc = paginateDocument(model(60), fakeMeasure);
    expect(doc.pages.length).toBeGreaterThan(1);

    const result = await renderer.toPdf(doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const header = String.fromCharCode(...result.value.slice(0, 5));
    expect(header).toBe('%PDF-');
    const loaded = await PDFDocument.load(result.value);
    expect(loaded.getPageCount()).toBe(doc.pages.length);
  });

  it('renders every slot kind without failing', async () => {
    const doc = paginateDocument(
      {
        ...model(1),
        sections: [
          {
            id: 'mix',
            rows: [
              { slots: [{ kind: 'field', label: 'Nombre', value: 'Diana' }] },
              {
                slots: [
                  {
                    kind: 'checklist',
                    label: 'Lista',
                    items: [
                      { text: 'uno', checked: true },
                      { text: 'dos', checked: false },
                    ],
                  },
                  { kind: 'signature', label: 'Firma', name: 'Dr. X' },
                ],
              },
              { slots: [{ kind: 'static', text: 'Aviso fijo.' }] },
              {
                slots: [
                  {
                    kind: 'file',
                    label: 'Adjunto',
                    name: 'estudio.pdf',
                    isImage: false,
                  },
                ],
              },
              {
                slots: [
                  {
                    kind: 'file',
                    label: 'Foto',
                    name: 'foto.png',
                    isImage: true,
                    // 1×1 red PNG
                    dataUrl:
                      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                  },
                ],
              },
              { slots: [{ kind: 'spacer', size: 'md' }] },
            ],
          },
        ],
      },
      fakeMeasure,
    );
    const result = await renderer.toPdf(doc);
    expect(result.ok).toBe(true);
  });
});
