import { router } from 'expo-router';

import { openSubscription } from './open';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('openSubscription', () => {
  it('opens the Trial screen while a free trial runs', () => {
    openSubscription('d', true);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/trial/[id]', params: { id: 'd' } });
  });

  it('opens the detail screen otherwise', () => {
    openSubscription('n');
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/subscription/[id]', params: { id: 'n' } });
  });
});
