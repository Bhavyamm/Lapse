import { ComingSoon } from '@/components/coming-soon';
import { TabScreen } from '@/components/tab-screen';
import { ScreenHeader } from '@/components/screen-header';

export default function CalendarScreen() {
  return (
    <TabScreen>
      <ScreenHeader title="Calendar" />
      <ComingSoon text="Every renewal on a calendar, with the rest of the month listed below it." />
    </TabScreen>
  );
}
