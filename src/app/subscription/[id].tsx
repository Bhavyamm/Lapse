import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/app-text';
import { BigAmount } from '@/components/big-amount';
import { CharcoalCard, GlassCard } from '@/components/cards';
import { ArrowUpRightIcon, BackIcon, PencilIcon } from '@/components/icons';
import { ScreenBackground } from '@/components/screen-background';
import { luminance, ServiceLogo } from '@/components/service-logo';
import { SubscriptionEditor } from '@/components/subscription-editor';
import { Toggle } from '@/components/toggle';
import { useToday } from '@/hooks/use-today';
import { findService, logoFor } from '@/features/catalog/catalog';
import { formatMoney, monthlyCents, nextChargeDate, yearlyCents } from '@/features/subscriptions/billing';
import { cancelGuide, storeName } from '@/features/subscriptions/cancel';
import { draftFromSubscription, toNewSubscription, type Draft } from '@/features/subscriptions/draft';
import type { BillingCycle, Subscription } from '@/features/subscriptions/types';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing } from '@/theme';
import { formatMonthDay, formatShortDate, fromLocalDate, toLocalDate, type LocalDate } from '@/utils/dates';
import { openLink } from '@/utils/links';
import { confirm } from '@/utils/notify';

const CYCLE_WORD: Record<BillingCycle, string> = { week: 'a week', month: 'a month', year: 'a year' };
const CYCLE_LABEL: Record<BillingCycle, string> = { week: 'Weekly', month: 'Monthly', year: 'Yearly' };

/** One subscription: what it costs, when it renews, and how to cancel it. */
export default function SubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sub = useSubscriptions((s) => s.subscriptions.find((x) => x.id === id));
  // Keep showing the last version while the screen slides away after "I already cancelled".
  const [kept, setKept] = useState(sub);
  if (sub && sub !== kept) setKept(sub);
  const shown = sub ?? kept;
  return shown ? <Detail sub={shown} /> : <Missing />;
}

const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

function BackButton({ onDark }: { onDark?: boolean }) {
  return (
    <Pressable
      role="button"
      aria-label="Back"
      onPress={leave}
      hitSlop={6}
      style={[styles.back, onDark ? styles.backOnDark : styles.backOnLight]}>
      <BackIcon color={onDark ? colors.white : colors.ink} />
    </Pressable>
  );
}

function Missing() {
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground style={[styles.missing, { paddingTop: insets.top + spacing.sm }]}>
      <BackButton />
      <AppText variant="headline" role="heading">
        Not tracked any more
      </AppText>
      <AppText muted>This subscription was cancelled or removed.</AppText>
    </ScreenBackground>
  );
}

function Detail({ sub }: { sub: Subscription }) {
  const insets = useSafeAreaInsets();
  const today = useToday();
  const update = useSubscriptions((s) => s.update);
  const cancel = useSubscriptions((s) => s.cancel);
  const [editing, setEditing] = useState<Draft | null>(null);
  // Room under the content for the pinned buttons, which grow with larger text.
  const [actionsHeight, setActionsHeight] = useState(130);
  const confirming = useRef(false);

  const next = nextChargeDate(sub, today);
  const trialEnding = sub.trial && next === sub.chargeOn;
  const until = formatShortDate(next);
  const guide = cancelGuide(sub, until, Platform.OS, trialEnding);
  const remind = sub.remind !== false;

  const markCancelled = async () => {
    if (confirming.current) return;
    confirming.current = true;
    const yes = await confirm(
      `Mark ${sub.name} as cancelled?`,
      'It leaves your list, and what you save starts counting on Profile.',
      'Mark cancelled',
    );
    confirming.current = false;
    if (!yes) return;
    leave();
    cancel(sub.id, today);
  };

  const saveEdit = (draft: Draft) => {
    update(sub.id, toNewSubscription(draft));
    setEditing(null);
  };

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + actionsHeight + spacing.xl }]}
        showsVerticalScrollIndicator={false}>
        <Hero
          sub={sub}
          pill={`${trialEnding ? 'Trial ends' : 'Renews'} ${until}`}
          suffix={trialEnding ? `${CYCLE_WORD[sub.cycle]} from ${weekday(next)}` : CYCLE_WORD[sub.cycle]}
          topInset={insets.top}
        />

        <GlassCard radius={radii.hero} contentStyle={styles.guide}>
          <View style={styles.guideTitle}>
            <AppText variant="title">How to cancel</AppText>
            <AppText variant="caption" muted>
              {guide.time}
            </AppText>
          </View>
          {guide.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNumber, i === 0 && styles.stepNumberFirst]} aria-hidden>
                <AppText variant="caption" style={styles.bold}>
                  {i + 1}
                </AppText>
              </View>
              <AppText variant="lede" style={styles.stepText} aria-label={`Step ${i + 1}: ${step}`}>
                {step}
              </AppText>
            </View>
          ))}
          {guide.storeUrl ? (
            <Pressable role="link" onPress={() => openLink(guide.storeUrl!)} style={styles.storeLink}>
              <AppText variant="label" muted>
                Bought it in an app?{' '}
                <AppText variant="label" style={styles.link}>
                  Open {storeName(Platform.OS)} subscriptions
                </AppText>
              </AppText>
            </Pressable>
          ) : null}
        </GlassCard>

        <View style={styles.tiles}>
          <Pressable
            role="switch"
            aria-checked={remind}
            aria-label="Renewal alert"
            onPress={() => update(sub.id, { remind: !remind })}
            style={styles.tilePress}>
            <GlassCard radius={radii.row} contentStyle={styles.tile}>
              <AppText variant="label" style={styles.tileLabel}>
                Renewal alert
              </AppText>
              <Toggle on={remind} />
            </GlassCard>
          </Pressable>
          <Pressable
            role="button"
            aria-label={`Edit details for ${sub.name}`}
            onPress={() => setEditing(draftFromSubscription(sub, today))}
            style={styles.tilePress}>
            <GlassCard radius={radii.row} contentStyle={styles.tile}>
              <AppText variant="label" style={styles.tileLabel}>
                Edit details
              </AppText>
              <PencilIcon color={colors.ink} />
            </GlassCard>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[styles.actions, { bottom: insets.bottom + spacing.md }]}
        onLayout={(e) => setActionsHeight(e.nativeEvent.layout.height)}>
        <Pressable
          role="link"
          onPress={() => openLink(guide.url)}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.9 }]}>
          <AppText variant="button" onDark style={styles.primaryText} numberOfLines={1}>
            {guide.action}
          </AppText>
          <View style={styles.primaryIcon}>
            <ArrowUpRightIcon color={colors.ink} />
          </View>
        </Pressable>
        <Pressable role="button" onPress={markCancelled} style={styles.secondary}>
          <AppText variant="link" style={styles.secondaryText}>
            I already cancelled
          </AppText>
        </Pressable>
      </View>

      <SubscriptionEditor draft={editing} today={today} onSave={saveEdit} onClose={() => setEditing(null)} />
    </ScreenBackground>
  );
}

