import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { err, ok } from '@acme/shared';
import {
  PAPER_PT,
  documentPrims,
  documentRenderFailed,
} from '@acme/application';
import type {
  DocPrim,
  DocumentRenderer,
  FamilyKey,
  PaginatedDocument,
  TextStyle,
} from '@acme/application';

/**
 * The client-side `DocumentRenderer` (ADR-0020 §8): a PAINTER. Geometry,
 * pagination and line breaks come from the domain engine as positioned
 * primitives; this adapter only embeds fonts, flips the y-axis (PDF's
 * origin is bottom-left) and puts ink on the page. It decides nothing —
 * which is what keeps the file and the preview the same document.
 *
 * Fonts arrive lazily as bytes (the app fetches its shipped files on the
 * first issue); a family with no bytes falls back to the PDF standard
 * fonts so a failed fetch degrades the look, never the issuance.
 */
export type FontFaceBytes = {
  readonly regular: Uint8Array;
  readonly semibold: Uint8Array;
  readonly bold: Uint8Array;
};

export type DocumentFontLoader = () => Promise<
  Partial<Record<FamilyKey, FontFaceBytes>>
>;

type FaceSet = {
  readonly regular: PDFFont;
  readonly semibold: PDFFont;
  readonly bold: PDFFont;
};

const pickFace = (faces: FaceSet, weight: TextStyle['weight']): PDFFont => {
  if (weight >= 700) return faces.bold;
  if (weight >= 600) return faces.semibold;
  return faces.regular;
};

const parseColor = (
  hex: string,
): { color: ReturnType<typeof rgb>; opacity: number } => {
  const raw = hex.replace('#', '');
  const n = (i: number) => parseInt(raw.slice(i, i + 2), 16) / 255;
  return {
    color: rgb(n(0), n(2), n(4)),
    opacity: raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1,
  };
};

const embedFallback = async (
  pdf: PDFDocument,
  family: FamilyKey,
): Promise<FaceSet> => {
  const serif = family !== 'sans';
  const regular = await pdf.embedFont(
    serif ? StandardFonts.TimesRoman : StandardFonts.Helvetica,
  );
  const bold = await pdf.embedFont(
    serif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold,
  );
  return { regular, semibold: bold, bold };
};

const embedFamily = async (
  pdf: PDFDocument,
  family: FamilyKey,
  bytes: FontFaceBytes | undefined,
): Promise<FaceSet> => {
  if (!bytes) return embedFallback(pdf, family);
  const embed = (data: Uint8Array) => pdf.embedFont(data, { subset: true });
  return {
    regular: await embed(bytes.regular),
    semibold: await embed(bytes.semibold),
    bold: await embed(bytes.bold),
  };
};

const DATA_URL_RE = /^data:(image\/(?:png|jpe?g));base64,(.+)$/;

const embedImage = async (
  pdf: PDFDocument,
  dataUrl: string,
): Promise<PDFImage | null> => {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) return null;
  const bytes = Uint8Array.from(atob(match[2] as string), (c) =>
    c.charCodeAt(0),
  );
  return match[1] === 'image/png' ? pdf.embedPng(bytes) : pdf.embedJpg(bytes);
};

type Paint = {
  readonly page: PDFPage;
  readonly pageH: number;
  readonly faces: FaceSet;
  readonly pdf: PDFDocument;
};

const paintText = (
  p: Paint,
  prim: Extract<DocPrim, { kind: 'text' }>,
): void => {
  const font = pickFace(p.faces, prim.weight);
  // Baseline sits at ~80% of the font size below the line-box top.
  const baseline = prim.y + (prim.lineH - prim.sizePt) / 2 + prim.sizePt * 0.8;
  const width = font.widthOfTextAtSize(prim.text, prim.sizePt);
  const x = prim.align === 'right' ? prim.x - width : prim.x;
  const { color } = parseColor(prim.color);
  p.page.drawText(prim.text, {
    x,
    y: p.pageH - baseline,
    size: prim.sizePt,
    font,
    color,
  });
};

const paintPrim = async (p: Paint, prim: DocPrim): Promise<void> => {
  if (prim.kind === 'text') return paintText(p, prim);
  if (prim.kind === 'line') {
    const { color } = parseColor(prim.color);
    p.page.drawLine({
      start: { x: prim.x1, y: p.pageH - prim.y1 },
      end: { x: prim.x2, y: p.pageH - prim.y2 },
      thickness: prim.width,
      color,
    });
    return;
  }
  if (prim.kind === 'rect') {
    const stroke = prim.stroke ? parseColor(prim.stroke) : undefined;
    const fill = prim.fill ? parseColor(prim.fill) : undefined;
    p.page.drawRectangle({
      x: prim.x,
      y: p.pageH - prim.y - prim.h,
      width: prim.w,
      height: prim.h,
      ...(stroke ? { borderColor: stroke.color, borderWidth: 1 } : {}),
      ...(fill ? { color: fill.color, opacity: fill.opacity } : {}),
    });
    return;
  }
  const image = await embedImage(p.pdf, prim.dataUrl);
  if (!image) return;
  const scale = Math.min(prim.w / image.width, prim.h / image.height, 1);
  const w = image.width * scale;
  const h = image.height * scale;
  p.page.drawImage(image, {
    x: prim.x,
    y: p.pageH - prim.y - h,
    width: w,
    height: h,
  });
};

export const createPdfDocumentRenderer = (deps: {
  readonly loadFonts: DocumentFontLoader;
}): DocumentRenderer => {
  let loaded: ReturnType<DocumentFontLoader> | undefined;
  const fontsOnce = (): ReturnType<DocumentFontLoader> =>
    (loaded ??= deps
      .loadFonts()
      .catch((): Partial<Record<FamilyKey, FontFaceBytes>> => ({})));

  return {
    toPdf: async (doc: PaginatedDocument) => {
      try {
        const pdf = await PDFDocument.create();
        pdf.registerFontkit(fontkit);
        const bytes = await fontsOnce();
        const faces = await embedFamily(
          pdf,
          doc.theme.family,
          bytes[doc.theme.family],
        );
        const paper = PAPER_PT[doc.paper];
        // The painter re-measures nothing: line breaks and positions come
        // from the engine, via the embedded font's own metrics upstream.
        const pages = documentPrims(doc, (text, style) =>
          pickFace(faces, style.weight).widthOfTextAtSize(text, style.sizePt),
        );
        for (const prims of pages) {
          const page = pdf.addPage([paper.w, paper.h]);
          const paint: Paint = { page, pageH: paper.h, faces, pdf };
          for (const prim of prims) await paintPrim(paint, prim);
        }
        pdf.setTitle(doc.title);
        return ok(await pdf.save());
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : 'PDF generation failed.';
        return err(documentRenderFailed(message));
      }
    },
  };
};
