import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { GlassCard } from '@/components/cards';
import { ArrowRightIcon, BackIcon, CheckIcon, PencilIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { PillButton } from '@/components/pill-button';
import { ScreenBackground } from '@/components/screen-background';
import { ServiceLogo } from '@/components/service-logo';
import { SubscriptionEditor } from '@/components/subscription-editor';
import { CATALOG, normalize, searchCatalog, type CatalogService } from '@/features/catalog/catalog';
import { describePrice } from '@/features/subscriptions/billing';
import {
  blankDraft,
  describeDraft,
  draftFromService,
  draftProblem,
  toNewSubscription,
  type Draft,
} from '@/features/subscriptions/draft';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing, type } from '@/theme';
import { formatShortDate, today as getToday } from '@/utils/dates';

/** Add from catalog: search, pick one or more services, adjust them, and save. */
export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const add = useSubscriptions((s) => s.add);
  const saved = useSubscriptions((s) => s.subscriptions);
  const savedIds = useMemo(() => new Set(saved.map((sub) => sub.serviceId)), [saved]);
  const [today] = useState(getToday);
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  // The draft open in the editor. A new custom one isn't in `drafts` until saved.
  const [editing, setEditing] = useState<Draft | null>(null);
  const saving = useRef(false);

  const selectedIds = new Set(drafts.map((d) => d.serviceId));
  // Ask for extra results so picked ones, which are hidden here, don't shorten the list.
  const results = useMemo(() => searchCatalog(query, 30 + drafts.length), [query, drafts.length]);
  const visible = results.filter((s) => !selectedIds.has(s.id)).slice(0, 30);
  const typed = query.trim();
  const searching = normalize(query) !== '';

  const select = (service: CatalogService) => setDrafts((list) => [...list, draftFromService(service, today)]);
  const unselect = (key: string) => setDrafts((list) => list.filter((d) => d.key !== key));
  const saveDraft = (draft: Draft) => {
    setDrafts((list) =>
      list.some((d) => d.key === draft.key) ? list.map((d) => (d.key === draft.key ? draft : d)) : [...list, draft],
    );
    setEditing(null);
    if (draft.serviceId === null) setQuery('');
  };

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const save = () => {
    if (saving.current || drafts.length === 0) return;
    // Catalog drafts always have a price; a broken one opens in the editor instead of saving.
    const broken = drafts.find((d) => draftProblem(d));
    if (broken) return setEditing(broken);
    saving.current = true;
    add(drafts.map(toNewSubscription));
    leave();
  };

  const count = drafts.length;
  return (
    <ScreenBackground style={{ paddingTop: insets.top + spacing.sm }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.top}>
          <View style={styles.topBar}>
            <Pressable role="button" aria-label="Back" onPress={leave} style={styles.back}>
              <BackIcon color={colors.ink} />
            </Pressable>
            <AppText variant="caption" muted style={styles.count}>
              {CATALOG.length} services
            </AppText>
          </View>
          <AppText variant="headline" style={styles.title}>
            Add a subscription
          </AppText>
          <View style={styles.search}>
            <SearchIcon color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Netflix, Notion, Duolingo…"
              placeholderTextColor={colors.textSecondary}
              aria-label="Search services"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={[styles.searchInput, type.body]}
            />
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.list, { paddingBottom: 110 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {drafts.map((draft) => (
            <SelectedCard
              key={draft.key}
              draft={draft}
              onUnselect={() => unselect(draft.key)}
              onEdit={() => setEditing(draft)}
            />
          ))}

          <AppText variant="section" style={styles.section}>
            {searching ? (visible.length ? 'Results' : `No match for “${typed}”`) : 'Popular'}
          </AppText>
          <GlassCard contentStyle={styles.card}>
            {visible.map((service, i) => (
              <Pressable
                key={service.id}
                role="button"
                aria-label={`Add ${service.name}, ${savedIds.has(service.id) ? 'already added, ' : ''}${describePrice(service.price, service.cycle, service.from)}`}
                onPress={() => select(service)}
                style={[styles.row, i > 0 && styles.divider]}>
                <ServiceLogo serviceId={service.id} name={service.name} />
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {service.name}
                  </AppText>
                  <AppText variant="caption" muted>
                    {savedIds.has(service.id) ? 'Already added · ' : ''}
                    {describePrice(service.price, service.cycle, service.from)}
                  </AppText>
                </View>
                <View style={styles.plus}>
                  <PlusIcon size={16} color={colors.ink} />
                </View>
              </Pressable>
            ))}
            <Pressable
              role="button"
              onPress={() => setEditing(blankDraft(typed, today))}
              style={[styles.own, visible.length > 0 && styles.divider]}>
              <PencilIcon color={colors.inkSoft} />
              <AppText variant="link" style={styles.ownText}>
                {typed ? `Add “${typed}” yourself` : 'Not listed? Add your own'}
              </AppText>
            </Pressable>
          </GlassCard>
        </ScrollView>

        <View style={[styles.cta, { bottom: insets.bottom + spacing.md }]}>
          <PillButton
            label={count > 1 ? `Add ${count} and remind me` : 'Add and remind me'}
            tone="dark"
            icon={<ArrowRightIcon color={colors.ink} />}
            onPress={save}
            disabled={count === 0}
          />
        </View>
      </KeyboardAvoidingView>

      <SubscriptionEditor draft={editing} today={today} onSave={saveDraft} onClose={() => setEditing(null)} />
    </ScreenBackground>
  );
}

function SelectedCard({ draft, onUnselect, onEdit }: { draft: Draft; onUnselect: () => void; onEdit: () => void }) {
  return (
    <View style={styles.selected}>
      <View style={styles.selectedTop}>
        <ServiceLogo serviceId={draft.serviceId} name={draft.name} />
        <View style={styles.rowText}>
          <AppText variant="bodyStrong" style={styles.bold} numberOfLines={1}>
            {draft.name}
          </AppText>
          <AppText variant="caption" style={styles.selectedDetail}>
            {describeDraft(draft)}
          </AppText>
        </View>
        <Pressable
          role="button"
          aria-label={`Remove ${draft.name}`}
          onPress={onUnselect}
          hitSlop={6}
          style={styles.check}>
          <CheckIcon size={16} color={colors.white} />
        </Pressable>
      </View>
      <Pressable
        role="button"
        aria-label={`Change ${draft.name}`}
        onPress={onEdit}
        style={({ pressed }) => [styles.dateRow, pressed && { opacity: 0.8 }]}>
        <AppText variant="label">
          {draft.trial ? 'Trial ends ' : 'Next charge '}
          <AppText variant="label" style={styles.bold}>
            {formatShortDate(draft.chargeOn)}
          </AppText>
        </AppText>
        <AppText variant="label" style={styles.change}>
          Change
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  top: {
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontFamily: fonts.medium,
  },
  title: {
    paddingHorizontal: 4,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    padding: 0,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    gap: spacing.md,
  },
  section: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 64,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rowText: {
    flex: 1,
  },
  plus: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  own: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 54,
  },
  ownText: {
    color: colors.inkSoft,
  },
  selected: {
    backgroundColor: colors.accent,
    borderRadius: radii.row,
    padding: 14,
    gap: spacing.md,
  },
  selectedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  selectedDetail: {
    color: colors.ink,
    fontFamily: fonts.medium,
  },
  check: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.onAccentPanel,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  change: {
    fontFamily: fonts.semibold,
    textDecorationLine: 'underline',
  },
  cta: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
});
