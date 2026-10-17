import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSubscriptions } from './subscriptions';

const initial = useSubscriptions.getState();
const netflix = {
  serviceId: 'netflix',
  name: 'Netflix',
  priceCents: 1549,
  cycle: 'month' as const,
  chargeOn: '2026-10-22',
  trial: false,
};

describe('subscriptions store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSubscriptions.setState(initial, true);
  });

  it('adds subscriptions with unique ids, USD, and a created time', () => {
    const added = useSubscriptions.getState().add([netflix, { ...netflix, name: 'Netflix 2' }]);

    expect(added).toHaveLength(2);
    expect(added[0].id).not.toBe(added[1].id);
    expect(added[0]).toMatchObject({ ...netflix, currency: 'USD' });
    expect(Date.parse(added[0].createdAt)).not.toBeNaN();
    expect(useSubscriptions.getState().subscriptions).toEqual(added);
  });

  it('removes a subscription by id', () => {
    const [a, b] = useSubscriptions.getState().add([netflix, { ...netflix, name: 'Other' }]);

    useSubscriptions.getState().remove(a.id);

    expect(useSubscriptions.getState().subscriptions).toEqual([b]);
  });

  it('saves only the subscriptions, not actions or the hydrated flag', async () => {
    useSubscriptions.getState().add([netflix]);
    await Promise.resolve();

    const saved = JSON.parse((await AsyncStorage.getItem('lapse.subscriptions'))!);
    expect(Object.keys(saved.state)).toEqual(['subscriptions', 'cancelled']);
    expect(saved.state.subscriptions[0].name).toBe('Netflix');
  });

  it('restores saved subscriptions and marks itself hydrated', async () => {
    const stored = { ...netflix, id: 'x', currency: 'USD', createdAt: '2026-10-17T00:00:00.000Z' };
    await AsyncStorage.setItem(
      'lapse.subscriptions',
      JSON.stringify({ state: { subscriptions: [stored] }, version: 1 }),
    );

    await useSubscriptions.persist.rehydrate();

    expect(useSubscriptions.getState()).toMatchObject({ hydrated: true, subscriptions: [stored] });
  });
});

describe('cancel', () => {
  beforeEach(() => useSubscriptions.setState(initial, true));

  it('stops tracking the subscription and remembers it as cancelled', () => {
    const [added] = useSubscriptions.getState().add([netflix]);
    useSubscriptions.getState().cancel(added.id, '2026-10-16');

    const state = useSubscriptions.getState();
    expect(state.subscriptions).toEqual([]);
    expect(state.cancelled).toEqual([
      expect.objectContaining({ id: added.id, name: 'Netflix', savedFrom: '2026-10-22', cancelledOn: '2026-10-16' }),
    ]);
  });

  it('ignores an id it does not know', () => {
    useSubscriptions.getState().cancel('missing', '2026-10-16');
    expect(useSubscriptions.getState().cancelled).toEqual([]);
  });
});

describe('update', () => {
  beforeEach(() => useSubscriptions.setState(initial, true));

  it('merges changes and keeps the per-subscription reminder settings', () => {
    const [added] = useSubscriptions.getState().add([netflix]);
    useSubscriptions.getState().update(added.id, { lead: 'morningOf', remind: false });
    useSubscriptions.getState().update(added.id, { priceCents: 1799 });

    expect(useSubscriptions.getState().subscriptions[0]).toMatchObject({
      priceCents: 1799,
      lead: 'morningOf',
      remind: false,
      name: 'Netflix',
    });
  });

  it('forgets "keep it" and "tonight" once the trial’s end date changes', () => {
    const [added] = useSubscriptions.getState().add([{ ...netflix, trial: true }]);
    useSubscriptions.getState().update(added.id, { trialKept: true, snoozeUntil: 1 });
    useSubscriptions.getState().update(added.id, { priceCents: 999 });
    expect(useSubscriptions.getState().subscriptions[0]).toMatchObject({ trialKept: true, snoozeUntil: 1 });

    useSubscriptions.getState().update(added.id, { chargeOn: '2026-11-01' });
    const sub = useSubscriptions.getState().subscriptions[0];
    expect(sub.trialKept).toBeUndefined();
    expect(sub.snoozeUntil).toBeUndefined();
  });
});
