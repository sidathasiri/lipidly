import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { ClipboardList, FileText, House, Pill, UserRound } from 'lucide-react-native';
import { TabBarContainer, TabButton } from '@/ui';

/** Five bottom tabs with the design's floating pill tab bar. */
export default function TabLayout() {
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <TabBarContainer>
          <TabTrigger name="home" href="/home" asChild>
            <TabButton icon={House} label="Home" />
          </TabTrigger>
          <TabTrigger name="plan" href="/plan" asChild>
            <TabButton icon={ClipboardList} label="Plan" />
          </TabTrigger>
          <TabTrigger name="reports" href="/reports" asChild>
            <TabButton icon={FileText} label="Reports" />
          </TabTrigger>
          <TabTrigger name="medicines" href="/medicines" asChild>
            <TabButton icon={Pill} label="Medicines" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon={UserRound} label="Profile" />
          </TabTrigger>
        </TabBarContainer>
      </TabList>
    </Tabs>
  );
}
