import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CharcoalCard } from '@/components/cards';
import { PlusIcon } from '@/components/icons';
import { Mascot } from '@/components/mascot';
import { PillButton } from '@/components/pill-button';
import { ScreenHeader } from '@/components/screen-header';
import { TabScreen } from '@/components/tab-screen';
import { colors, radii, spacing } from '@/theme';
import { formatToday } from '@/utils/dates';

/** Home, empty state. The list of subscriptions arrives with the database. */
export default function HomeScreen() {
  return (
    <TabScreen>
      <ScreenHeader eyebrow={formatToday()} title="Your subscriptions" />
      <CharcoalCard radius={radii.large} contentStyle={styles.card}>
        <View>
          <View style={styles.bubbleAnchor}>
            <View style={styles.bubble}>
              <AppText variant="label" style={styles.bubbleText}>
                Nothing here yet!
              </AppText>
            </View>
          </View>
          <Mascot size={200} />
        </View>
        <AppText variant="headline" onDark style={styles.center}>
          What do you pay for?
        </AppText>
        <AppText onDark muted style={[styles.center, styles.lede]}>
          Add one subscription and we’ll remind you before it charges.
        </AppText>
        <PillButton
          label="Add your first one"
          icon={<PlusIcon color={colors.white} size={18} />}
          onPress={() => router.push('/add')}
          style={styles.cta}
        />
      </CharcoalCard>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  bubbleAnchor: {
    position: 'absolute',
    left: 128,
    top: -22,
    width: 200,
    zIndex: 1,
  },
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 13,
    boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
  },
  bubbleText: {
    fontFamily: 'BricolageGrotesque_600SemiBold',
  },
  center: {
    textAlign: 'center',
  },
  lede: {
    marginTop: 10,
    maxWidth: 280,
  },
  cta: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
});
