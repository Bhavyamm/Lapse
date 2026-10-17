import { cancelGuide } from './cancel';
import type { Subscription } from './types';

const sub = (over: Partial<Subscription>): Subscription => ({
  id: 'x',
  serviceId: null,
  name: 'Gym',
  priceCents: 1000,
  currency: 'USD',
  cycle: 'month',
  chargeOn: '2026-10-22',
  trial: false,
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

describe('cancelGuide', () => {
  it('uses the service’s own cancel page and steps when the catalog has them', () => {
    const guide = cancelGuide(sub({ serviceId: 'netflix', name: 'Netflix' }), 'Thu, Oct 22', 'ios');
    expect(guide.url).toBe('https://www.netflix.com/cancelplan');
    expect(guide.action).toBe('Open Netflix cancel page');
    expect(guide.steps).toHaveLength(3);
    expect(guide.steps[2]).toContain('until Thu, Oct 22');
    expect(guide.storeUrl).toBeUndefined();
  });

  it('sends App Store billing to the App Store on iPhone and Google Play on Android', () => {
    const duo = sub({ serviceId: 'duolingo-max', name: 'Duolingo Max' });
    expect(cancelGuide(duo, 'Sun, Oct 18', 'ios')).toMatchObject({
      url: 'https://apps.apple.com/account/subscriptions',
      action: 'Open App Store subscriptions',
    });
    const android = cancelGuide(duo, 'Sun, Oct 18', 'android');
    expect(android.url).toBe('https://play.google.com/store/account/subscriptions');
    expect(android.steps[1]).toBe('Tap Duolingo Max, then Cancel subscription.');
  });

  it('falls back to general steps and a web search, with the store link as a backup', () => {
    const guide = cancelGuide(sub({ name: 'Gym & Spa' }), 'Thu, Oct 22', 'ios');
    expect(guide.url).toBe('https://www.google.com/search?q=how%20to%20cancel%20Gym%20%26%20Spa');
    expect(guide.action).toBe('Search how to cancel Gym & Spa');
    expect(guide.storeUrl).toBe('https://apps.apple.com/account/subscriptions');
    expect(cancelGuide(sub({}), 'x', 'web').storeUrl).toBeUndefined();
  });

  it('always sends Apple’s own services to Apple, even on Android', () => {
    const guide = cancelGuide(sub({ serviceId: 'apple-music', name: 'Apple Music' }), 'x', 'android');
    expect(guide.url).toBe('https://apps.apple.com/account/subscriptions');
  });

  it('uses general steps on web for store-billed services', () => {
    const guide = cancelGuide(sub({ serviceId: 'duolingo-max', name: 'Duolingo Max' }), 'x', 'web');
    expect(guide.action).toBe('Search how to cancel Duolingo Max');
  });
});
