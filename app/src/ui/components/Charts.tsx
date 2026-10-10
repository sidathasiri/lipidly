import { bandRanges, type MarkerId, type Sex } from '@lipidly/rules';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { Text } from '../primitives/Text';
import { colors, fonts } from '../theme';
import { statusPair } from './Chip';

/** Display domain for a marker: from 0 to a little past the top cut-off (or the value, if higher). */
const domainMax = (marker: MarkerId, sex: Sex, values: number[]): number => {
  const bands = bandRanges(marker, sex);
  const lastCut = Math.max(...bands.map((b) => b.to ?? b.from));
  return Math.max(lastCut * (marker === 'hdl' ? 2.5 : 1.25), ...values.map((v) => v * 1.1));
};

// ── Range gauge (Results) ─────────────────────────────────────────────────────

interface RangeGaugeProps {
  marker: MarkerId;
  value: number;
  sex: Sex;
}

/** 6px bar coloured at the marker's band cut-offs, with a white dot at the value. */
export function RangeGauge({ marker, value, sex }: RangeGaugeProps) {
  const bands = bandRanges(marker, sex);
  if (!bands.length) return null;
  const max = domainMax(marker, sex, [value]);
  const pct = (v: number) => Math.min(100, (v / max) * 100);
  return (
    <View style={styles.gauge} accessible={false}>
      <View style={styles.gaugeTrack}>
        {bands.map((b, i) => (
          <View
            key={b.status}
            style={{
              width: `${pct(b.to ?? max) - pct(b.from)}%`,
              backgroundColor: statusPair(b.status).fg,
              borderTopLeftRadius: i === 0 ? 3 : 0,
              borderBottomLeftRadius: i === 0 ? 3 : 0,
              borderTopRightRadius: i === bands.length - 1 ? 3 : 0,
              borderBottomRightRadius: i === bands.length - 1 ? 3 : 0,
            }}
          />
        ))}
      </View>
      <View style={[styles.gaugeDot, { left: `${pct(value)}%` }]} />
    </View>
  );
}

// ── Trend chart (Marker detail) ───────────────────────────────────────────────

interface TrendChartProps {
  marker: MarkerId;
  sex: Sex;
  points: { label: string; value: number }[];
  height?: number;
}

/**
 * Status bands fill the background (the only place status colours fill large areas),
 * with a 4px primary line and point markers. The latest point is filled.
 */
export function TrendChart({ marker, sex, points, height = 160 }: TrendChartProps) {
  const [width, setWidth] = useState(0);
  const bands = bandRanges(marker, sex);
  const values = points.map((p) => p.value);
  const max = domainMax(marker, sex, values);
  const min = 0;
  const axisW = 34;
  const plotW = Math.max(0, width - axisW);
  const y = (v: number) => height - ((v - min) / (max - min)) * height;
  const padX = 24;
  const x = (i: number) => (points.length === 1 ? plotW / 2 : padX + (i * (plotW - padX * 2)) / (points.length - 1));
  const cuts = [...new Set(bands.flatMap((b) => (b.to ? [b.to] : [])))];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityLabel={`Trend: ${points.map((p) => `${p.label} ${p.value}`).join(', ')}`}>
      {width > 0 && (
        <Svg width={width} height={height + 4}>
          {bands.map((b) => {
            const top = y(Math.min(b.to ?? max, max));
            const bottom = y(b.from);
            return <Rect key={b.status} x={axisW} y={top} width={plotW} height={Math.max(0, bottom - top)} fill={statusPair(b.status).bg} />;
          })}
          {cuts.map((c) => (
            <SvgText key={c} x={axisW - 6} y={y(c) + 4} fontSize={11} fill={colors.muted} textAnchor="end" fontFamily={fonts.body600}>
              {c}
            </SvgText>
          ))}
          <Line x1={axisW} x2={axisW + plotW} y1={height} y2={height} stroke={colors.line} strokeWidth={1} />
          {points.length > 1 && (
            <Polyline
              points={points.map((p, i) => `${axisW + x(i)},${y(p.value)}`).join(' ')}
              fill="none"
              stroke={colors.primary}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {points.map((p, i) => {
            const last = i === points.length - 1;
            return (
              <Circle
                key={i}
                cx={axisW + x(i)}
                cy={y(p.value)}
                r={last ? 9 : 7}
                fill={last ? colors.primary : colors.white}
                stroke={last ? colors.white : colors.primary}
                strokeWidth={last ? 3 : 4}
              />
            );
          })}
        </Svg>
      )}
      <View style={[styles.chartLabels, { paddingLeft: axisW }]}>
        {points.map((p, i) => (
          <Text key={i} variant="caption" color="muted" style={{ position: 'absolute', left: axisW + x(i) - 40, width: 80, textAlign: 'center' }}>
            {p.label} · {p.value}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gauge: { flex: 1, height: 14, justifyContent: 'center' },
  gaugeTrack: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' },
  gaugeDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
  },
  chartLabels: { height: 20, marginTop: 6 },
});
