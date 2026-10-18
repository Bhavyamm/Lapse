import { fireEvent, render, screen } from '@testing-library/react-native';

import { Chip } from './chip';

describe('Chip', () => {
  it('is announced as a radio with its label and checked state', async () => {
    await render(<Chip label="1 day before" selected onPress={() => {}} />);

    expect(screen.getByRole('radio', { name: '1 day before' })).toBeChecked();
  });

  it('is announced as not checked when not selected', async () => {
    await render(<Chip label="Morning of" selected={false} onPress={() => {}} />);

    expect(screen.getByRole('radio', { name: 'Morning of' })).not.toBeChecked();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<Chip label="3 days before" selected={false} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('radio', { name: '3 days before' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
