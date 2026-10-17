import { buildOverview, inDays, whenShort } from './overview';
import type { Subscription } from './types';

const today = '2026-10-16';
const sub = (over: Partial<Subscription>): Subscription => ({
  id: over.name ?? 'x',
  serviceId: null,
  name: 'x',
  priceCents: 1000,
  currency: 'USD',
  cycle: 'month',
  chargeOn: '2026-10-20',
  trial: false,
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

// The sample data from the designs: $74.46 a month, $894 a year.
const design = [
  sub({ name: 'YouTube Premium', priceCents: 1399, chargeOn: '2026-10-25' }),
  sub({ name: 'ChatGPT Plus', priceCents: 2000, chargeOn: '2026-11-02' }),
  sub({ name: 'iCloud+', priceCents: 299, chargeOn: '2026-10-28' }),
  sub({ name: 'Spotify', priceCents: 1199, chargeOn: '2026-10-19' }),
  sub({ name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22' }),
  sub({ name: 'Notion', priceCents: 1000, chargeOn: '2026-11-05' }),
];

describe('Home overview', () => {
  it('totals the month and the year like the design', () => {
    const o = buildOverview(design, today);
    expect(o.monthlyCents).toBe(7446);
    expect(o.yearlyCents).toBe(89352);
    expect(o.count).toBe(6);
  });

  it('spreads weekly and yearly prices into the monthly total', () => {
    const o = buildOverview(
      [sub({ priceCents: 1000, cycle: 'week' }), sub({ name: 'y', priceCents: 12000, cycle: 'year' })],
      today,
    );
    expect(o.monthlyCents).toBe(4333 + 1000);
    expect(o.yearlyCents).toBe(52000 + 12000);
  });

  it('flags trials ending within a week and keeps them out of Coming up', () => {
    const trial = sub({ name: 'Duolingo Max', priceCents: 2999, trial: true, chargeOn: '2026-10-18' });
    const o = buildOverview([...design, trial], today);
    expect(o.attention).toEqual([{ sub: trial, endsOn: '2026-10-18', daysLeft: 2 }]);
    expect(o.upcoming.map((u) => u.sub.name)).toEqual(['Spotify', 'Netflix', 'YouTube Premium', 'iCloud+']);
    expect(o.all).toHaveLength(7);
  });

  it('does not flag a trial that ends more than a week away, or one that already ended', () => {
    const later = sub({ name: 'Later', trial: true, chargeOn: '2026-10-30' });
    const ended = sub({ name: 'Ended', trial: true, chargeOn: '2026-10-01' });
    const o = buildOverview([later, ended], today);
    expect(o.attention).toEqual([]);
    expect(o.all.find((u) => u.sub.name === 'Ended')).toMatchObject({ next: '2026-11-01', trialEnding: false });
  });

  it('says when, in words', () => {
    expect([0, 1, 2].map(inDays)).toEqual(['today', 'tomorrow', 'in 2 days']);
    expect(whenShort('2026-10-17', today)).toBe('tomorrow');
    expect(whenShort('2026-10-18', today)).toBe('Sun');
  });
});
