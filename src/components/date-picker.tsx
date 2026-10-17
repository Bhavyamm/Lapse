import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BackIcon, ChevronIcon } from '@/components/icons';
import { colors, fonts, radii } from '@/theme';
import { formatMonthYear, formatShortDate, fromLocalDate, toLocalDate, type LocalDate } from '@/utils/dates';

type Props = {
  value: LocalDate;
  onChange: (value: LocalDate) => void;
  /** Days before this can't be picked. */
  min?: LocalDate;
  today: LocalDate;
};

/** Month grid date picker. Pure JS, so it works the same in Expo Go, on Android and on web. */
export function DatePicker({ value, onChange, min, today }: Props) {
  const selected = fromLocalDate(value);
  const [month, setMonth] = useState({ year: selected.getFullYear(), month: selected.getMonth() });

  const first = new Date(month.year, month.month, 1);
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const cells: (LocalDate | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toLocalDate(new Date(month.year, month.month, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);

  const shift = (delta: number) => {
    const d = new Date(month.year, month.month + delta, 1);
    setMonth({ year: d.getFullYear(), month: d.getMonth() });
  };
  const canGoBack = !min || toLocalDate(new Date(month.year, month.month, 0)) >= min;
  // Weekday initials in the device locale, starting on Sunday to match getDay().
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2026, 1, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
  );

  return (
    <View>
      <View style={styles.header}>
        <AppText variant="bodyStrong">{formatMonthYear(month.year, month.month)}</AppText>
        <View style={styles.arrows}>
          <Pressable
            role="button"
            aria-label="Previous month"
            aria-disabled={!canGoBack}
            disabled={!canGoBack}
            onPress={() => shift(-1)}
            style={[styles.arrow, !canGoBack && styles.disabled]}>
            <BackIcon size={14} color={colors.ink} />
          </Pressable>
          <Pressable role="button" aria-label="Next month" onPress={() => shift(1)} style={styles.arrow}>
            <ChevronIcon color={colors.ink} />
          </Pressable>
        </View>
      </View>
      <View style={styles.row}>
        {weekdays.map((d, i) => (
          <AppText key={i} variant="caption" muted style={styles.weekday}>
            {d}
          </AppText>
        ))}
      </View>
      <View style={styles.grid} role="radiogroup" aria-label={formatMonthYear(month.year, month.month)}>
        {cells.map((day, i) => {
          if (!day) return <View key={`blank${i}`} style={styles.cell} />;
          const isSelected = day === value;
          const isToday = day === today;
          const blocked = !!min && day < min;
          return (
            <Pressable
              key={day}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={blocked}
              aria-label={formatShortDate(day)}
              disabled={blocked}
              onPress={() => onChange(day)}
              style={styles.cell}>
              <View style={[styles.day, isToday && styles.today, isSelected && styles.selected]}>
                <AppText
                  variant="label"
                  style={[
                    styles.dayText,
                    blocked && { color: colors.hairline },
                    isSelected && { color: colors.ink, fontFamily: fonts.bold },
                  ]}>
                  {Number(day.slice(8))}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  arrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  selected: {
    backgroundColor: colors.accent,
    borderWidth: 0,
  },
  dayText: {
    color: colors.ink,
  },
});
