/**
 * Bison Manager · Client · Templates · Formats — the account's document
 * wrappers (ADR-0021). A format is letterhead, footer, marks, theme and
 * paper; the BODY always comes from whichever template gets printed, so
 * this editor is all a business ever configures about its documents.
 *
 * Presentational: a pure function of (vm, actions). The preview below
 * shows the selected format wrapping a sample template with generated
 * values — judging a wrapper needs a body inside it.
 *
 * @screen Bison Manager / Client / Templates / Formats
 * @phase draft
 */
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from '@acme/ui';
import { DocumentPreviewView } from '../document.view';
import { MarkChips, TokenChips } from './formats.chips';
import type { DocumentFormat } from '../document.format';
import type { DocumentToken } from '../document.tokens';
import type {
  DocumentPreviewVM,
  DocumentThemeVM,
  MarkVM,
} from '../document.types';

export type FormatsActions = {
  readonly onSelect: (id: string) => void;
  readonly onThemeChange: (themeId: string) => void;
  readonly onToggleHeaderToken: (token: DocumentToken) => void;
  readonly onToggleFooterToken: (token: DocumentToken) => void;
  readonly onToggleMark: (asset: MarkVM['asset']) => void;
  readonly onSampleChange: (sample: 'typical' | 'stress') => void;
};

const FormatTabs = ({
  formats,
  selectedId,
  onSelect,
}: {
  readonly formats: readonly DocumentFormat[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {formats.map((format) => (
      <Button
        key={format.id}
        type="button"
        size="sm"
        variant={format.id === selectedId ? 'secondary' : 'ghost'}
        onClick={() => onSelect(format.id)}
      >
        {format.name}
      </Button>
    ))}
  </div>
);

const ThemePicker = ({
  value,
  themes,
  onChange,
}: {
  readonly value: string;
  readonly themes: readonly DocumentThemeVM[];
  readonly onChange: (themeId: string) => void;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-8 w-40" aria-label="Theme">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {themes.map((theme) => (
        <SelectItem key={theme.id} value={theme.id}>
          {theme.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const FormatsView = ({
  formats,
  selected,
  themes,
  preview,
  actions,
}: {
  readonly formats: readonly DocumentFormat[];
  readonly selected: DocumentFormat;
  readonly themes: readonly DocumentThemeVM[];
  readonly preview: DocumentPreviewVM;
  readonly actions: FormatsActions;
}) => (
  <Stack gap="section">
    <div>
      <h1 className="text-xl font-semibold text-foreground">Formats</h1>
      <p className="text-sm text-muted-foreground">
        How a printed template gets wrapped — letterhead, footer, marks and
        theme. The content itself always comes from the template.
      </p>
    </div>

    <FormatTabs
      formats={formats}
      selectedId={selected.id}
      onSelect={actions.onSelect}
    />

    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{selected.name}</p>
        <ThemePicker
          value={selected.themeId}
          themes={themes}
          onChange={actions.onThemeChange}
        />
      </div>
      <TokenChips
        legend="Letterhead"
        active={selected.headerTokens}
        onToggle={actions.onToggleHeaderToken}
      />
      <TokenChips
        legend="Footer"
        active={selected.footerTokens}
        onToggle={actions.onToggleFooterToken}
      />
      <MarkChips marks={selected.marks} onToggle={actions.onToggleMark} />
    </div>

    <DocumentPreviewView vm={preview} onSampleChange={actions.onSampleChange} />
  </Stack>
);
