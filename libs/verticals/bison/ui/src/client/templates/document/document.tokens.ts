/**
 * Tokens — everything on a document that is NOT a captured field: who the
 * business is, who the client is, the folio, the issue date (ADR-0020 §4).
 *
 * A token is a key, never a typed string. That is the whole point: if the
 * business could type its own name onto the layout, the name would be
 * frozen into every document from that day forward, and the issue date
 * would be whatever day the layout happened to be designed. Values are
 * resolved at render time from the account and the issue.
 *
 * The account fills itself in over time, so a token can legitimately have
 * no value yet. That prints as nothing — a document with an empty
 * letterhead, which is what an account that has not set its details up
 * should get, and what stops the app from inventing an identity for it.
 */

export type DocumentToken =
  | 'business.name'
  | 'business.address'
  | 'business.phone'
  | 'client.name'
  | 'document.folio'
  | 'document.issuedAt';

/** Shown in the designer's palette, and used as the stand-in in a layout
 *  preview so the business can see WHERE its name will land before it has
 *  one on file. */
export const TOKEN_LABEL: Record<DocumentToken, string> = {
  'business.name': 'Business name',
  'business.address': 'Business address',
  'business.phone': 'Business phone',
  'client.name': 'Client name',
  'document.folio': 'Folio',
  'document.issuedAt': 'Issue date',
};

export const DOCUMENT_TOKENS = Object.keys(
  TOKEN_LABEL,
) as readonly DocumentToken[];

/** What a token resolves to. Anything missing simply does not print. */
export type TokenValues = Partial<Record<DocumentToken, string>>;

/**
 * The account's own details, as they stand. Empty is the honest default:
 * a fresh account has told us nothing, and until it does the app must not
 * fill the gap. Real values arrive from account settings.
 */
export const EMPTY_ACCOUNT: TokenValues = {};

/** Layout-preview stand-ins: each token shows its own name, so the page
 *  reads as a shape to judge rather than as somebody's record. */
export const PLACEHOLDER_TOKENS: TokenValues = Object.fromEntries(
  DOCUMENT_TOKENS.map((token) => [token, TOKEN_LABEL[token]]),
);
