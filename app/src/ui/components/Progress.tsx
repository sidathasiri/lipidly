import type { DayState, MonthCellState } from '@lipidly/rules';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../primitives/Text';
import { colors, radius, sizes, type ColorName } from '../theme';

// ── Progress bars ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  /** 0–1. Ignored when `segments` is set. */
  value?: number;
  /** Segmented bar: number of segments and how many are filled. */
  segments?: number;
  filled?: number;
  height?: number;
  fill?: string;
  track?: string;
  accessibilityLabel?: string;
}

export function ProgressBar({
  value = 0,
  segments,
  filled = 0,
  height = 8,
  fill = colors.primary,
  track = colors.progressEmpty,
  accessibilityLabel,
}: ProgressBarProps) {
  const a11y = {
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel,
    accessibilityValue: segments ? { min: 0, max: segments, now: filled } : { min: 0, max: 100, now: Math.round(value * 100) },
  };
  if (segments) {
    return (
      <View style={styles.segRow} {...a11y}>
        {Array.from({ length: segments }, (_, i) => (
          <View key={i} style={{ flex: 1, height, borderRadius: height / 2, backgroundColor: i < filled ? fill : track }} />
        ))}
      </View>
    );
  }
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }} {...a11y}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height, borderRadius: height / 2, backgroundColor: fill }} />
    </View>
  );
}

// ── Progress ring ─────────────────────────────────────────────────────────────

interface ProgressRingProps {
  done: number;
  total: number;
  size?: number;
}

