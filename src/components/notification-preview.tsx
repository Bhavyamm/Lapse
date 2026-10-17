import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/components/app-text';
import { brand, colors, fonts } from '@/theme';

type Props = {
  time: string;
  message: string;
  style?: StyleProp<ViewStyle>;
};

/** A sample lock-screen notification from lapse, used to show what reminders look like. */
export function NotificationPreview({ time, message, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={[brand.orangeHighlight, brand.orange, brand.orangeDeep]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.icon}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Rect x={3} y={6.5} width={18} height={11.5} rx={3} fill={colors.ink} />
          <Rect x={3} y={9} width={18} height={2.2} fill={brand.peach} />
          <Path d="M14 3.5L10 21" stroke={colors.accent} strokeWidth={2.2} />
        </Svg>
      </LinearGradient>
      <View style={styles.text}>
        <View style={styles.header}>
          <AppText variant="caption" style={styles.app}>
            lapse
          </AppText>
          <AppText variant="caption" style={styles.time}>
            {time}
          </AppText>
        </View>
        <AppText variant="caption" style={styles.message}>
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.notificationSurface,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    boxShadow: '0 10px 26px rgba(0,0,0,0.3)',
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  app: {
    fontFamily: fonts.bold,
  },
  time: {
    color: colors.textSecondary,
  },
  message: {
    color: colors.inkSoft,
    marginTop: 1,
  },
});
