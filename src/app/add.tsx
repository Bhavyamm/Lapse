import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
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
import { FREE_LIMIT, openLimit, roomLeft } from '@/features/pro/limit';
import { usePro } from '@/features/pro/purchase';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing, type } from '@/theme';
import { today as getToday } from '@/utils/dates';
import { selection, success } from '@/utils/haptics';
import { animateLayout } from '@/utils/motion';
import { confirm } from '@/utils/notify';

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
  // The free plan tracks FREE_LIMIT subscriptions; picking past that opens Pro instead.
  const isPro = usePro((s) => s.isPro);
  const room = roomLeft(saved.length, isPro);
  const full = drafts.length >= room;
  const blocked = () => {
    AccessibilityInfo.announceForAccessibility(`The free plan tracks ${FREE_LIMIT} subscriptions.`);
    openLimit();
  };

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
    if (!draft && full) return blocked();
    const count = drafts.length + (draft ? -1 : 1);
    AccessibilityInfo.announceForAccessibility(`${service.name} ${draft ? 'removed' : 'picked'}. ${count} picked.`);
    selection();
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
    if (drafts.length > room) return blocked();
    const broken = drafts.find((d) => draftProblem(d));
    if (broken) return setEditing(broken);
    saving.current = true;
    add(drafts.map(toNewSubscription));
    success();
    leave();
  };

  // Picks aren't saved until the button below, so leaving with some asks first.
  const asking = useRef(false);
  const discarding = useRef(false);
  const discardPicks = async (): Promise<boolean> => {
    if (asking.current) return false;
    asking.current = true;
    const n = drafts.length;
    const yes = await confirm(
      n > 1 ? `Discard ${n} picks?` : 'Discard your pick?',
      'They haven’t been added yet.',
      'Discard',
      { cancel: 'Keep editing', destructive: true },
    );
    asking.current = false;
    return yes;
  };
  const goBack = async () => {
    if (drafts.length > 0 && !(await discardPicks())) return;
    discarding.current = true;
    leave();
  };
  // The iOS edge swipe and Android's back button go through the same question.
  const navigation = useNavigation();
  usePreventRemove(drafts.length > 0, ({ data }) => {
    if (saving.current || discarding.current) return navigation.dispatch(data.action);
    void discardPicks().then((yes) => {
      if (!yes) return;
      discarding.current = true;
      navigation.dispatch(data.action);
    });
  });

  const count = drafts.length;
  return (
    <ScreenBackground style={{ paddingTop: insets.top + spacing.sm }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.top}>
          <View style={styles.topBar}>
            <Pressable role="button" aria-label="Back" onPress={goBack} style={styles.back}>
              <BackIcon color={colors.ink} />
            </Pressable>
            <AppText variant="caption" style={styles.count}>
              {CATALOG.length} services
            </AppText>
          </View>
          <AppText variant="headline" style={styles.title}>
            Add a subscription
          </AppText>
          {isPro ? null : <FreePlan left={Math.max(room - drafts.length, 0)} />}
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
              // Already tracked: shown so the list doesn't change shape, but it can't be picked again.
              if (savedIds.has(service.id))
                return (
                  <View
                    key={service.id}
                    accessible
                    aria-disabled
                    aria-label={`${service.name}, already added`}
                    style={[styles.row, i > 0 && styles.divider]}>
                    <View style={styles.addedLogo}>
                      <ServiceLogo serviceId={service.id} name={service.name} />
                    </View>
                    <View style={styles.rowText}>
                      <AppText variant="bodyStrong" numberOfLines={1}>
                        {service.name}
                      </AppText>
                      <AppText variant="caption" muted>
                        Already in your list
                      </AppText>
                    </View>
                    <View style={styles.added}>
                      <CheckIcon size={12} color={colors.textSecondary} />
                      <AppText variant="caption" muted style={styles.addedText}>
                        Added
                      </AppText>
                    </View>
                  </View>
                );
              return (
                <PressScale
                  key={service.id}
                  role="button"
                  aria-label={draft ? `Remove ${service.name}, picked, ${price}` : `Add ${service.name}, ${price}`}
                  scale={0.98}
                  onPress={() => toggle(service)}
                  style={[styles.row, i > 0 && styles.divider]}>
                  <ServiceLogo serviceId={service.id} name={service.name} />
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {service.name}
                    </AppText>
                    <AppText variant="caption" muted>
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
              onPress={() => (full ? blocked() : setEditing(blankDraft(typed, today)))}
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

/** How many the free plan has room for, and the way to more. */
function FreePlan({ left }: { left: number }) {
  return (
    <Pressable role="button" onPress={openLimit} style={styles.freePlan}>
      <AppText variant="caption" style={styles.freePlanText}>
        {left === 0
          ? 'Free plan: no spots left.'
          : `Free plan: ${left} of ${FREE_LIMIT} spot${left === 1 ? '' : 's'} left.`}{' '}
        <AppText variant="caption" style={styles.freePlanLink}>
          Track more with Pro
        </AppText>
      </AppText>
    </Pressable>
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
 * What's picked so far, above the save button: a running monthly total and a logo per pick. Tap
 * a logo to change that pick, or its × to remove it. Logos wrap, so a dozen picks fit in two rows.
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
      <View style={styles.picksHead}>
        <AppText variant="caption" onDark style={styles.picksTitle}>
          {drafts.length} picked · {formatMoney(monthly)} a month
        </AppText>
        <AppText variant="caption" onDark muted>
          Tap to change
        </AppText>
      </View>
      <ScrollView style={styles.chipsBox} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
        {drafts.map((draft) => (
          <View key={draft.key} style={styles.pick}>
            <PressScale
              role="button"
              aria-label={`Change ${draft.name}, ${describeDraft(draft)}`}
              onPress={() => onEdit(draft)}
              style={styles.pickMain}>
              <ServiceLogo serviceId={draft.serviceId} name={draft.name} size={44} />
            </PressScale>
            <Pressable
              role="button"
              aria-label={`Remove ${draft.name}`}
              onPress={() => onRemove(draft.key)}
              hitSlop={4}
              style={styles.pickRemove}>
              <CloseIcon size={8} color={colors.white} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// A picked logo plus room for its × badge.
const PICK = 50;
const PICK_GAP = 8;

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
  freePlan: {
    paddingHorizontal: 4,
    marginTop: -6,
    minHeight: 32,
    justifyContent: 'center',
  },
  freePlanText: {
    color: colors.inkSoft,
  },
  freePlanLink: {
    fontFamily: fonts.semibold,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingVertical: 12,
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
    minHeight: 64,
    paddingVertical: 10,
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
    minHeight: 54,
    paddingVertical: 10,
  },
  ownText: {
    color: colors.inkSoft,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  addedLogo: {
    opacity: 0.5,
  },
  added: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
  },
  addedText: {
    fontFamily: fonts.semibold,
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
  picksHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.lg,
  },
  picksTitle: {
    fontFamily: fonts.semibold,
  },
  chipsBox: {
    // Two rows of logos, then they scroll.
    maxHeight: 6 + 2 * PICK + PICK_GAP,
    flexGrow: 0,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: 6,
    gap: PICK_GAP,
  },
  pick: {
    width: PICK,
    height: PICK,
    justifyContent: 'flex-end',
  },
  pickMain: {
    width: 44,
    height: 44,
  },
  pickRemove: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
