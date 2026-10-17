import { ComingSoon } from '@/components/coming-soon';
import { TabScreen } from '@/components/tab-screen';
import { ScreenHeader } from '@/components/screen-header';

export default function SubscriptionsScreen() {
  return (
    <TabScreen>
      <ScreenHeader title="All subscriptions" />
      <ComingSoon text="Every subscription you track, sorted by the next charge." />
    </TabScreen>
  );
}
