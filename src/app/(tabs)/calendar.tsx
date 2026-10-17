import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { GlassCard } from '@/components/cards';
import { BackIcon, ChevronIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/screen-header';
import { SubscriptionRow } from '@/components/subscription-row';
import { TabScreen } from '@/components/tab-screen';
import { useToday } from '@/hooks/use-today';
import { formatMoney } from '@/features/subscriptions/billing';
import {
  MONTH_LIST_LIMIT,
  MONTHS_AHEAD,
  planMonth,
  shiftMonth,
  type Charge,
  type MonthPlan,
} from '@/features/subscriptions/calendar';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing } from '@/theme';
import { formatMonth, formatMonthYear, formatShortDate, monthCells, type LocalDate } from '@/utils/dates';

/** Renewals on a month grid: a dot per charge, the trial's last day in orange, today outlined. */
export default function CalendarScreen() {
  const subscriptions = useSubscriptions((s) => s.subscriptions);
  const today = useToday();
  // The month on screen, as a month count from today's. Kept as an absolute month so it stays put
  // when today rolls over, then clamped to the months the screen can show.
  const [picked, setPicked] = useState<number | null>(null);
  const current = monthIndex(today);
  const offset = Math.min(Math.max((picked ?? current) - current, 0), MONTHS_AHEAD);
  const { year, month } = shiftMonth(today, offset);
  const go = (delta: number) => setPicked(current + offset + delta);
  const plan = useMemo(() => planMonth(subscriptions, year, month, today), [subscriptions, year, month, today]);
  const sameYear = year === Number(today.slice(0, 4));
  const name = sameYear ? formatMonth(year, month) : formatMonthYear(year, month);

  return (
    <TabScreen>
      <ScreenHeader
        title={name}
        subtitle={summary(plan, name)}
        right={
          <View style={styles.arrows}>
            <MonthButton label="Previous month" disabled={offset === 0} onPress={() => go(-1)}>
              <BackIcon size={14} color={colors.ink} />
            </MonthButton>
            <MonthButton label="Next month" disabled={offset === MONTHS_AHEAD} onPress={() => go(1)}>
              <ChevronIcon color={colors.ink} />
            </MonthButton>
          </View>
        }
      />
      <MonthGrid plan={plan} today={today} name={name} />
      <MonthList plan={plan} name={name} empty={subscriptions.length === 0} />
    </TabScreen>
  );
}

/** Months since year 0, so two months can be compared and subtracted. */
function monthIndex(day: LocalDate): number {
  return Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7)) - 1;
}

/** "$67.47 still to pay this month" or "$74.46 due in November". */
function summary(plan: MonthPlan, name: string): string {
  if (plan.current) {
    return plan.dueCents ? `${formatMoney(plan.dueCents)} still to pay this month` : 'Nothing left to pay this month';
  }
  return plan.dueCents ? `${formatMoney(plan.dueCents)} due in ${name}` : `Nothing due in ${name}`;
}

function MonthButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={[styles.arrow, disabled && styles.disabled]}>
      {children}
    </Pressable>
  );
}

/** What a screen reader hears for a day: the date, then what charges. */
function describeDay(day: LocalDate, charges: Charge[], isToday: boolean): string {
  const parts = charges.map((c) =>
    c.trialEnding
      ? `${c.sub.name} trial ends, then ${formatMoney(c.sub.priceCents)}`
      : `${c.sub.name} ${formatMoney(c.sub.priceCents)}`,
  );
  return [isToday ? `Today, ${formatShortDate(day)}` : formatShortDate(day), ...parts].join(', ');
}

function MonthGrid({ plan, today, name }: { plan: MonthPlan; today: LocalDate; name: string }) {
  const cells = monthCells(plan.year, plan.month);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  // Weekday initials in the device locale, starting on Sunday to match getDay().
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2026, 1, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
  );
  return (
    <GlassCard contentStyle={styles.calendar}>
      {/* Each day's label already names its weekday. */}
      <View style={styles.week} aria-hidden importantForAccessibility="no-hide-descendants">
        {weekdays.map((d, i) => (
          <AppText key={i} variant="caption" maxFontSizeMultiplier={1.3} style={styles.weekday}>
            {d}
          </AppText>
        ))}
      </View>
      <View role="grid" aria-label={`${formatMonthYear(plan.year, plan.month)} renewals`}>
        {weeks.map((week, w) => (
          <View key={w} role="row" style={styles.week}>
            {week.map((day, i) => {
              if (!day) return <View key={`blank${i}`} style={styles.cell} />;
              const charges = plan.byDay.get(day) ?? [];
              const isToday = day === today;
              const past = day < today;
              const trial = charges.some((c) => c.trialEnding);
              const renews = charges.some((c) => !c.trialEnding);
              return (
                <View
                  key={day}
                  role="cell"
                  style={styles.cell}
                  accessible
                  aria-label={describeDay(day, charges, isToday)}>
                  <View style={[styles.day, trial && styles.trialDay, isToday && styles.today]}>
                    <AppText
                      variant="label"
                      maxFontSizeMultiplier={1.3}
                      style={[past && styles.pastText, (isToday || charges.length > 0) && styles.boldText]}>
                      {Number(day.slice(8))}
                    </AppText>
                  </View>
                  <View style={[styles.dot, renews && styles.dotOn]} />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

/** The month's next few charges under the grid. */
function MonthList({ plan, name, empty }: { plan: MonthPlan; name: string; empty: boolean }) {
  const rows = plan.charges.slice(0, MONTH_LIST_LIMIT);
  return (
    <GlassCard contentStyle={styles.list}>
      <AppText variant="section" style={styles.listTitle}>
        {plan.current ? 'Coming up' : `First in ${name}`}
      </AppText>
      {rows.map((c, i) => (
        <SubscriptionRow
          key={`${c.sub.id}:${c.on}`}
          sub={c.sub}
          date={formatShortDate(c.on)}
          trialEnding={c.trialEnding}
          divider={i > 0}
          compact
        />
      ))}
      {plan.charges.length > rows.length ? (
        <AppText variant="caption" muted style={styles.more}>
          {plan.current
            ? `${plan.charges.length - rows.length} more this month`
            : `${plan.charges.length - rows.length} more in ${name}`}
        </AppText>
      ) : null}
      {rows.length === 0 ? (
        empty ? (
          <Pressable role="link" onPress={() => router.push('/add')} style={styles.emptyRow}>
            <AppText variant="caption" muted>
              Add a subscription to see its renewals here.
            </AppText>
          </Pressable>
        ) : (
          <AppText variant="caption" muted style={styles.emptyRow}>
            {plan.current ? 'No more charges this month.' : `Nothing renews in ${name}.`}
          </AppText>
        )
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  arrows: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  calendar: {
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: spacing.lg,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    paddingBottom: 6,
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 44,
    alignItems: 'center',
    gap: 2,
  },
  day: {
    minWidth: 34,
    minHeight: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 2,
    borderColor: colors.ink,
  },
  trialDay: {
    backgroundColor: colors.accent,
  },
  pastText: {
    color: colors.textSecondary,
  },
  boldText: {
    fontFamily: fonts.bold,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOn: {
    backgroundColor: colors.ink,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listTitle: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  more: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingVertical: spacing.md,
  },
  emptyRow: {
    paddingVertical: spacing.md,
  },
});
