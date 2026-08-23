import { useEffect } from 'react';
import { CircleAlert } from 'lucide-react';
import { EmptyState, Button, toast } from '@acme/ui';
import { useClientsStore, useStore } from '../../store/hooks';
import { ClientsView } from '../clients.view';
import { WiredClientDetail } from './clients.wired.detail';

/**
 * The DI-bound Clients container. Reads the roster / detail ViewModels from
 * the store (which delegates to the headless controllers over the `bison.*`
 * gateway) and dispatches every action to it.
 *
 * Navigation is ROUTER-OWNED when the app passes it: `clientId` (from the
 * URL) decides roster vs detail, and drill-down/back go through
 * `onOpenClient`/`onBack` so the address bar stays true (deep links and
 * cross-section jumps work). Without those props — stories, the bare
 * prototype — the store's own open/back keep the old self-contained flow.
 */
/** Only a freshly picked photo (a data URL from the picker) travels to
 *  Save — an unchanged prefill is the already-resolved signed URL. */
const pickedPhotoOf = (photoUrl: string): string | undefined =>
  photoUrl.startsWith('data:') ? photoUrl : undefined;

const createFromDraft = async (
  store: ReturnType<typeof useClientsStore>,
  draft: {
    readonly name: string;
    readonly phone: string;
    readonly photoUrl: string;
  },
) => {
  const photoDataUrl = pickedPhotoOf(draft.photoUrl);
  const created = await store.getState().create({
    name: draft.name,
    phone: draft.phone,
    ...(photoDataUrl !== undefined ? { photoDataUrl } : {}),
  });
  if (created) toast.success(`${draft.name} added to clients`);
};

const RosterFallback = ({
  error,
  onRetry,
}: {
  readonly error: string | null;
  readonly onRetry: () => void;
}) =>
  error ? (
    <EmptyState
      icon={<CircleAlert />}
      title="Couldn't load clients"
      description={error}
      action={
        <Button size="sm" onClick={onRetry}>
          Retry
        </Button>
      }
    />
  ) : (
    <p className="text-sm text-muted-foreground">Loading clients…</p>
  );

export const ClientsContainer = ({
  clientId,
  onOpenClient,
  onBack,
}: {
  readonly clientId?: string | undefined;
  readonly onOpenClient?: ((id: string) => void) | undefined;
  readonly onBack?: (() => void) | undefined;
} = {}) => {
  const store = useClientsStore();
  const roster = useStore(store, (s) => s.roster);
  const detail = useStore(store, (s) => s.detail);
  const error = useStore(store, (s) => s.error);

  useEffect(() => {
    if (clientId) void store.getState().open(clientId);
    else void store.getState().load();
  }, [store, clientId]);

  // Router mode (onOpenClient given): the URL is the truth — a stale store
  // detail never renders over the roster. Self-contained mode keeps the
  // store's own drill-down.
  const routed = onOpenClient !== undefined;
  const showDetail = clientId
    ? detail?.client.id === clientId
    : !routed && detail !== null;
  if (detail && showDetail) {
    return (
      <WiredClientDetail
        detail={detail}
        onBack={onBack ?? (() => store.getState().back())}
        onSaveContact={async (draft) => {
          // The dev adapter resolves photos AS data URLs, so an unchanged
          // prefill can look like a fresh pick — same-as-current is not one.
          const picked = pickedPhotoOf(draft.photoUrl);
          const photoDataUrl =
            picked !== detail.client.photoUrl ? picked : undefined;
          const saved = await store.getState().saveContact({
            id: detail.client.id,
            name: draft.name,
            phone: draft.phone,
            ...(photoDataUrl !== undefined ? { photoDataUrl } : {}),
          });
          if (saved) toast.success('Contact info updated');
          return saved;
        }}
        onLogEntry={(input) => store.getState().logEntry(input)}
        onResolveFileUrl={(path) => store.getState().fileUrl(path)}
      />
    );
  }

  if (!roster) {
    return (
      <RosterFallback
        error={error}
        onRetry={() => void store.getState().load()}
      />
    );
  }

  return (
    <ClientsView
      vm={roster}
      onSelectClient={(id) =>
        onOpenClient ? onOpenClient(id) : void store.getState().open(id)
      }
      onCreateClient={(draft) => void createFromDraft(store, draft)}
    />
  );
};
