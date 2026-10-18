import { summarizeSavings, toCancelled } from './savings';
import type { Subscription } from './types';

const sub = (over: Partial<Subscription>): Subscription => ({
  id: over.name ?? 'x',
  serviceId: null,
  name: 'x',
  priceCents: 1000,
  currency: 'USD',
  cycle: 'month',
  chargeOn: '2026-06-10',
  trial: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('savings', () => {
  it('counts every charge a cancelled subscription would have made since', () => {
    const hulu = toCancelled(sub({ name: 'Hulu', priceCents: 1799, chargeOn: '2026-03-10' }), '2026-06-01');
    expect(hulu.savedFrom).toBe('2026-06-10');
    // Jun 10, Jul 10, Aug 10, Sep 10, Oct 10.
    expect(summarizeSavings([hulu], '2026-10-16')).toEqual({ savedCents: 5 * 1799, cancelled: 1, trialsCaught: 0 });
  });

  it('counts nothing before the next charge comes round', () => {
    const c = toCancelled(sub({ chargeOn: '2026-10-20' }), '2026-10-16');
    expect(summarizeSavings([c], '2026-10-16').savedCents).toBe(0);
  });

  it('calls a trial cancelled before it converts a trial caught', () => {
    const c = toCancelled(sub({ trial: true, chargeOn: '2026-09-20', priceCents: 2999 }), '2026-09-18');
    expect(summarizeSavings([c], '2026-10-16')).toEqual({ savedCents: 2999, cancelled: 0, trialsCaught: 1 });
  });

  it('calls a trial cancelled after it converted a normal cancel', () => {
    const c = toCancelled(sub({ trial: true, chargeOn: '2026-09-20' }), '2026-10-01');
    expect(c.trial).toBe(false);
    expect(c.savedFrom).toBe('2026-10-20');
    expect(summarizeSavings([c], '2026-10-16')).toMatchObject({ cancelled: 1, trialsCaught: 0 });
  });

  it('treats a charge due today as already paid', () => {
    const c = toCancelled(sub({ chargeOn: '2026-09-16' }), '2026-10-16');
    expect(c.savedFrom).toBe('2026-11-16');
  });

  it('keeps month-end dates on the original anchor', () => {
    const c = toCancelled(sub({ chargeOn: '2026-01-31' }), '2026-02-01');
    expect(c.savedFrom).toBe('2026-02-28');
    // Feb 28, Mar 31, Apr 30.
    expect(summarizeSavings([c], '2026-04-30').savedCents).toBe(3000);
  });
});
