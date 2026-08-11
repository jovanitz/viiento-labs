/**
 * ViewModel for the client Clients screen — the roster of everyone the
 * account has served. Individual-account scope: every visit in the roster
 * is implicitly this account's own (see clients.logic.ts); the future
 * organization view aggregates the same shape across staff.
 */

export type ClientRow = {
  readonly id: string;
  readonly name: string;
  /** 1-2 letters for the avatar fallback — e.g. "DM". */
  readonly initials: string;
  /** Confirmed appointments only — a canceled one was never actually served. */
  readonly visitCount: number;
  /** Preformatted — e.g. "Mon, Aug 3 · Classic cut". */
  readonly latestVisitLabel: string;
};

export type ClientsVM = {
  readonly clients: readonly ClientRow[];
  /** Preformatted — e.g. "12 clients". */
  readonly summary?: string | undefined;
  readonly empty: boolean;
};
