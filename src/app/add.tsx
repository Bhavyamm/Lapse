import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { GlassCard } from '@/components/cards';
import { FadeFooter } from '@/components/fade-footer';
import { ArrowRightIcon, BackIcon, CheckIcon, CloseIcon, PencilIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { PillButton } from '@/components/pill-button';
import { PressScale } from '@/components/press-scale';
import { ScreenBackground } from '@/components/screen-background';
import { ServiceLogo } from '@/components/service-logo';
import { SubscriptionEditor } from '@/components/subscription-editor';
import { CATALOG, normalize, searchCatalog, type CatalogService } from '@/features/catalog/catalog';
import { describePrice, formatMoney, monthlyCents, parsePrice } from '@/features/subscriptions/billing';
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
import { animateLayout } from '@/utils/motion';

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

  const picked = new Map(drafts.map((d) => [d.serviceId, d]));
  // Picked services stay in place, marked, so the list never jumps.
  const visible = useMemo(() => searchCatalog(query, 30), [query]);
  const [footerHeight, setFooterHeight] = useState(110);
  const typed = query.trim();
  const searching = normalize(query) !== '';

  const keyboardUp = useKeyboardUp();
  const toggle = (service: CatalogService) => {
    animateLayout();
    const draft = picked.get(service.id);
    const count = drafts.length + (draft ? -1 : 1);
    AccessibilityInfo.announceForAccessibility(`${service.name} ${draft ? 'removed' : 'picked'}. ${count} picked.`);
    if (draft) unselect(draft.key);
    else setDrafts((list) => [...list, draftFromService(service, today)]);
  };
  const unselect = (key: string) => {
    animateLayout();
    setDrafts((list) => list.filter((d) => d.key !== key));
  };
  const saveDraft = (draft: Draft) => {
    animateLayout();
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
          contentContainerStyle={[styles.list, { paddingBottom: footerHeight + spacing.md }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <AppText variant="section" style={styles.section}>
            {searching ? (visible.length ? 'Results' : `No match for “${typed}”`) : 'Popular'}
          </AppText>
          <GlassCard contentStyle={styles.card}>
            {visible.map((service, i) => {
              const draft = picked.get(service.id);
              const price = draft ? describeDraft(draft) : describePrice(service.price, service.cycle, service.from);
              const already = savedIds.has(service.id) ? 'already added, ' : '';
              return (
                <PressScale
                  key={service.id}
                  role="button"
                  aria-label={
                    draft ? `Remove ${service.name}, picked, ${price}` : `Add ${service.name}, ${already}${price}`
                  }
                  scale={0.98}
                  onPress={() => toggle(service)}
                  style={[styles.row, i > 0 && styles.divider]}>
                  <ServiceLogo serviceId={service.id} name={service.name} />
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {service.name}
                    </AppText>
                    <AppText variant="caption" muted>
                      {savedIds.has(service.id) ? 'Already added · ' : ''}
                      {price}
                    </AppText>
                  </View>
                  <View style={[styles.plus, draft && styles.pickedMark]}>
                    {draft ? <CheckIcon size={14} color={colors.ink} /> : <PlusIcon size={16} color={colors.ink} />}
                  </View>
                </PressScale>
              );
            })}
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

        <FadeFooter
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
          {/* Hidden while typing a search, so the results keep the room above the keyboard. */}
          {count && !keyboardUp ? <Picks drafts={drafts} onEdit={setEditing} onRemove={unselect} /> : null}
          <PillButton
            label={count > 1 ? `Add ${count} and remind me` : 'Add and remind me'}
            tone="dark"
            icon={<ArrowRightIcon color={colors.ink} />}
            onPress={save}
            disabled={count === 0}
          />
        </FadeFooter>
      </KeyboardAvoidingView>

      <SubscriptionEditor draft={editing} today={today} onSave={saveDraft} onClose={() => setEditing(null)} />
    </ScreenBackground>
  );
}

/** True while the on-screen keyboard is open. */
function useKeyboardUp(): boolean {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      animateLayout();
      setUp(true);
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      animateLayout();
      setUp(false);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return up;
}

/**
 * What's picked so far, in one row above the save button: a running monthly total and a chip
 * per pick to change or remove it. It scrolls sideways, so picking more never pushes the list.
 */
function Picks({
  drafts,
  onEdit,
  onRemove,
}: {
  drafts: Draft[];
  onEdit: (draft: Draft) => void;
  onRemove: (key: string) => void;
}) {
  // Free trials cost nothing until they charge, so they stay out of the total.
  const monthly = drafts
    .filter((d) => !d.trial)
    .reduce((sum, d) => sum + monthlyCents(parsePrice(d.priceText) ?? 0, d.cycle), 0);
  return (
    <View style={styles.picks}>
      <AppText variant="caption" onDark style={styles.picksTitle}>
        {drafts.length} picked · {formatMoney(monthly)} a month
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        keyboardShouldPersistTaps="handled">
        {drafts.map((draft) => (
          <View key={draft.key} style={styles.pick}>
            <Pressable
              role="button"
              aria-label={`Change ${draft.name}`}
              onPress={() => onEdit(draft)}
              style={styles.pickMain}>
              <ServiceLogo serviceId={draft.serviceId} name={draft.name} size={30} />
              <View>
                <AppText variant="label" style={styles.bold} numberOfLines={1}>
                  {draft.name}
                </AppText>
                <AppText variant="caption" style={styles.pickDetail} numberOfLines={1}>
                  {draft.trial
                    ? `Trial ends ${formatShortDate(draft.chargeOn)}`
                    : `${describeDraft(draft)} · ${formatShortDate(draft.chargeOn)}`}
                </AppText>
              </View>
            </Pressable>
            <Pressable
              role="button"
              aria-label={`Remove ${draft.name}`}
              onPress={() => onRemove(draft.key)}
              hitSlop={8}
              style={styles.pickRemove}>
              <CloseIcon size={10} color={colors.ink} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
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
  bold: {
    fontFamily: fonts.bold,
  },
  pickedMark: {
    backgroundColor: colors.accent,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  picks: {
    backgroundColor: colors.charcoal,
    borderRadius: radii.card,
    paddingTop: spacing.md,
    paddingBottom: 10,
    gap: 10,
  },
  picksTitle: {
    fontFamily: fonts.semibold,
    paddingHorizontal: spacing.lg,
  },
  chips: {
    paddingHorizontal: 10,
    gap: spacing.sm,
  },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingLeft: 6,
    paddingRight: 8,
    gap: 6,
  },
  pickMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
    maxWidth: 220,
  },
  pickDetail: {
    color: colors.ink,
  },
  pickRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.onAccentPanel,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
