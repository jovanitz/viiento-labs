/**
 * Prototype-only composition: a document reached from a client's Timeline
 * entry, composed from THAT entry's captured values and wrapped in a
 * Format the user picks at print time (ADR-0021). Every template is
 * printable, so this screen exists for every entry.
 *
 * Tokens resolve against the account, which starts empty and fills itself
 * in over time. An account with no details yet issues a document with no
 * letterhead (owner's call): the page prints what it was told and nothing
 * more.
 *
 * Deliberately not `*.container.tsx`: nothing real is wired and the view
 * is still `@phase draft`.
 */
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  toast,
} from '@acme/ui';
import { BackButton } from '../../back-button';
import { DocumentPreviewView } from './document.view';
import { documentPreview } from './document.compose';
import type { EntryValues } from './document.compose';

import { EMPTY_ACCOUNT } from './document.tokens';
import type { TokenValues } from './document.tokens';
import type { DocumentFormat } from './document.format';
import type { EntryTemplate } from '../templates.types';

const FormatPicker = ({
  formats,
  value,
  onChange,
}: {
  readonly formats: readonly DocumentFormat[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-8 w-44" aria-label="Format">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {formats.map((format) => (
        <SelectItem key={format.id} value={format.id}>
          {format.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

/** Issue time — a filled entry from a client's Timeline. */
export const EntryDocument = ({
  template,
  values,
  clientName,
  formats,
  account = EMPTY_ACCOUNT,
  onBack,
  onIssuePdf,
}: {
  readonly template: EntryTemplate;
  readonly values: EntryValues;
  readonly clientName: string;
  /** The account's formats — shipped examples plus its own. */
  readonly formats: readonly DocumentFormat[];
  readonly account?: TokenValues;
  readonly onBack: () => void;
  /**
   * The real emitter (wired apps): formal issuance — folio, frozen
   * snapshot, rendered bytes the user keeps. Returns the folio label, or
   * null on failure. Absent — stories, the bare prototype — Issue stays
   * a demo toast.
   */
  readonly onIssuePdf?:
    | ((format: DocumentFormat, fileName: string) => Promise<string | null>)
    | undefined;
}) => {
  const [formatId, setFormatId] = useState(formats[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const format = formats.find((f) => f.id === formatId) ?? formats[0];
  if (!format) return null;
  const vm = documentPreview({
    format,
    template,
    values,
    tokens: { ...account, 'client.name': clientName },
  });
  const issue = async () => {
    // ADR-0020 §6: a document with blockers cannot be emitted.
    if (vm.blockers.length > 0) {
      toast.error('Fill the missing required fields before issuing.');
      return;
    }
    if (!onIssuePdf) {
      toast.success('Issued');
      return;
    }
    setBusy(true);
    const folio = await onIssuePdf(format, `${template.name} — ${clientName}.pdf`);
    setBusy(false);
    if (folio !== null) toast.success(`Issued · folio ${folio} — downloaded`);
    else toast.error("The document couldn't be issued — try again.");
  };
  return (
    <Stack gap="group">
      <div className="flex items-center justify-between gap-3">
        <BackButton label={clientName} onClick={onBack} />
        {formats.length > 1 ? (
          <FormatPicker
            formats={formats}
            value={format.id}
            onChange={setFormatId}
          />
        ) : null}
      </div>
      <DocumentPreviewView
        vm={vm}
        onIssue={() => {
          if (!busy) void issue();
        }}
      />
    </Stack>
  );
};
