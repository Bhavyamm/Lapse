import { findService } from '@/features/catalog/catalog';

import { blankDraft, describeDraft, draftFromService, draftProblem, toNewSubscription } from './draft';

const today = '2026-10-17';

describe('drafts', () => {
  it('starts a catalog pick at its usual price, next charge one cycle away', () => {
    const draft = draftFromService(findService('spotify')!, today);
    expect(draft).toMatchObject({ name: 'Spotify', priceText: '11.99', cycle: 'month', trial: false });
    expect(draft.chargeOn).toBe('2026-11-17');
  });

  it('starts a service with a usual free trial as a trial ending after it', () => {
    const draft = draftFromService(findService('duolingo-max')!, today);
    expect(draft.trial).toBe(true);
    expect(draft.chargeOn).toBe('2026-10-31');
    expect(describeDraft(draft)).toBe('Free trial, then $29.99 a month');
  });

  it('gives custom drafts distinct keys and asks for a name and a price', () => {
    const a = blankDraft('', today);
    const b = blankDraft('Gym', today);
    expect(a.key).not.toBe(b.key);
    expect(draftProblem(a)).toBe('Add a name.');
    expect(draftProblem(b)).toBe('Add a price, like 9.99.');
    expect(draftProblem({ ...b, priceText: '40' })).toBeNull();
  });

  it('turns a draft into a subscription with the price in cents and a trimmed name', () => {
    const draft = { ...blankDraft('  Gym ', today), priceText: '39.5', cycle: 'year' as const };
    expect(toNewSubscription(draft)).toEqual({
      serviceId: null,
      name: 'Gym',
      priceCents: 3950,
      cycle: 'year',
      chargeOn: '2026-11-17',
      trial: false,
    });
  });
});
