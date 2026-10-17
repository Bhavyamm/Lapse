import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { today as getToday, type LocalDate } from '@/utils/dates';

/** Today's date, refreshed when the app comes back to the foreground and at midnight. */
export function useToday(): LocalDate {
  const [today, setToday] = useState(getToday);
  useEffect(() => {
    const refresh = () => setToday(getToday());
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timer = setTimeout(refresh, msToMidnight + 1000);
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [today]);
  return today;
}
