import { fireEvent, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import { CONTACT_EMAIL, LEGAL_DOCS } from '@/features/legal/documents';

import LegalScreen from '@/app/legal/[doc]';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

describe('Legal pages', () => {
  it('shows the Privacy Policy with its date and every section', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ doc: 'privacy' });
    await render(<LegalScreen />);

    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeOnTheScreen();
    expect(screen.getByText(`Last updated ${LEGAL_DOCS.privacy.updated}`)).toBeOnTheScreen();
    for (const section of LEGAL_DOCS.privacy.sections) {
      expect(screen.getByRole('heading', { name: section.heading })).toBeOnTheScreen();
    }
    expect(screen.getByText(/^No bank, card or payment details./)).toBeOnTheScreen();
  });

  it('shows the Terms of Use, and closes', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ doc: 'terms' });
    await render(<LegalScreen />);

    expect(screen.getByRole('heading', { name: 'Terms of Use' })).toBeOnTheScreen();
    expect(screen.getByText(/It is not a subscription and never renews/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(jest.requireMock('expo-router').router.back).toHaveBeenCalled();
  });

  it('falls back to the Privacy Policy for an unknown page', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ doc: 'nope' });
    await render(<LegalScreen />);

    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeOnTheScreen();
  });

  it('points to a way to get in touch', () => {
    const last = (id: 'privacy' | 'terms') => LEGAL_DOCS[id].sections.at(-1)!.paragraphs!.join(' ');
    const how = CONTACT_EMAIL || 'support contact';
    expect(last('privacy')).toContain(how);
    expect(last('terms')).toContain(how);
  });
});
