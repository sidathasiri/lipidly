import { addDays, monthCellState, streaks, weekDots, type IsoDate } from '@lipidly/rules';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fmtMonthYear } from '@/lib/format';
import { today } from '@/state/ids';
import type { CheckIn } from '@/state/types';
import { Callout, Card, Chip, Icon, MonthCalendar, SegmentedControl, StatTile, Tap, Text, WeekStrip } from '@/ui';

const monthStartOf = (d: IsoDate) => `${d.slice(0, 7)}-01`;
const shiftMonth = (start: IsoDate, delta: number) => {
  const [y, m] = start.split('-').map(Number) as [number, number];
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
  return dt.toISOString().slice(0, 10);
};
const daysInMonth = (start: IsoDate) => {
  const [y, m] = start.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** "Your check-ins" with a Week / Month switch (07, 07c). Streaks count check-in days, never guilt. */
export function CheckInsCard({ checkIns }: { checkIns: Record<IsoDate, CheckIn> }) {
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [month, setMonth] = useState(monthStartOf(today()));
  const t = today();
  const dates = Object.keys(checkIns);
  const run = streaks(dates, t);
  const week = weekDots(dates, t);
  const doneThisWeek = week.filter((d) => d.state === 'done').length;
  const doneToday = !!checkIns[t];

  const cells = useMemo(
    () => Array.from({ length: daysInMonth(month) }, (_, i) => addDays(month, i)).map((date) => ({ date, state: monthCellState(checkIns[date], date, t) })),
    [checkIns, month, t],
  );
  const monthCount = cells.filter((c) => !['missed', 'today', 'future'].includes(c.state)).length;

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <View style={styles.head}>
          <Text variant="bodyStrong">Your check-ins</Text>
          <SegmentedControl
            options={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </View>

        {mode === 'week' ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            <View style={styles.weekSummary}>
              <Text variant="stat" color="primary">
                {doneThisWeek}
              </Text>
              <View style={{ flex: 1 }}>
                <Text variant="smallStrong" style={{ fontSize: 14 }}>
                  of 7 days this week
                </Text>
                <Text variant="small" color="muted" style={{ fontSize: 14 }}>
                  {doneToday ? 'Nice work. See you tomorrow' : `Check in today to make it ${doneThisWeek + 1}`}
                </Text>
              </View>
              {run.best > 1 && <Chip label={`Best run · ${run.best} days`} />}
            </View>
            <WeekStrip days={week} />
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 12 }}>
            <View style={styles.monthNav}>
              <Tap onPress={() => setMonth(shiftMonth(month, -1))} accessibilityLabel="Previous month" hitSlop={10}>
                <Icon icon={ChevronLeft} color="muted" />
              </Tap>
              <Text variant="bodyStrong">{fmtMonthYear(month)}</Text>
              <Tap onPress={() => setMonth(shiftMonth(month, 1))} accessibilityLabel="Next month" hitSlop={10} disabled={month >= monthStartOf(t)}>
                <Icon icon={ChevronRight} color={month >= monthStartOf(t) ? 'subtle' : 'muted'} />
              </Tap>
            </View>
            <MonthCalendar monthStart={month} cells={cells} />
          </View>
        )}
      </Card>

      {mode === 'month' && (
        <>
          <View style={styles.stats}>
            <StatTile tone="primary" size="sm" value={monthCount} label="check-ins this month" />
            <StatTile tone="sky" size="sm" value={run.current} label={run.current === 1 ? 'day in a row now' : 'days in a row now'} />
            <StatTile tone="lilac" size="sm" value={run.best} label="best run" />
          </View>
          <Callout tone="white" mascot="happy">
            Missed a day? Your run keeps going if you fill it in within two days.
          </Callout>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekSummary: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stats: { flexDirection: 'row', gap: 8 },
});
