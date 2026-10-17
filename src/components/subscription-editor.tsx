import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { DatePicker } from '@/components/date-picker';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { PillButton } from '@/components/pill-button';
import { ServiceLogo } from '@/components/service-logo';
import { Toggle } from '@/components/toggle';
import { addCycles } from '@/features/subscriptions/billing';
import { draftProblem, type Draft } from '@/features/subscriptions/draft';
import type { BillingCycle } from '@/features/subscriptions/types';
import { colors, fonts, radii, spacing, type } from '@/theme';
import { useLock } from '@/stores/lock';
import type { LocalDate } from '@/utils/dates';

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

type Props = {
  /** The draft to edit; null hides the sheet. */
  draft: Draft | null;
  today: LocalDate;
  onSave: (draft: Draft) => void;
  onClose: () => void;
};

/** Bottom sheet for a subscription's price, how often it charges, trial, and next date. */
export function SubscriptionEditor({ draft, today, onSave, onClose }: Props) {
  // Modals draw above the Face ID lock, so they step aside while it is up; the draft is kept.
  const locked = useLock((s) => s.locked);
  return (
    <Modal visible={!!draft && !locked} transparent animationType="slide" onRequestClose={onClose}>
      {/* Keyed so each opening starts from the draft it was given. */}
      {draft ? <EditorSheet key={draft.key} initial={draft} today={today} onSave={onSave} onClose={onClose} /> : null}
    </Modal>
  );
}

function EditorSheet({ initial, today, onSave, onClose }: Omit<Props, 'draft'> & { initial: Draft }) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const custom = initial.serviceId === null;
  // Until the person picks a date, it follows the cycle: one week, month or year from today.
  const [datePicked, setDatePicked] = useState(!!initial.dateChosen);
  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setProblem(null);
  };
  const setCycle = (cycle: BillingCycle) =>
    update(datePicked || draft.trial ? { cycle } : { cycle, chargeOn: addCycles(today, cycle, 1) });
  const pickDate = (chargeOn: LocalDate) => {
    setDatePicked(true);
    update({ chargeOn });
  };

  const save = () => {
    const issue = draftProblem(draft);
    if (issue) setProblem(issue);
    else onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
      {/* Tapping outside closes too; hidden from screen readers, which use the Close button. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} aria-hidden accessible={false} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.header}>
          <ServiceLogo serviceId={draft.serviceId} name={draft.name} size={40} />
          {custom ? (
            <TextInput
              value={draft.name}
              onChangeText={(name) => update({ name })}
              placeholder="Name, like Gym"
              placeholderTextColor={colors.textSecondary}
              aria-label="Name"
              autoFocus={!draft.name}
              style={[styles.nameInput, type.headline]}
            />
          ) : (
            <AppText variant="headline" style={styles.title} numberOfLines={1}>
              {draft.name}
            </AppText>
          )}
          <Pressable role="button" aria-label="Close" onPress={onClose} style={styles.close} hitSlop={8}>
            <CloseIcon size={16} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AppText variant="section" style={styles.label}>
            Price
          </AppText>
          <View style={styles.priceField}>
            <AppText variant="bodyStrong" muted>
              $
            </AppText>
            <TextInput
              value={draft.priceText}
              onChangeText={(priceText) => update({ priceText, from: false })}
              keyboardType="decimal-pad"
              placeholder="9.99"
              placeholderTextColor={colors.textSecondary}
              aria-label="Price"
              style={[styles.priceInput, type.bodyStrong]}
            />
          </View>
          {draft.from ? (
            <AppText variant="caption" muted style={styles.hint}>
              This is the cheapest plan. Change it to what you pay.
            </AppText>
          ) : null}

          <AppText variant="section" style={styles.label}>
            How often
          </AppText>
          <View style={styles.chips} role="radiogroup" aria-label="How often">
            {CYCLES.map((c) => (
              <Chip
                key={c.value}
                onWhite
                label={c.label}
                selected={draft.cycle === c.value}
                onPress={() => setCycle(c.value)}
              />
            ))}
          </View>

          <Pressable
            role="switch"
            aria-checked={draft.trial}
            aria-label="Free trial"
            onPress={() => update({ trial: !draft.trial })}
            style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <AppText variant="section">Free trial</AppText>
              <AppText variant="caption" muted>
                We’ll remind you before the first charge.
              </AppText>
            </View>
            <Toggle on={draft.trial} />
          </Pressable>

          <AppText variant="section" style={styles.label}>
            {draft.trial ? 'Trial ends' : 'Next charge'}
          </AppText>
          <DatePicker value={draft.chargeOn} onChange={pickDate} min={today} today={today} />
        </ScrollView>

        {problem ? (
          <AppText variant="label" style={styles.problem} role="alert">
            {problem}
          </AppText>
        ) : null}
        <PillButton
          label="Save"
          tone="dark"
          icon={<CheckIcon size={14} color={colors.ink} />}
          onPress={save}
          style={styles.save}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.large,
    borderTopRightRadius: radii.large,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
  },
  nameInput: {
    flex: 1,
    color: colors.ink,
    padding: 0,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  priceField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    paddingHorizontal: 18,
  },
  priceInput: {
    flex: 1,
    color: colors.ink,
    padding: 0,
  },
  hint: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  toggleText: {
    flex: 1,
  },
  problem: {
    color: colors.danger,
    fontFamily: fonts.semibold,
    marginTop: spacing.sm,
  },
  save: {
    marginTop: spacing.md,
  },
});
