import { useClientUseCases } from '../../di';
import type { DocumentVM } from '../../templates/document/document.types';

/** Issue = the paginated tree becomes PDF bytes the user keeps. The
 *  renderer comes from DI (ADR-0020 §8); the browser download is the only
 *  presentation concern left here. */
export const useIssuePdf = () => {
  const { documents } = useClientUseCases();
  return async (doc: DocumentVM, fileName: string): Promise<boolean> => {
    const rendered = await documents.renderer.toPdf(doc);
    if (!rendered.ok) return false;
    const blob = new Blob([rendered.value as BlobPart], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  };
};
