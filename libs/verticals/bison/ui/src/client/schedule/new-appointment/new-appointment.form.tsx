/**
 * Form state of the New-appointment dialog: client plus a start/end time pair
 * (like Block-time's fields) — no service field (2026-08-11, Josh: drop it
 * from booking). Creation has no fit rules of its own — the user places the
 * appointment wherever they like; buffer/walls/overlap only govern
 * *reordering* an existing one (see the Reorder flow). Re-anchors its
 * start/end to `initialStartMin` on each open, same open-transition pattern
 * as Block-time's `useBlockForm`.
 *
 * Individual-account scope: no staff field — every booking is implicitly
 * the account owner's own. Revisit once the organization-account view
 * (multiple staff, assignment) exists.
 */
import { useEffect, useRef, useState } from 'react';
import { DAY_END_MIN } from '../schedule.time';
import type { NewAppointment } from '../schedule.types';
import { CLIENTS } from './new-appointment.fixtures';

const DEFAULT_DURATION = 45;

/** The individual account's own name — matches client.shell.tsx's UserMenu
 *  until real auth/identity exists. */
export const ACCOUNT_OWNER_NAME = 'Marco Vega';

export const useAppointmentForm = (params: {
  readonly open: boolean;
  readonly initialStartMin: number;
  readonly onCreate: (appointment: NewAppointment) => void;
  readonly close: () => void;
}) => {
  const { open, initialStartMin } = params;
  const [clientId, setClientId] = useState('');
  const [startMin, setStartMin] = useState(initialStartMin);
  const [endMin, setEndMin] = useState(
    Math.min(initialStartMin + DEFAULT_DURATION, DAY_END_MIN),
  );

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setStartMin(initialStartMin);
      setEndMin(Math.min(initialStartMin + DEFAULT_DURATION, DAY_END_MIN));
    }
    wasOpen.current = open;
  }, [open, initialStartMin]);

  const durationMinutes = endMin - startMin;
  const valid = !!clientId && durationMinutes > 0;

  const submit = () => {
    const client = CLIENTS.find((c) => c.value === clientId);
    if (!client || !valid) return;
    params.onCreate({
      clientName: client.label,
      service: '',
      staffName: ACCOUNT_OWNER_NAME,
      startMin,
      durationMinutes,
    });
    params.close();
    setClientId('');
  };

  return {
    clientId,
    setClientId,
    startMin,
    setStartMin,
    endMin,
    setEndMin,
    valid,
    submit,
  };
};
