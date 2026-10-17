import type { Subscription } from '@/features/subscriptions/types';

import { dayWord, MAX_REMINDERS, planReminders, reminderContent, tonight } from './plan';

const on = { remindersEnabled: true, reminderLead: 'oneDay' as const };
const sub = (over: Partial<Subscription>): Subscription => ({
  id: 's',
  serviceId: null,
  name: 'Spotify',
  priceCents: 1199,
  currency: 'USD',
  cycle: 'month',
  chargeOn: '2026-10-19',
  trial: false,
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
});
// Friday Oct 16 2026, 8 AM.
const now = new Date(2026, 9, 16, 8, 0);

describe('planReminders', () => {
  it('schedules each upcoming renewal at 9 AM, a day early by default', () => {
    const planned = planReminders([sub({})], on, now);

    expect(planned.map((r) => r.id)).toEqual(['s:2026-10-19', 's:2026-11-19', 's:2026-12-19']);
    expect(planned[0].at).toEqual(new Date(2026, 9, 18, 9, 0));
    expect(planned[0]).toMatchObject({
      title: 'Spotify renews tomorrow',
      body: '$11.99 a month, renews Mon, Oct 19',
      data: { subscriptionId: 's', kind: 'renewal', chargeOn: '2026-10-19' },
      category: undefined,
    });
  });

  it('gives a running trial the trial wording and buttons', () => {
    const duo = sub({ id: 'd', name: 'Duolingo Max', priceCents: 2999, chargeOn: '2026-10-18', trial: true });
    const [first, second] = planReminders([duo], on, now);

    expect(first).toMatchObject({
      id: 'd:2026-10-18',
      title: 'Duolingo Max trial ends tomorrow',
      body: 'Cancel before Sunday to skip the $29.99 charge. It takes about a minute.',
      category: 'trial',
      data: { kind: 'trial' },
    });
    // After the trial it renews like any other.
    expect(second).toMatchObject({ id: 'd:2026-11-18', data: { kind: 'renewal' } });
  });

  it('uses each subscription’s own lead time', () => {
    const [r] = planReminders([sub({ lead: 'threeDays', chargeOn: '2026-10-25' })], on, now);
    expect(r.at).toEqual(new Date(2026, 9, 22, 9, 0));
    expect(r.title).toBe('Spotify renews Sunday');
  });

  it('skips reminders whose time has passed', () => {
    const later = new Date(2026, 9, 18, 10, 0);
    const planned = planReminders([sub({})], on, later);
    expect(planned[0].id).toBe('s:2026-11-19');
  });

  it('schedules nothing with reminders off, or for a subscription with its alert off', () => {
    expect(planReminders([sub({})], { ...on, remindersEnabled: false }, now)).toEqual([]);
    expect(planReminders([sub({ remind: false })], on, now)).toEqual([]);
  });

  it('drops the trial reminder once the trial is kept, but keeps the renewals', () => {
    const kept = sub({ chargeOn: '2026-10-18', trial: true, trialKept: true });
    expect(planReminders([kept], on, now).map((r) => r.data.kind)).toEqual(['renewal', 'renewal']);
  });

  it('adds a "remind me tonight" reminder while the trial runs', () => {
    const snoozed = sub({ chargeOn: '2026-10-18', trial: true, snoozeUntil: new Date(2026, 9, 16, 20, 0).getTime() });
    const planned = planReminders([snoozed], on, now);

    expect(planned[0]).toMatchObject({ id: 's:snooze', title: 'Spotify trial ends Sunday', category: 'trial' });
    expect(planned[0].at).toEqual(new Date(2026, 9, 16, 20, 0));
  });

  it('keeps the soonest reminders under the iOS limit', () => {
    const many = Array.from({ length: 30 }, (_, i) => sub({ id: `w${i}`, cycle: 'week', chargeOn: '2026-10-20' }));
    const planned = planReminders(many, on, now);

    expect(planned).toHaveLength(MAX_REMINDERS);
    expect(planned.every((r, i) => i === 0 || planned[i - 1].at <= r.at)).toBe(true);
  });
});

describe('reminderContent', () => {
  it('says today on the morning of', () => {
    const trial = sub({ trial: true, chargeOn: '2026-10-16' });
    expect(reminderContent(trial, '2026-10-16', 'trial', new Date(2026, 9, 16, 9, 0))).toEqual({
      title: 'Spotify trial ends today',
      body: 'Cancel today to skip the $11.99 charge. It takes about a minute.',
    });
  });
});

describe('dayWord', () => {
  it('names the day relative to when the reminder arrives', () => {
    expect(dayWord('2026-10-16', '2026-10-16')).toBe('today');
    expect(dayWord('2026-10-16', '2026-10-17')).toBe('tomorrow');
    expect(dayWord('2026-10-16', '2026-10-19')).toBe('Monday');
    expect(dayWord('2026-10-16', '2026-10-25')).toBe('on Sun, Oct 25');
  });
});

describe('tonight', () => {
  it('is 8 PM, or an hour from now when 8 PM is too close or gone', () => {
    expect(tonight(new Date(2026, 9, 16, 9, 0))).toEqual(new Date(2026, 9, 16, 20, 0));
    expect(tonight(new Date(2026, 9, 16, 19, 50))).toEqual(new Date(2026, 9, 16, 20, 50));
    expect(tonight(new Date(2026, 9, 16, 22, 0))).toEqual(new Date(2026, 9, 16, 23, 0));
  });
});
