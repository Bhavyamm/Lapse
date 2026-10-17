import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { prefersReducedMotion } from '@/utils/motion';

/** True while the phone's Reduce Motion setting is on. Starts from the value read at launch. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(prefersReducedMotion);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => active && setReduce(on))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduce;
}
