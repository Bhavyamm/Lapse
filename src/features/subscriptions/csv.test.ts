import { toCsv } from './csv';
import type { Subscription } from './types';

const sub = (over: Partial<Subscription>): Subscription => ({
  id: over.name ?? 'x',
  serviceId: null,
  name: 'x',
  priceCents: 1000,
  currency: 'USD',
  cycle: 'month',
  chargeOn: '2026-10-20',
  trial: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('toCsv', () => {
  it('writes a header and one row per subscription, soonest first', () => {
    const csv = toCsv(
      [
        sub({ name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22' }),
        sub({ name: 'iCloud+', priceCents: 3599, cycle: 'year', chargeOn: '2025-11-01' }),
        sub({ name: 'Duolingo Max', priceCents: 2999, chargeOn: '2026-10-18', trial: true }),
      ],
      '2026-10-16',
    );
    expect(csv.split('\r\n')).toEqual([
      'Name,Price,Currency,Billing cycle,Next charge,Free trial,Cost per month',
      'Duolingo Max,29.99,USD,Monthly,2026-10-18,Yes,29.99',
      'Netflix,15.49,USD,Monthly,2026-10-22,No,15.49',
      'iCloud+,35.99,USD,Yearly,2026-11-01,No,3.00',
      '',
    ]);
  });

  it('quotes commas and quotes, and defuses formulas', () => {
    const csv = toCsv([sub({ name: 'Gym, "Pro"' }), sub({ name: '=HYPERLINK("x")' })], '2026-10-16');
    expect(csv).toContain('"Gym, ""Pro"""');
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
