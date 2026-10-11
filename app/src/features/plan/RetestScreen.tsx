import { addMonths, RULESET } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { fmtDate } from '@/lib/format';
import { setRetestDate } from '@/state/actions/plan';
import { useOverview } from '@/state/hooks';
import { today } from '@/state/ids';
import { Button, Callout, DateField, Screen, ScreenState, Text, TopBar } from '@/ui';

/** Change the retest date, e.g. to match a doctor's request (F4.7). */
export default function RetestScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const { data, plan } = useOverview();
  const target = planId ? data.plans.find((p) => p.id === planId) : plan;
  const [date, setDate] = useState(target?.retestDate);

  if (!target || !date) {
    return (
      <Screen topBar={<TopBar />}>
        <ScreenState kind="empty" title="No plan yet" />
      </Screen>
    );
  }

  return (
    <Screen topBar={<TopBar />}
      gap={14}
      footer={
        <Button
          label="Save date"
          onPress={() => {
            setRetestDate(target.id, date);
            router.back();
          }}
        />
      }
    >
      <Text variant="h1" accessibilityRole="header">
        Retest date
      </Text>
      <Text variant="body" color="muted">
        We suggest a retest {target.mode === 'active' ? '12 weeks' : '6 months'} after your report. If your doctor gave you a date, use that one.
      </Text>
      <DateField label="Next blood test" mode="date" value={date} display={fmtDate(date)} minimumDate={today()} maximumDate={addMonths(today(), RULESET.retest.maintenanceMaxMonths)} onChange={setDate} />
      <Callout tone="sky">We'll remind you two weeks before and again two days before.</Callout>
    </Screen>
  );
}
