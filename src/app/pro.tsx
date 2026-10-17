import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components/app-text';
import { ArrowRightIcon, CloseIcon, DocumentIcon, LockIcon, MailIcon, PeopleIcon } from '@/components/icons';
import { PressScale } from '@/components/press-scale';
import { useToday } from '@/hooks/use-today';
import { purchasePro, PRO_PRICE, restorePro, type PurchaseResult } from '@/features/pro/purchase';
import { formatMoney } from '@/features/subscriptions/billing';
import { buildOverview } from '@/features/subscriptions/overview';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing } from '@/theme';
import { notify } from '@/utils/notify';

const FEATURES = [
  { title: 'Statement import', detail: 'CSV or PDF', Icon: DocumentIcon },
  { title: 'Inbox scan', detail: 'Finds every trial', Icon: MailIcon },
  { title: 'Family sharing', detail: 'One shared list', Icon: PeopleIcon },
  { title: 'Stays on device', detail: 'Nothing uploaded', Icon: LockIcon },
];

let leaving = false;
/** Closes Pro once, even after a double tap or a purchase finishing as it closes. */
function leave() {
  if (leaving) return;
  leaving = true;
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function explain(result: PurchaseResult, restoring: boolean) {
  if (result === 'unlocked') {
    notify('Pro is unlocked', 'Thanks for supporting lapse.');
    leave();
  } else if (result === 'unavailable') {
    notify(
      restoring ? 'Nothing to restore yet' : 'Pro isn’t on sale yet',
      `Pro opens for ${PRO_PRICE} once lapse is in the App Store and Google Play.`,
    );
  }
}

/** The one-time Pro unlock: what it adds and the button to buy it. */
export default function ProScreen() {
  const insets = useSafeAreaInsets();
  const today = useToday();
  const subscriptions = useSubscriptions((s) => s.subscriptions);
  const yearly = useMemo(() => buildOverview(subscriptions, today).yearlyCents, [subscriptions, today]);
  const busy = useRef(false);
  useEffect(() => {
    leaving = false;
  }, []);

  const run = async (restoring: boolean) => {
    if (busy.current) return;
    busy.current = true;
    try {
      explain(await (restoring ? restorePro() : purchasePro()), restoring);
    } catch {
      notify('Something went wrong', 'The store didn’t answer. Try again in a moment.');
    } finally {
      busy.current = false;
    }
  };

  // Whole dollars like Home's "$894 a year", unless that would round a small total away.
  const tracked =
    yearly >= 100 ? formatMoney(Math.round(yearly / 100) * 100).replace(/\.00$/, '') : formatMoney(yearly);
  const lede = yearly
    ? `You’re tracking ${tracked} a year. Pro pays for itself the first time it catches a forgotten charge.`
    : 'Pro pays for itself the first time it catches a forgotten charge.';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Glows />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 24 },
        ]}
        style={styles.flex}>
        <View style={styles.top}>
          <View style={styles.tag}>
            <AppText variant="caption" style={styles.tagText}>
              PRO
            </AppText>
          </View>
          <Pressable role="button" aria-label="Close" onPress={leave} hitSlop={6} style={styles.close}>
            <CloseIcon size={16} color={colors.white} />
          </Pressable>
        </View>

        <AppText variant="wordmark" onDark role="heading" style={styles.title}>
          Pay{' '}
          <AppText variant="wordmark" style={styles.accent}>
            once.
          </AppText>
          {'\n'}Keep it forever.
        </AppText>
        <AppText variant="body" onDark muted>
          {lede}
        </AppText>

        <View style={styles.grid}>
          {FEATURES.map(({ title, detail, Icon }) => (
            <Feature key={title} title={title} detail={detail} icon={<Icon size={26} color={colors.accent} />} />
          ))}
        </View>
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <PressScale
          role="button"
          aria-label={`Unlock Pro · ${PRO_PRICE}. One-time. No renewal, ever.`}
          onPress={() => run(false)}
          style={[styles.buy]}>
          <View>
            <AppText variant="button" style={styles.buyText}>
              Unlock Pro · {PRO_PRICE}
            </AppText>
            <AppText variant="caption" style={styles.buyNote}>
              One-time. No renewal, ever.
            </AppText>
          </View>
          <View style={styles.buyArrow}>
            <ArrowRightIcon color={colors.white} />
          </View>
        </PressScale>
        <Pressable role="button" onPress={() => run(true)} hitSlop={12} style={styles.restore}>
          <AppText variant="caption" onDark muted>
            Restore purchase
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function Feature({ title, detail, icon }: { title: string; detail: string; icon: ReactNode }) {
  return (
    <View style={styles.feature} accessible aria-label={`${title}, ${detail}`}>
      {icon}
      <View>
        <AppText variant="section" onDark>
          {title}
        </AppText>
        <AppText variant="caption" onDark muted>
          {detail}
        </AppText>
      </View>
    </View>
  );
}

/** Orange glows on the dark screen: top right, middle left, bottom right. */
function Glows() {
  const id = useId().replace(/:/g, '');
  const glows = [
    { key: 'a', cx: '100%', cy: '0%', rx: '50%', ry: '30%', opacity: 0.85 },
    { key: 'b', cx: '0%', cy: '55%', rx: '45%', ry: '26%', opacity: 0.5 },
    { key: 'c', cx: '100%', cy: '100%', rx: '50%', ry: '28%', opacity: 0.4 },
  ];
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        {glows.map((g) => (
          <RadialGradient key={g.key} id={`${id}${g.key}`} cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry}>
            <Stop offset="0" stopColor={colors.accent} stopOpacity={g.opacity} />
            <Stop offset="0.72" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {glows.map((g) => (
        <Rect key={g.key} width="100%" height="100%" fill={`url(#${id}${g.key})`} />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 20,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  tagText: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.onDarkButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 2,
  },
  accent: {
    color: colors.accent,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  feature: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 128,
    borderRadius: 26,
    padding: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.onDarkPanel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.onDarkButton,
  },
  flex: {
    flex: 1,
  },
  bottom: {
    paddingTop: 14,
    paddingHorizontal: 20,
    gap: 6,
  },
  buy: {
    minHeight: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 26,
    paddingRight: 8,
  },
  buyText: {
    color: colors.ink,
  },
  buyNote: {
    color: colors.ink,
    fontFamily: fonts.semibold,
  },
  buyArrow: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restore: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
});
