import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors } from '@/theme';
import { prefersReducedMotion, SETTLE } from '@/utils/motion';

type Props = {
  visible: boolean;
  /** Hides at once, with no slide, such as when the Face ID lock comes up over private details. */
  hideNow?: boolean;
  /**
   * Asked to close by the backdrop, a swipe down or Android's back. Returns false when it isn't
   * closing yet, such as while it asks about unsaved changes, so a swiped sheet springs back.
   */
  onClose: () => void | boolean;
  /** The sheet itself, drawn at the bottom. Kept on screen while it slides away. */
  children: ReactNode;
};

/** How far down, as a share of the sheet's height, a swipe has to go to close it. */
const SWIPE_CLOSE = 0.3;

/**
 * A sheet that slides up over a dimming backdrop. The backdrop fades on its own instead of
 * sliding up with the sheet, and closing plays the slide in reverse before the modal goes.
 * A grabber at the top shows it can be swiped down to close, as system sheets can.
 */
export function BottomSheet({ visible, hideNow = false, onClose, children }: Props) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  const [progress] = useState(() => new Animated.Value(0));
  // How far the person has pulled the sheet down.
  const [drag] = useState(() => new Animated.Value(0));
  const [sheetHeight, setSheetHeight] = useState(height);

  useEffect(() => {
    if (!mounted) return;
    if (visible) drag.setValue(0);
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
  }, [visible, mounted, progress, drag]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Only clear downward pulls; scroll views inside the sheet keep their own scrolling.
        onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onPanResponderMove: (_, g) => drag.setValue(Math.max(g.dy, 0)),
        onPanResponderRelease: (_, g) => {
          const far = g.dy > sheetHeight * SWIPE_CLOSE || g.vy > 1.2;
          if (far && onClose() !== false) return;
          if (prefersReducedMotion()) return drag.setValue(0);
          Animated.spring(drag, { toValue: 0, ...SETTLE, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => drag.setValue(0),
      }),
    [drag, onClose, sheetHeight],
  );

  const slide = Animated.add(progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }), drag);
  return (
    <Modal
      visible={mounted && !hideNow}
      transparent
      animationType="none"
      onRequestClose={() => onClose()}
      statusBarTranslucent>
      <Animated.View style={[styles.scrim, { opacity: progress }]}>
        {/* Tapping outside closes too; hidden from screen readers, which use the sheet's Close button. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose()} aria-hidden accessible={false} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.holder}
        pointerEvents="box-none">
        {/* Inert while sliding away, so a second Save or Close can't land. */}
        <Animated.View
          style={{ transform: [{ translateY: slide }] }}
          pointerEvents={visible ? 'auto' : 'none'}
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          {...pan.panHandlers}>
          {children}
          <View style={styles.grabber} aria-hidden pointerEvents="none" />
        </Animated.View>
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
  grabber: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.hairline,
  },
});
