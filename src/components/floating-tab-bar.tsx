import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CharcoalCard } from '@/components/cards';
import { CalendarIcon, HomeIcon, ListIcon, ProfileIcon } from '@/components/icons';
import { colors, fonts, radii, spacing, tabBar } from '@/theme';
import { animateLayout } from '@/utils/motion';

const icons: Record<string, ComponentType<{ color: string }>> = {
  index: HomeIcon,
  calendar: CalendarIcon,
  subscriptions: ListIcon,
  profile: ProfileIcon,
};

/**
 * The floating charcoal pill nav from the designs. The open tab grows into an orange capsule
 * with its name, so the icons are never the only clue to where you are.
 */
export function FloatingTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, tabBar.bottomGap) }]}>
      <CharcoalCard radius={tabBar.height / 2} style={styles.bar} contentStyle={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = icons[route.name] ?? HomeIcon;
          const { options } = descriptors[route.key];
          const title = options.title ?? route.name;
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : title;
          // Tapping the open tab again scrolls it to the top (TabScreen listens for this press).
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (focused || event.defaultPrevented) return;
            animateLayout(200);
            navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              role="tab"
              aria-selected={focused}
              aria-label={title}
              onPress={onPress}
              style={[styles.tab, focused && styles.tabActive]}>
              <Icon color={focused ? colors.ink : colors.textOnDarkSecondary} />
              {focused ? (
                <AppText variant="label" style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  {label}
                </AppText>
              ) : null}
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
    minWidth: tabBar.width,
    height: tabBar.height,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    minWidth: 48,
    height: 48,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.semibold,
  },
});
