/**
 * Page controls for the client roster — client-side only (the whole roster
 * is already in memory; this just keeps the DOM/scan size sane at 200+
 * clients). The natural seam to swap in real offset/limit paging once a
 * backend exists — the view already only ever sees one page's worth of rows.
 */
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@acme/ui';

export const PAGE_SIZE = 20;

export const ClientsPager = ({
  page,
  totalPages,
  onChange,
}: {
  readonly page: number;
  readonly totalPages: number;
  readonly onChange: (page: number) => void;
}) => {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <Pagination className="justify-between">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={!canPrev}
            className={!canPrev ? 'pointer-events-none opacity-50' : undefined}
            onClick={(e) => {
              e.preventDefault();
              if (canPrev) onChange(page - 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <PaginationContent>
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={!canNext}
            className={!canNext ? 'pointer-events-none opacity-50' : undefined}
            onClick={(e) => {
              e.preventDefault();
              if (canNext) onChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
