import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ChevronIcon } from '@/components/icons';
import { Toggle } from '@/components/toggle';
import { colors, radii, spacing } from '@/theme';

type Props = {
  icon: ReactNode;
  label: string;
  /** Current value on the right, such as "1 day before". */
  detail?: string;
  /** Something other than text on the right, such as a PRO tag. */
  badge?: ReactNode;
  /** Makes the row a switch. */
  toggle?: { on: boolean; onChange: (on: boolean) => void; disabled?: boolean };
  /** Makes the row a button with a chevron. Without it or `toggle` the row only shows a value. */
  onPress?: () => void;
  /** Draws the divider above; off for the first row of a card. */
  divider?: boolean;
};

/** One line of a settings card: icon tile, label, value, then a chevron or a switch. */
export function SettingsRow({ icon, label, detail, badge, toggle, onPress, divider = true }: Props) {
  const body = (
    <>
      <View style={styles.icon}>{icon}</View>
      <AppText variant="link" style={styles.label}>
        {label}
      </AppText>
      {detail ? (
        <AppText variant="label" muted>
          {detail}
        </AppText>
      ) : null}
      {badge}
      {toggle ? <Toggle on={toggle.on} disabled={toggle.disabled} /> : null}
      {onPress && !toggle ? <ChevronIcon color={colors.textSecondary} /> : null}
    </>
  );
  const style = [styles.row, divider && styles.divider];

  if (toggle) {
    return (
      <Pressable
        role="switch"
        aria-checked={toggle.on}
        aria-disabled={toggle.disabled}
        aria-label={label}
        disabled={toggle.disabled}
        onPress={() => toggle.onChange(!toggle.on)}
        style={style}>
        {body}
      </Pressable>
    );
  }
  if (onPress) {
    return (
      <Pressable role="button" aria-label={detail ? `${label}, ${detail}` : label} onPress={onPress} style={style}>
        {body}
      </Pressable>
    );
  }
  return (
    <View style={style} accessible aria-label={detail ? `${label}, ${detail}` : label}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 54,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radii.icon - 2,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});
