import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { colors } from '@/theme';
import { prefersReducedMotion, SETTLE } from '@/utils/motion';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** The sheet itself, drawn at the bottom. Kept on screen while it slides away. */
  children: ReactNode;
};

/**
 * A sheet that slides up over a dimming backdrop. The backdrop fades on its own instead of
 * sliding up with the sheet, and closing plays the slide in reverse before the modal goes.
 */
export function BottomSheet({ visible, onClose, children }: Props) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!mounted) return;
    const instant = prefersReducedMotion();
    const move =
      visible && !instant
        ? Animated.spring(progress, { toValue: 1, ...SETTLE, useNativeDriver: true })
        : Animated.timing(progress, {
            toValue: visible ? 1 : 0,
            duration: instant ? 0 : 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          });
    move.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => move.stop();
  }, [visible, mounted, progress]);

  const slide = progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });
  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.scrim, { opacity: progress }]}>
        {/* Tapping outside closes too; hidden from screen readers, which use the sheet's Close button. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} aria-hidden accessible={false} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.holder}
        pointerEvents="box-none">
        <Animated.View style={{ transform: [{ translateY: slide }] }}>{children}</Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  holder: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
