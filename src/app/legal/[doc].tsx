import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { GlassCard } from '@/components/cards';
import { CloseIcon } from '@/components/icons';
import { ScreenBackground } from '@/components/screen-background';
import { LEGAL_DOCS, type LegalDocId } from '@/features/legal/documents';
import { colors, fonts, radii, spacing } from '@/theme';

/** The Privacy Policy or the Terms of Use, readable without leaving the app. */
export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const page = LEGAL_DOCS[doc as LegalDocId] ?? LEGAL_DOCS.privacy;
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <Pressable role="button" aria-label="Close" onPress={leave} style={styles.close}>
          <CloseIcon size={16} color={colors.ink} />
        </Pressable>
        <View style={styles.titles}>
          <AppText variant="headline" role="heading">
            {page.title}
          </AppText>
          <AppText variant="caption" muted>
            Last updated {page.updated}
          </AppText>
        </View>
        <AppText variant="lede">{page.intro}</AppText>
        {page.sections.map((section) => (
          <GlassCard key={section.heading} radius={radii.row} contentStyle={styles.section}>
            <AppText variant="section" role="heading">
              {section.heading}
            </AppText>
            {section.paragraphs?.map((text) => (
              <AppText key={text} variant="lede" style={styles.text}>
                {text}
              </AppText>
            ))}
            {section.bullets?.map((text) => (
              <View key={text} style={styles.bullet}>
                <View style={styles.dot} />
                <AppText variant="lede" style={[styles.text, styles.bulletText]}>
                  {text}
                </AppText>
              </View>
            ))}
          </GlassCard>
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  close: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  section: {
    padding: 18,
    gap: spacing.sm,
  },
  text: {
    color: colors.inkSoft,
  },
  bullet: {
    flexDirection: 'row',
    gap: 10,
  },
  // Sits on the first line of the bullet's text.
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    backgroundColor: colors.accent,
  },
  bulletText: {
    flex: 1,
    fontFamily: fonts.regular,
  },
});