/** 64px ring on the teal check-in card: cyan over decor teal, with "0/4" in the middle. */
export function ProgressRing({ done, total, size = 64 }: ProgressRingProps) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const share = total > 0 ? done / total : 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`${done} of ${total} answered`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.primaryDecor} strokeWidth={stroke} fill="none" />
        {share > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.cyan}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c * share} ${c}`}
            strokeLinecap={share < 1 ? 'round' : 'butt'}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <Text variant="bodyStrong" color="white">
        {done}/{total}
      </Text>
    </View>
  );
}

// ── Day dots ──────────────────────────────────────────────────────────────────

interface DayDotProps {
  state: DayState | 'skipped';
  /** `onPrimary` for the dark week panel on the check-in done screen. */
  variant?: 'light' | 'onPrimary';
  size?: number;
}

export function DayDot({ state, variant = 'light', size = sizes.dayDot }: DayDotProps) {
  const onPrimary = variant === 'onPrimary';
  const base = { width: size, height: size, borderRadius: size / 2, alignItems: 'center' as const, justifyContent: 'center' as const };
  if (state === 'done') {
    return (
      <View style={[base, { backgroundColor: onPrimary ? colors.cyan : colors.primary }]}>
        <Text variant="smallStrong" weight={800} color={onPrimary ? 'primaryDeep' : 'white'}>
          {'✓'}
        </Text>
      </View>
    );
  }
  if (state === 'today') {
    return (
      <View style={[base, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, margin: -3, backgroundColor: onPrimary ? colors.primaryMuted : colors.primaryTint }]}>
        <View style={[base, { backgroundColor: onPrimary ? colors.white : colors.surface, borderWidth: onPrimary ? 0 : 3, borderColor: colors.primary }]} />
      </View>
    );
  }
  if (state === 'future') {
    return <View style={[base, { backgroundColor: onPrimary ? colors.primaryDecor : colors.background }]} />;
  }
  return <View style={[base, { borderWidth: 2, borderStyle: 'dashed', borderColor: onPrimary ? colors.primaryMuted : colors.dashedNeutral }]} />;
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface WeekStripProps {
  days: { date: string; state: DayState | 'skipped' }[];
  variant?: 'light' | 'onPrimary';
  /** Weekday letters under the dots. */
  labels?: string[];
}

/** Seven day dots, Sunday first. */
export function WeekStrip({ days, variant = 'light', labels }: WeekStripProps) {
  const letters = labels ?? days.map((d) => WEEKDAY_LETTERS[new Date(`${d.date}T00:00:00Z`).getUTCDay()]!);
  return (
    <View style={styles.week}>
      {days.map((d, i) => (
        <View key={d.date} style={styles.weekCell} accessible accessibilityLabel={`${d.date}: ${d.state === 'done' ? 'checked in' : d.state}`}>
          <DayDot state={d.state} variant={variant} />
          <Text variant="caption" color={variant === 'onPrimary' ? 'cyan' : 'muted'}>
            {letters[i]}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Month calendar ────────────────────────────────────────────────────────────

const CELL: Record<MonthCellState, { bg: string; fg: ColorName; border?: { width: number; color: string; dashed?: boolean } }> = {
  all: { bg: colors.primary, fg: 'white' },
  most: { bg: colors.primaryDecor, fg: 'white' },
  some: { bg: colors.primaryDisabled, fg: 'ink' },
  missed: { bg: colors.surface, fg: 'muted', border: { width: 2, color: colors.dashedNeutral, dashed: true } },
  today: { bg: colors.surface, fg: 'primary', border: { width: 3, color: colors.primary } },
  future: { bg: colors.background, fg: 'subtle' },
};

interface MonthCalendarProps {
  /** First day of the month, `YYYY-MM-01`. */
  monthStart: string;
  cells: { date: string; state: MonthCellState }[];
}

/** Sunday-first month grid shaded by habits kept, with a legend. */
export function MonthCalendar({ monthStart, cells }: MonthCalendarProps) {
  const leading = new Date(`${monthStart}T00:00:00Z`).getUTCDay();
  const slots: ({ date: string; state: MonthCellState } | null)[] = [...Array(leading).fill(null), ...cells];
  while (slots.length % 7) slots.push(null);
  const weeks = Array.from({ length: slots.length / 7 }, (_, w) => slots.slice(w * 7, w * 7 + 7));

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.monthRow}>
        {WEEKDAY_LETTERS.map((l, i) => (
          <Text key={i} variant="caption" color="muted" align="center" style={styles.monthCellBox}>
            {l}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.monthRow}>
          {week.map((cell, i) => {
            if (!cell) return <View key={i} style={styles.monthCellBox} />;
            const look = CELL[cell.state];
            return (
              <View
                key={cell.date}
                style={[
                  styles.monthCellBox,
                  styles.monthCell,
                  { backgroundColor: look.bg },
                  look.border && { borderWidth: look.border.width, borderColor: look.border.color, borderStyle: look.border.dashed ? 'dashed' : 'solid' },
                ]}
                accessible
                accessibilityLabel={`${cell.date}: ${cell.state}`}
              >
                <Text variant="smallStrong" weight={800} color={look.fg}>
                  {Number(cell.date.slice(8))}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
      <View style={styles.legend}>
        {(
          [
            ['all', 'All habits kept'],
            ['most', 'Most'],
            ['some', 'Some'],
            ['missed', 'No check-in'],
          ] as const
        ).map(([state, label]) => {
          const look = CELL[state];
          return (
            <View key={state} style={styles.legendItem}>
              <View
                style={[
                  styles.legendSwatch,
                  { backgroundColor: look.bg },
                  look.border && { borderWidth: 2, borderColor: look.border.color, borderStyle: 'dashed' },
                ]}
              />
              <Text variant="caption" color="muted">
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Page dots (welcome) ───────────────────────────────────────────────────────

export function PageDots({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.pageDots} accessibilityLabel={`Page ${active + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === active ? colors.white : colors.primaryMuted }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  segRow: { flexDirection: 'row', gap: 4 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCell: { alignItems: 'center', gap: 5, flex: 1 },
  monthRow: { flexDirection: 'row', gap: 6 },
  monthCellBox: { flex: 1 },
  monthCell: { height: 36, borderRadius: radius.tileSmall, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 14, height: 14, borderRadius: 5 },
  pageDots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
});
