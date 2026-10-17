import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CharcoalCard } from '@/components/cards';
import { CalendarIcon, HomeIcon, ListIcon, ProfileIcon } from '@/components/icons';
import { colors, radii, tabBar } from '@/theme';

const icons: Record<string, ComponentType<{ color: string }>> = {
  index: HomeIcon,
  calendar: CalendarIcon,
  subscriptions: ListIcon,
  profile: ProfileIcon,
};

/** The floating charcoal pill nav from the designs: four round icon buttons. */
export function FloatingTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, tabBar.bottomGap) }]}>
      <CharcoalCard radius={tabBar.height / 2} style={styles.bar} contentStyle={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = icons[route.name] ?? HomeIcon;
          const { options } = descriptors[route.key];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              role="tab"
              aria-selected={focused}
              aria-label={options.title ?? route.name}
              onPress={onPress}
              style={[styles.tab, focused && styles.tabActive]}>
              <Icon color={focused ? colors.ink : colors.textOnDarkSecondary} />
            </Pressable>
          );
        })}
      </CharcoalCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    width: tabBar.width,
    height: tabBar.height,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tab: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
});
