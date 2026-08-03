import { describe, expect, it } from 'vitest';
import { toneOf } from './audit.columns';

describe('toneOf', () => {
  it('tones restorative events success — even when their code contains "blocked"', () => {
    // `access.unblocked` contains the substring `blocked`; POSITIVE must win.
    expect(toneOf('access.unblocked')).toBe('success');
    expect(toneOf('account.enabled')).toBe('success');
    expect(toneOf('account.deletion-canceled')).toBe('success');
  });

  it('tones harmful events destructive', () => {
    expect(toneOf('access.blocked')).toBe('destructive');
    expect(toneOf('account.disabled')).toBe('destructive');
    expect(toneOf('session.revoked')).toBe('destructive');
    expect(toneOf('account.deletion-scheduled')).toBe('destructive');
  });

  it('tones neutral events secondary', () => {
    expect(toneOf('member.roles-assigned')).toBe('secondary');
    expect(toneOf('invitation.created')).toBe('secondary');
    expect(toneOf('session.switched')).toBe('secondary');
  });
});
