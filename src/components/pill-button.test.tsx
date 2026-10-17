import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { PillButton } from './pill-button';

describe('PillButton', () => {
  it('grows with its label instead of clipping it at large text sizes', async () => {
    await render(<PillButton label="Cancel before Wednesday" icon={<Text>→</Text>} onPress={() => {}} />);

    const style = StyleSheet.flatten(screen.getByRole('button', { name: /^Cancel before Wednesday/ }).props.style);
    expect(style.height).toBeUndefined();
    expect(style.minHeight).toBe(60);
  });
});
