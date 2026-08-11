/**
 * Fixture picklist for the New-appointment dialog — the clients already seen
 * across the agenda fixtures, so the dialog feels like it's booking into the
 * same shop rather than a blank slate. Individual-account scope: there's no
 * staff picker here — the account owner IS the calendar, so every booking is
 * implicitly theirs (see ACCOUNT_OWNER_NAME in new-appointment.form.tsx).
 * Data only.
 */
import type { ComboboxOption } from '@acme/ui';

export const CLIENTS: readonly ComboboxOption[] = [
  { value: 'diego-marin', label: 'Diego Marín' },
  { value: 'luis-pena', label: 'Luis Peña' },
  { value: 'emilio-cruz', label: 'Emilio Cruz' },
  { value: 'andres-soto', label: 'Andrés Soto' },
  { value: 'javier-luna', label: 'Javier Luna' },
  { value: 'ivan-rios', label: 'Iván Ríos' },
];
