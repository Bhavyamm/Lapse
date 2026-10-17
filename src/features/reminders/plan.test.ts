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

    expect(planned.filter((r) => r.data.kind === 'renewal').map((r) => r.id)).toEqual([
      's:2026-10-19',
      's:2026-11-19',
      's:2026-12-19',
    ]);
    expect(planned[0].at).toEqual(new Date(2026, 9, 18, 9, 0));
    expect(planned[0]).toMatchObject({
      title: 'Spotify renews tomorrow',
      body: '$11.99 a month, charged Oct 19.',
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

  it('falls back to the next 9 AM before the charge once the lead time has passed', () => {
    const [late] = planReminders([sub({})], on, new Date(2026, 9, 18, 10, 0));
    expect(late).toMatchObject({ id: 's:2026-10-19', title: 'Spotify renews today' });
    expect(late.at).toEqual(new Date(2026, 9, 19, 9, 0));

    // A trial ending in two days with a 3-day lead still gets reminded, at 9 AM today.
    const trial = sub({ trial: true, chargeOn: '2026-10-18', lead: 'threeDays' });
    expect(planReminders([trial], on, now)[0].at).toEqual(new Date(2026, 9, 16, 9, 0));

    // Past 9 AM on the charge day there is nothing left to remind about.
    const after = planReminders([sub({})], on, new Date(2026, 9, 19, 10, 0)).filter((r) => r.data.kind === 'renewal');
    expect(after[0].id).toBe('s:2026-11-19');
  });

  it('schedules nothing with reminders off, or for a subscription with its alert off', () => {
    expect(planReminders([sub({})], { ...on, remindersEnabled: false }, now)).toEqual([]);
    expect(planReminders([sub({ remind: false })], on, now).filter((r) => r.data.kind !== 'checkin')).toEqual([]);
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

  it('never drops a trial reminder for renewals at the limit', () => {
    const many = Array.from({ length: 30 }, (_, i) => sub({ id: `w${i}`, cycle: 'week', chargeOn: '2026-10-20' }));
    const trial = sub({ id: 't', trial: true, chargeOn: '2027-01-10' });
    const planned = planReminders([...many, trial], on, now);

    expect(planned).toHaveLength(MAX_REMINDERS);
    expect(planned.at(-1)?.id).toBe('t:2027-01-10');
  });

  it('ignores a "remind me tonight" past the trial’s last day', () => {
    const late = sub({ chargeOn: '2026-10-16', trial: true, snoozeUntil: new Date(2026, 9, 17, 0, 30).getTime() });
    expect(planReminders([late], on, now).some((r) => r.id === 's:snooze')).toBe(false);
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

describe('monthly check-in reminders', () => {
  it('come at 9 AM on the 1st of each month ahead', () => {
    const checkIns = planReminders([sub({}), sub({ id: 'n', name: 'Netflix' })], on, now).filter(
      (r) => r.data.kind === 'checkin',
    );

    expect(checkIns.map((r) => r.id)).toEqual(['checkin:2026-11-01', 'checkin:2026-12-01', 'checkin:2027-01-01']);
    expect(checkIns[0]).toMatchObject({
      title: 'Monthly check-in',
      body: 'Take a minute to see if your subscriptions are still worth it.',
    });
    expect(checkIns[0].at).toEqual(new Date(2026, 10, 1, 9, 0));
  });

  it('include today when it’s the 1st and 9 AM hasn’t come yet', () => {
    const early = planReminders([sub({ chargeOn: '2026-11-20' })], on, new Date(2026, 10, 1, 8, 0));
    expect(early.find((r) => r.data.kind === 'checkin')?.id).toBe('checkin:2026-11-01');

    const late = planReminders([sub({ chargeOn: '2026-11-20' })], on, new Date(2026, 10, 1, 10, 0));
    expect(late.find((r) => r.data.kind === 'checkin')?.id).toBe('checkin:2026-12-01');
  });

  it('don’t come with only free trials running', () => {
    const trial = sub({ trial: true, chargeOn: '2026-10-25' });
    expect(planReminders([trial], on, now).some((r) => r.data.kind === 'checkin')).toBe(false);
  });
});
