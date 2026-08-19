/**
 * Client · Settings — the INDIVIDUAL account's settings. Business
 * configuration (business name, working hours, buffers, scheduling
 * defaults) deliberately does NOT live here: it belongs to the
 * organization admin's account, so nothing in this module touches the
 * Agenda's rules.
 */

/** The account owner's own identity — what the topbar UserMenu shows. */
export type OwnerProfile = {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly photoUrl: string;
};

export type ThemeChoice = 'light' | 'dark' | 'system';

/** Personal notification toggles (prototype: local state, no delivery). */
export type NotificationPrefs = {
  readonly newBooking: boolean;
  readonly cancellation: boolean;
  readonly dailySummary: boolean;
};
