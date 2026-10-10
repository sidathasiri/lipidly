import { RULESET } from './ruleset';
import type { MarkerId, MarkerValue, MarkerValues, Sex, Status, Unit } from './types';

export const MARKER_LABELS: Record<MarkerId, string> = {
  totalCholesterol: 'Total cholesterol',
  ldl: 'LDL',
  hdl: 'HDL',
  triglycerides: 'Triglycerides',
  nonHdl: 'Non-HDL',
  vldl: 'VLDL',
  tcHdlRatio: 'Total/HDL ratio',
};

/** mmol/L → mg/dL factors. */
const MMOL_FACTOR: Partial<Record<MarkerId, number>> = {
  totalCholesterol: 38.67,
  ldl: 38.67,
  hdl: 38.67,
  nonHdl: 38.67,
  vldl: 38.67,
  triglycerides: 88.57,
};

export const unitFor = (marker: MarkerId): Unit | undefined => (marker === 'tcHdlRatio' ? undefined : 'mg/dL');

/** Converts a value to mg/dL. Values with no unit are assumed to be mg/dL (the consistency checks flag them). */
export const toMgDl = (marker: MarkerId, value: number, unit: Unit | undefined): number => {
  const factor = MMOL_FACTOR[marker];
  if (unit !== 'mmol/L' || !factor) return value;
  return Math.round(value * factor);
};

/** Normalises extracted or hand-entered values to mg/dL, and derives non-HDL when the report omits it. */
export const normaliseValues = (values: MarkerValue[]): MarkerValues => {
  const out: MarkerValues = {};
  for (const v of values) out[v.marker] = toMgDl(v.marker, v.value, v.unit);
  if (out.nonHdl === undefined && out.totalCholesterol !== undefined && out.hdl !== undefined) {
    out.nonHdl = out.totalCholesterol - out.hdl;
  }
  return out;
};

/** The band a value falls in, or `undefined` for markers without bands (VLDL, ratio). */
export const statusOf = (marker: MarkerId, mgDl: number, sex: Sex): Status | undefined => {
  if (marker === 'hdl') return mgDl < RULESET.hdlLow[sex] ? 'low' : 'inRange';
  const b = RULESET.bands[marker];
  if (!b) return undefined;
  if (b.veryHigh !== undefined && mgDl >= b.veryHigh) return 'veryHigh';
  if (mgDl >= b.high) return 'high';
  if (mgDl >= b.borderline) return 'borderline';
  return 'inRange';
};

export interface BandRange {
  status: Status;
  /** Inclusive lower bound (mg/dL). */
  from: number;
  /** Exclusive upper bound; `undefined` = no upper limit. */
  to?: number;
  /** "Under 150", "150 – 199", "500 and over". */
  label: string;
}

/** The bands of a marker, low to high, for gauges, chart backgrounds and legends. */
export const bandRanges = (marker: MarkerId, sex: Sex): BandRange[] => {
  if (marker === 'hdl') {
    const cut = RULESET.hdlLow[sex];
    return [
      { status: 'low', from: 0, to: cut, label: `Under ${cut}` },
      { status: 'inRange', from: cut, label: `${cut} and over` },
    ];
  }
  const b = RULESET.bands[marker];
  if (!b) return [];
  const out: BandRange[] = [
    { status: 'inRange', from: 0, to: b.borderline, label: `Under ${b.borderline}` },
    { status: 'borderline', from: b.borderline, to: b.high, label: `${b.borderline} – ${b.high - 1}` },
  ];
  if (b.veryHigh !== undefined) {
    out.push({ status: 'high', from: b.high, to: b.veryHigh, label: `${b.high} – ${b.veryHigh - 1}` });
    out.push({ status: 'veryHigh', from: b.veryHigh, label: `${b.veryHigh} and over` });
  } else {
    out.push({ status: 'high', from: b.high, label: `${b.high} and over` });
  }
  return out;
};

export const statusesOf =(values: MarkerValues, sex: Sex): Partial<Record<MarkerId, Status>> => {
  const out: Partial<Record<MarkerId, Status>> = {};
  for (const [marker, value] of Object.entries(values) as [MarkerId, number][]) {
    const s = statusOf(marker, value, sex);
    if (s) out[marker] = s;
  }
  return out;
};

/** Higher is worse. Low HDL ranks with high. */
export const SEVERITY: Record<Status, number> = { inRange: 0, borderline: 1, high: 2, low: 2, veryHigh: 3 };

export const STATUS_LABELS: Record<Status, string> = {
  inRange: 'In range',
  borderline: 'Borderline',
  high: 'High',
  veryHigh: 'Very high',
  low: 'Low',
};

/** HDL is better when higher; every other marker is better when lower. */
export const higherIsBetter = (marker: MarkerId): boolean => marker === 'hdl';

export type Direction = 'better' | 'worse' | 'same';

/** Describes a change without claiming a cause (spec F8.3). */
export const changeDirection = (marker: MarkerId, before: number, after: number): Direction => {
  if (before === after) return 'same';
  const up = after > before;
  return up === higherIsBetter(marker) ? 'better' : 'worse';
};

/** Signed percentage change, rounded to a whole number. */
export const percentChange = (before: number, after: number): number =>
  before === 0 ? 0 : Math.round(((after - before) / before) * 100);
