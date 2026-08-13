/**
 * Bison Manager · Client · Clients — the roster of everyone the account has
 * served: name, visit count, most recent visit. Search narrows the list;
 * no backend paging yet, so it filters and pages client-side (see
 * clients.pager.tsx).
 *
 * @screen Bison Manager / Client / Clients
 * @phase draft
 *
 * Presentational: a pure function of the VM. Search text and the current
 * page are view-local interaction state (same reasoning as the
 * New-appointment draft) — they never leave this component.
 */
import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { EmptyState, Input, Stack } from '@acme/ui';
import { ClientList } from './clients.row';
import { ClientsPager, PAGE_SIZE } from './clients.pager';
import type { ClientsVM } from './clients.types';

const SearchField = ({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) => (
  <div className="relative max-w-sm">
    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search clients…"
      className="pl-8"
      aria-label="Search clients"
    />
  </div>
);

const matches = (search: string) => (name: string) =>
  name.toLowerCase().includes(search.trim().toLowerCase());

export const ClientsView = ({
  vm,
  onSelectClient,
}: {
  readonly vm: ClientsVM;
  readonly onSelectClient?: ((id: string) => void) | undefined;
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // A new search always starts browsing from page 1 — staying on whatever
  // page number happened to overlap with the narrower result set is
  // confusing, not helpful.
  useEffect(() => setPage(1), [search]);

  const filtered = search.trim()
    ? vm.clients.filter((c) => matches(search)(c.name))
    : vm.clients;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <Stack gap="group" className="max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Clients</h1>
        {vm.summary ? (
          <p className="text-sm text-muted-foreground">{vm.summary}</p>
        ) : null}
      </div>
      {vm.empty ? (
        <EmptyState
          icon={<Users />}
          title="No clients yet"
          description="Clients you've served will show up here as their appointments are booked."
        />
      ) : (
        <>
          <SearchField value={search} onChange={setSearch} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="No matches"
              description={`Nobody named "${search.trim()}" in your client list.`}
            />
          ) : (
            <>
              <ClientList clients={paged} onSelectClient={onSelectClient} />
              {filtered.length > PAGE_SIZE ? (
                <ClientsPager
                  page={safePage}
                  totalPages={totalPages}
                  onChange={setPage}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </Stack>
  );
};
