/**
 * Bison Manager · Client · Templates · Print layout — arrange a template's
 * fields freely on a printable page, separate from the linear capture
 * schema (templates.builder.view). "Print preview" fires the browser's own
 * print dialog (data-print-area in templates.print.canvas.tsx is the only
 * thing that survives @media print) — no PDF library, no backend; printing
 * a real filled entry's values instead of field labels is future work.
 *
 * @screen Bison Manager / Client / Templates / Print layout
 * @phase draft
 */
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@acme/ui';
import { PrintPalette } from './templates.print.palette';
import { PrintCanvas } from './templates.print.canvas';
import type { EntryTemplate, PrintElement } from '../templates.types';

export const PrintLayoutView = ({
  template,
  elements,
  onAddField,
  onAddText,
  onMove,
  onRemove,
  onBack,
  onSave,
  onPrint,
}: {
  readonly template: EntryTemplate;
  readonly elements: readonly PrintElement[];
  readonly onAddField: (block: EntryTemplate['blocks'][number]) => void;
  readonly onAddText: (content: string) => void;
  readonly onMove: (id: string, x: number, y: number) => void;
  readonly onRemove: (id: string) => void;
  readonly onBack: () => void;
  readonly onSave: () => void;
  readonly onPrint: () => void;
}) => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 w-fit text-muted-foreground"
      >
        <ArrowLeft /> {template.name}
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer /> Print preview
        </Button>
        <Button size="sm" onClick={onSave}>
          Save layout
        </Button>
      </div>
    </div>
    <div className="print:hidden">
      <h1 className="text-xl font-semibold text-foreground">Print layout</h1>
      <p className="text-sm text-muted-foreground">
        Arrange {template.name}&rsquo;s fields on the printed page — click to
        place, drag to position.
      </p>
    </div>
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="print:hidden">
        <PrintPalette
          blocks={template.blocks}
          onAddField={onAddField}
          onAddText={onAddText}
        />
      </div>
      <div className="overflow-x-auto">
        <PrintCanvas elements={elements} onMove={onMove} onRemove={onRemove} />
      </div>
    </div>
  </div>
);
