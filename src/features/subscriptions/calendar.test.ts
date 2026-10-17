import { chargesBetween, planMonth, shiftMonth } from './calendar';
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
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

// The Calendar design: today is Thursday Oct 16.
const today = '2026-10-16';
const design = [
  sub({ name: 'YouTube Premium', priceCents: 1399, chargeOn: '2026-11-03' }),
  sub({ name: 'ChatGPT', priceCents: 2000, chargeOn: '2026-11-08' }),
  sub({ name: 'iCloud+', priceCents: 299, chargeOn: '2026-11-12' }),
  sub({ name: 'Spotify', priceCents: 1199, chargeOn: '2026-10-19' }),
  sub({ name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22' }),
  sub({ name: 'Notion', priceCents: 1000, chargeOn: '2026-10-27' }),
  sub({ name: 'Duolingo Max', priceCents: 2999, chargeOn: '2026-10-18', trial: true }),
];

describe('chargesBetween', () => {
  it('repeats each subscription by its cycle and sorts by day', () => {
    const charges = chargesBetween(
      [
        sub({ name: 'Weekly', cycle: 'week', chargeOn: '2026-10-01' }),
        sub({ name: 'Yearly', cycle: 'year', chargeOn: '2025-10-10' }),
      ],
      '2026-10-01',
      '2026-10-31',
    );
    expect(charges.map((c) => `${c.sub.name} ${c.on}`)).toEqual([
      'Weekly 2026-10-01',
      'Weekly 2026-10-08',
      'Yearly 2026-10-10',
      'Weekly 2026-10-15',
      'Weekly 2026-10-22',
      'Weekly 2026-10-29',
    ]);
  });

  it('keeps a month-end date at the end of each month', () => {
    const charges = chargesBetween([sub({ chargeOn: '2026-01-31' })], '2026-02-01', '2026-03-31');
    expect(charges.map((c) => c.on)).toEqual(['2026-02-28', '2026-03-31']);
  });

  it('marks only the first charge of a trial as the trial ending', () => {
    const charges = chargesBetween([sub({ trial: true, chargeOn: '2026-10-18' })], '2026-10-01', '2026-11-30');
    expect(charges.map((c) => [c.on, c.trialEnding])).toEqual([
      ['2026-10-18', true],
      ['2026-11-18', false],
    ]);
  });
});

describe('planMonth', () => {
  it('counts what is left of the current month, like the design', () => {
    const plan = planMonth(design, 2026, 9, today);
    expect(plan.current).toBe(true);
    expect(plan.dueCents).toBe(6747);
    expect(plan.charges.map((c) => c.sub.name)).toEqual(['Duolingo Max', 'Spotify', 'Netflix', 'Notion']);
    expect(plan.byDay.get('2026-10-18')?.[0].trialEnding).toBe(true);
  });

  it('leaves out charges earlier in the current month', () => {
    const plan = planMonth([sub({ chargeOn: '2026-09-03' })], 2026, 9, today);
    expect(plan.charges).toEqual([]);
    expect(plan.dueCents).toBe(0);
  });

  it('counts the whole of a later month, the converted trial included', () => {
    const plan = planMonth(design, 2026, 10, today);
    expect(plan.current).toBe(false);
    expect(plan.charges).toHaveLength(7);
    expect(plan.dueCents).toBe(7446 + 2999);
  });

  it('includes a charge due today', () => {
    expect(planMonth([sub({ chargeOn: today })], 2026, 9, today).dueCents).toBe(1000);
  });
});

describe('shiftMonth', () => {
  it('moves across the year end', () => {
    expect(shiftMonth('2026-12-31', 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth('2026-01-31', -1)).toEqual({ year: 2025, month: 11 });
  });
});
