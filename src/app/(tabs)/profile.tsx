import { ComingSoon } from '@/components/coming-soon';
import { TabScreen } from '@/components/tab-screen';
import { ScreenHeader } from '@/components/screen-header';

export default function ProfileScreen() {
  return (
    <TabScreen>
      <ScreenHeader title="Profile" />
      <ComingSoon text="Money saved, reminder settings, Face ID and Pro." />
    </TabScreen>
  );
}
