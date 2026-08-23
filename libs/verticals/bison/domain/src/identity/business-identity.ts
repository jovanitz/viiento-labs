import { type Result, err, ok } from '@acme/shared';
import { defineError, type TaggedError } from '@acme/shared';

/**
 * The account's own identity — what a document's `business.*` tokens
 * resolve to (ADR-0020 §4). One record per account, and every field is
 * born EMPTY: a fresh business has told us nothing, and until it does the
 * app must not invent a letterhead for it. An empty field simply does not
 * print.
 *
 * `logoPath` follows the photo pattern: an opaque path in the account's
 * private storage (`identity/<fileId>`), never a URL and never bytes.
 */
export const invalidBusinessIdentity = defineError(
  'domain/invalid-business-identity',
);

export type BusinessIdentityError =
  TaggedError<'domain/invalid-business-identity'>;

export type BusinessIdentity = {
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  /** Professional license / registration line (issuer.license). */
  readonly license: string;
  /** Storage path of the logo on file, or '' — never a URL. */
  readonly logoPath: string;
  readonly updatedAt: string;
};

export const EMPTY_BUSINESS_IDENTITY: BusinessIdentity = {
  name: '',
  address: '',
  phone: '',
  license: '',
  logoPath: '',
  updatedAt: '',
};

export type BusinessIdentityChanges = Partial<
  Omit<BusinessIdentity, 'updatedAt'>
>;

const LIMITS: ReadonlyArray<readonly [keyof BusinessIdentityChanges, number]> =
  [
    ['name', 120],
    ['address', 240],
    ['phone', 40],
    ['license', 120],
  ];

const LOGO_PATH_RE = /^identity\/[^/]+$/;

/**
 * Apply changes; every field is optional and trimmed, '' clears. The only
 * hard rule is shape: bounded lengths, and a logo path under the
 * account's own identity/ prefix.
 */
const firstShapeError = (
  changes: BusinessIdentityChanges,
): BusinessIdentityError | undefined => {
  for (const [field, max] of LIMITS) {
    const value = changes[field];
    if (value !== undefined && value.trim().length > max) {
      return invalidBusinessIdentity(
        `${field} must be at most ${max} characters.`,
      );
    }
  }
  const logo = changes.logoPath;
  if (logo !== undefined && logo !== '' && !LOGO_PATH_RE.test(logo)) {
    return invalidBusinessIdentity(
      `Logo path must live under identity/ — got ${logo}.`,
    );
  }
  return undefined;
};

const pick = (next: string | undefined, current: string): string =>
  (next ?? current).trim();

export const updateBusinessIdentity = (
  current: BusinessIdentity,
  changes: BusinessIdentityChanges,
  occurredAt: string,
): Result<BusinessIdentity, BusinessIdentityError> => {
  const shapeError = firstShapeError(changes);
  if (shapeError) return err(shapeError);
  return ok({
    name: pick(changes.name, current.name),
    address: pick(changes.address, current.address),
    phone: pick(changes.phone, current.phone),
    license: pick(changes.license, current.license),
    logoPath: changes.logoPath ?? current.logoPath,
    updatedAt: occurredAt,
  });
};
