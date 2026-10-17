import { fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { FloatingTabBar } from './floating-tab-bar';

const routes = [
  { key: 'home', name: 'index', title: 'Home' },
  { key: 'subs', name: 'subscriptions', title: 'All subscriptions', tabBarLabel: 'Subscriptions' },
];

function bar(index: number) {
  const navigation = { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() };
  const props = {
    state: { index, routes: routes.map(({ key, name }) => ({ key, name })) },
    descriptors: Object.fromEntries(
      routes.map(({ key, title, tabBarLabel }) => [key, { options: { title, tabBarLabel } }]),
    ),
    navigation,
    insets: { top: 0, bottom: 34, left: 0, right: 0 },
  } as unknown as BottomTabBarProps;
  return { props, navigation };
}

describe('FloatingTabBar', () => {
  it('names the open tab on screen, not only for screen readers', async () => {
    await render(<FloatingTabBar {...bar(1).props} />);

    expect(screen.getByText('Subscriptions')).toBeOnTheScreen();
    expect(screen.queryByText('Home')).toBeNull();
    expect(screen.getByRole('tab', { name: 'All subscriptions' })).toBeSelected();
  });

  it('switches tabs, and a tap on the open tab only tells it to scroll up', async () => {
    const { props, navigation } = bar(0);
    await render(<FloatingTabBar {...props} />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Home' }));
    expect(navigation.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'tabPress', target: 'home' }));
    expect(navigation.navigate).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('tab', { name: 'All subscriptions' }));
    expect(navigation.navigate).toHaveBeenCalledWith('subscriptions', undefined);
  });
});