/** The brand color, unless it is too dark to show on charcoal; then the logo's own glyph color. */
function watermarkColor(brand: string, glyph?: string): string {
  return luminance(brand) > 0.04 ? brand : (glyph ?? colors.white);
}

/** "Sat". */
function weekday(date: LocalDate): string {
  return fromLocalDate(date).toLocaleDateString(undefined, { weekday: 'short' });
}

/** "Oct 1", or "Oct 2025" for an earlier year. */
function trackedSince(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.getFullYear() === new Date().getFullYear()
    ? formatMonthDay(toLocalDate(date))
    : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/** The charcoal top: brand watermark, back, renewal date, name, price and three facts. */
function Hero({ sub, pill, suffix, topInset }: { sub: Subscription; pill: string; suffix: string; topInset: number }) {
  const service = findService(sub.serviceId);
  const logo = service ? logoFor(service) : undefined;
  const yearly = sub.cycle === 'year';
  const facts = [
    yearly
      ? { label: 'Per month', value: formatMoney(monthlyCents(sub.priceCents, sub.cycle)) }
      : { label: 'Per year', value: formatMoney(yearlyCents(sub.priceCents, sub.cycle)) },
    { label: 'Billed', value: CYCLE_LABEL[sub.cycle] },
    { label: 'Tracked since', value: trackedSince(sub.createdAt) },
  ];
  return (
    <CharcoalCard
      radius={radii.large}
      style={styles.hero}
      contentStyle={[styles.heroContent, { paddingTop: topInset + radii.large + spacing.sm }]}>
      {logo ? (
        <View style={styles.watermarkClip} pointerEvents="none" aria-hidden>
          <Svg width={260} height={260} viewBox="0 0 24 24" style={styles.watermark}>
            <Path d={logo.path} fill={watermarkColor(logo.hex, service?.glyph)} />
          </Svg>
        </View>
      ) : null}
      <View style={styles.heroTop}>
        <BackButton onDark />
        <View style={styles.pill}>
          <AppText variant="caption" onDark style={styles.bold}>
            {pill}
          </AppText>
        </View>
      </View>
      <View style={styles.nameRow}>
        <ServiceLogo serviceId={sub.serviceId} name={sub.name} size={36} />
        <AppText variant="title" onDark style={styles.name} numberOfLines={2} role="heading">
          {sub.name}
        </AppText>
      </View>
      <BigAmount cents={sub.priceCents} suffix={suffix} />
      <View style={styles.facts}>
        {facts.map((fact) => (
          <View key={fact.label} style={styles.fact} accessible aria-label={`${fact.label}: ${fact.value}`}>
            <AppText variant="caption" onDark muted>
              {fact.label}
            </AppText>
            <AppText variant="bodyStrong" onDark numberOfLines={1}>
              {fact.value}
            </AppText>
          </View>
        ))}
      </View>
    </CharcoalCard>
  );
}

const styles = StyleSheet.create({
  missing: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  hero: {
    marginTop: -radii.large,
    marginHorizontal: -spacing.sm,
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingBottom: 26,
    gap: 22,
  },
  watermarkClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.large,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -60,
    top: 40 + radii.large,
    opacity: 0.16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backOnDark: {
    backgroundColor: colors.onDarkButton,
  },
  backOnLight: {
    backgroundColor: colors.white,
  },
  pill: {
    backgroundColor: colors.onDarkButton,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: -12,
  },
  name: {
    flexShrink: 1,
  },
  facts: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fact: {
    flex: 1,
    backgroundColor: colors.onDarkPanel,
    borderRadius: 18,
    padding: spacing.md,
    gap: 2,
  },
  guide: {
    padding: 20,
    gap: spacing.lg,
  },
  guideTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  step: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberFirst: {
    backgroundColor: colors.accent,
  },
  stepText: {
    flex: 1,
    paddingTop: 3,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  storeLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
  link: {
    fontFamily: fonts.semibold,
    textDecorationLine: 'underline',
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
  },
  tilePress: {
    flex: 1,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  tileLabel: {
    fontFamily: fonts.semibold,
    flexShrink: 1,
  },
  actions: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    gap: 6,
  },
  primary: {
    minHeight: 62,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 26,
    paddingRight: spacing.sm,
    gap: spacing.md,
  },
  primaryText: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
  },
  primaryIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.inkSoft,
  },
});
