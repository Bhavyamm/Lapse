import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { BottomSheet } from './bottom-sheet';

const sheet = (props: { visible: boolean; hideNow?: boolean }) => (
  <BottomSheet {...props} onClose={jest.fn()}>
    <Text>Sheet body</Text>
  </BottomSheet>
);

describe('BottomSheet', () => {
  it('shows its content when opened', async () => {
    await render(sheet({ visible: true }));
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
  });

  it('keeps the content while it slides away, then removes it', async () => {
    const view = await render(sheet({ visible: true }));
    await view.rerender(sheet({ visible: false }));
    await waitFor(() => expect(screen.queryByText('Sheet body')).toBeNull());
  });

  it('hides at once when told to', async () => {
    const view = await render(sheet({ visible: true }));
    await view.rerender(sheet({ visible: true, hideNow: true }));
    expect(screen.queryByText('Sheet body')).toBeNull();
    await view.rerender(sheet({ visible: true }));
    expect(screen.getByText('Sheet body')).toBeOnTheScreen();
  });
});
