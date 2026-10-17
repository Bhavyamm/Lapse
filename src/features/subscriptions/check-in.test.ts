import { checkInQueue, dueCount, isDue } from './check-in';
import type { Subscription } from './types';

const sub = (over: Partial<Subscription>): Subscription => ({
  id: 's',
  serviceId: null,
  name: 'Spotify',
  priceCents: 1199,
  currency: 'USD',
  cycle: 'month',
  chargeOn: '2026-10-19',
  trial: false,
  createdAt: '2026-08-01T09:00:00.000Z',
  ...over,
});
const today = '2026-10-16';

describe('isDue', () => {
  it('is due when not kept at a check-in this month', () => {
    expect(isDue(sub({}), today)).toBe(true);
    expect(isDue(sub({ reviewedOn: '2026-09-16' }), today)).toBe(true);
    expect(isDue(sub({ reviewedOn: '2026-10-01' }), today)).toBe(false);
    // "Next month" puts it off until the next month starts.
    expect(isDue(sub({ reviewedOn: '2026-08-10', skippedOn: '2026-10-02' }), today)).toBe(false);
    expect(isDue(sub({ skippedOn: '2026-10-02' }), '2026-11-01')).toBe(true);
  });

  it('waits a month for one added this month, and leaves running trials out', () => {
    expect(isDue(sub({ createdAt: new Date(2026, 9, 4).toISOString() }), today)).toBe(false);
    expect(isDue(sub({ trial: true, chargeOn: '2026-10-20' }), today)).toBe(false);
    // A trial that has turned into a paid subscription is checked like the rest.
    expect(isDue(sub({ trial: true, chargeOn: '2026-09-20' }), today)).toBe(true);
  });
});

describe('checkInQueue', () => {
  it('puts the longest unreviewed and most expensive first', () => {
    const subs = [
      sub({ id: 'yt', name: 'YouTube', priceCents: 1399, reviewedOn: '2026-09-16' }),
      sub({ id: 'gpt', name: 'ChatGPT', priceCents: 2000 }),
      sub({ id: 'cloud', name: 'iCloud', priceCents: 299 }),
      sub({ id: 'trial', trial: true, chargeOn: '2026-10-20' }),
    ];
    expect(checkInQueue(subs, today).map((s) => s.id)).toEqual(['gpt', 'cloud', 'yt']);
    expect(dueCount(subs, today)).toBe(3);
  });

  it('goes through everything again once this month’s are done', () => {
    const subs = [
      sub({ id: 'a', reviewedOn: '2026-10-02' }),
      sub({ id: 'b', reviewedOn: '2026-10-05', priceCents: 5000 }),
    ];
    expect(dueCount(subs, today)).toBe(0);
    expect(checkInQueue(subs, today).map((s) => s.id)).toEqual(['a', 'b']);
  });
});
