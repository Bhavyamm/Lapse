import { router } from 'expo-router';

import { usePro } from '@/features/pro/purchase';
import { useSubscriptions } from '@/stores/subscriptions';

import { FREE_LIMIT, openAdd, roomLeft } from './limit';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const sub = { serviceId: null, priceCents: 100, cycle: 'month' as const, chargeOn: '2026-10-20', trial: false };
const initial = useSubscriptions.getState();

afterEach(() => {
  jest.clearAllMocks();
  useSubscriptions.setState(initial, true);
  usePro.setState({ isPro: false });
});

describe('free plan limit', () => {
  it('leaves room for 2 on the free plan and any number with Pro', () => {
    expect(FREE_LIMIT).toBe(2);
    expect(roomLeft(0, false)).toBe(2);
    expect(roomLeft(1, false)).toBe(1);
    expect(roomLeft(5, false)).toBe(0);
    expect(roomLeft(5, true)).toBe(Infinity);
  });

  it('opens Add while there is room, and Pro once the free plan is full', () => {
    useSubscriptions.getState().add([{ ...sub, name: 'A' }]);
    openAdd();
    expect(router.push).toHaveBeenLastCalledWith('/add');

    useSubscriptions.getState().add([{ ...sub, name: 'B' }]);
    openAdd();
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/pro', params: { reason: 'limit' } });

    usePro.setState({ isPro: true });
    openAdd();
    expect(router.push).toHaveBeenLastCalledWith('/add');
  });
});
