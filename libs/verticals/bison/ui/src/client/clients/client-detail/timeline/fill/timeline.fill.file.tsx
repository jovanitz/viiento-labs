/**
 * The `file` block's real input and its display — one pair used by the
 * fill form (pick/replace/clear, with preview) and by the read-only entry
 * view (preview only), so captured files look the same everywhere.
 *
 * The picked file is read into a data URL and encoded into the block's
 * ordinary string value (templates/values/file-value.ts): no storage, no
 * new value shape, and the printed page can embed the image later.
 */
import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Paperclip, X } from 'lucide-react';
import { Button, toast } from '@acme/ui';
import { useFileUrlResolver } from '../../../../templates/values/file-url-context';
import {
  decodeFileValue,
  encodeFileValue,
  formatSize,
  isImage,
} from '../../../../templates/values/file-value';
import type { FileValue } from '../../../../templates/values/file-value';

const readInto = (file: File, onChange: (value: string) => void) => {
  const reader = new FileReader();
  reader.onload = () =>
    onChange(
      encodeFileValue({
        name: file.name,
        mime: file.type,
        size: file.size,
        dataUrl: String(reader.result),
      }),
    );
  reader.readAsDataURL(file);
};

const ThumbImage = ({
  src,
  name,
}: {
  readonly src: string;
  readonly name: string;
}) => (
  <img
    src={src}
    alt={name}
    className="size-12 shrink-0 rounded-md border border-border object-cover"
  />
);

const DocIcon = () => (
  <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
    <FileText className="size-5" />
  </div>
);

/** A STORED image's thumbnail: resolve its path to a signed URL through
 *  the wired seam; the icon stands in until (or unless) it resolves. */
const StoredThumb = ({ file }: { readonly file: FileValue }) => {
  const resolver = useFileUrlResolver();
  const [src, setSrc] = useState<string | null>(null);
  const path = file.storagePath;
  useEffect(() => {
    if (!resolver || !path) return;
    let alive = true;
    void resolver(path).then((url) => {
      if (alive && url) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [resolver, path]);
  return src ? <ThumbImage src={src} name={file.name} /> : <DocIcon />;
};

const Thumb = ({ file }: { readonly file: FileValue }) => {
  if (!isImage(file)) return <DocIcon />;
  if (file.dataUrl) return <ThumbImage src={file.dataUrl} name={file.name} />;
  if (file.storagePath) return <StoredThumb file={file} />;
  return <DocIcon />;
};

/** A stored value's download: resolve the path to a signed URL through the
 *  wired seam and open it — the bytes come straight from the bucket. */
const StoredDownload = ({ file }: { readonly file: FileValue }) => {
  const resolver = useFileUrlResolver();
  if (!resolver || !file.storagePath) return null;
  const path = file.storagePath;
  const open = async () => {
    const url = await resolver(path);
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error("The file couldn't be reached — try again.");
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0 text-muted-foreground"
      aria-label={`Download ${file.name}`}
      onClick={() => void open()}
    >
      <Download className="size-4" />
    </Button>
  );
};

/** Edit mode clears; read mode downloads — a captured file the user
 *  cannot get back out is a dead end. Fresh picks download straight from
 *  their data URL; stored values resolve a signed URL first. */
const TrailingAction = ({
  file,
  onClear,
}: {
  readonly file: FileValue | undefined;
  readonly onClear?: (() => void) | undefined;
}) => {
  if (onClear)
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground"
        aria-label="Remove file"
        onClick={onClear}
      >
        <X />
      </Button>
    );
  if (!file) return null;
  if (!file.dataUrl) return <StoredDownload file={file} />;
  // A plain styled anchor (not Button asChild): the browser handles the
  // data-URL download natively, no JS involved.
  return (
    <a
      href={file.dataUrl}
      download={file.name}
      aria-label={`Download ${file.name}`}
      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Download className="size-4" />
    </a>
  );
};

/** A captured file, at a glance: image thumbnail or document icon, name
 *  and size. `onClear` makes it the editable variant. */
export const FileValueDisplay = ({
  value,
  onClear,
}: {
  readonly value: string;
  readonly onClear?: (() => void) | undefined;
}) => {
  const file = decodeFileValue(value);
  return (
    <div className="flex w-fit max-w-full items-center gap-2 rounded-md border border-border p-1.5 pr-2">
      {file ? (
        <Thumb file={file} />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Paperclip className="size-4" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">
          {file?.name ?? value}
        </p>
        {file ? (
          <p className="text-xs text-muted-foreground">
            {formatSize(file.size)}
          </p>
        ) : null}
      </div>
      <TrailingAction file={file} onClear={onClear} />
    </div>
  );
};

/** The fill form's control: pick a file (image or document), see it, and
 *  clear it to pick another. */
export const FileInput = ({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) readInto(file, onChange);
          e.target.value = '';
        }}
      />
      {value === '' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip /> Choose file…
        </Button>
      ) : (
        <FileValueDisplay value={value} onClear={() => onChange('')} />
      )}
    </div>
  );
};
