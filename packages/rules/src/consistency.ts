import { daysBetween } from './dates';
import { toMgDl } from './markers';
import { RULESET } from './ruleset';
import type { IsoDate, MarkerId, MarkerValue, Unit } from './types';

export type ConsistencyCode =
  | 'implausible'
  | 'friedewald'
  | 'nonHdlMismatch'
  | 'unitMissing'
  | 'unitMismatch'
  | 'dateInFuture'
  | 'dateTooOld';

export interface ConsistencyFlag {
  field: MarkerId | 'collectionDate';
  code: ConsistencyCode;
  /** Plain-language prompt for the confirm screen. It asks the user to look again; it never blocks. */
  message: string;
}

const C = RULESET.consistency;

const isPlausible = (v: MarkerValue, unit: Unit | undefined): boolean => {
  const [min, max] = C.plausible[v.marker];
  const mg = toMgDl(v.marker, v.value, unit);
  return mg >= min && mg <= max;
};

/**
 * Checks extracted values for likely misreads (spec: "Consistency checks on extracted values").
 * A flag highlights the field; the user can still confirm.
 */
export const checkConsistency = (
  values: MarkerValue[],
  collectionDate: IsoDate,
  today: IsoDate,
): ConsistencyFlag[] => {
  const flags: ConsistencyFlag[] = [];
  const mg: Partial<Record<MarkerId, number>> = {};

  for (const v of values) {
    const hasUnit = v.marker === 'tcHdlRatio' || v.unit !== undefined;
    if (!hasUnit) {
      flags.push({ field: v.marker, code: 'unitMissing', message: 'We couldn’t read a unit for this value. Please check it on the report.' });
      continue;
    }
    if (isPlausible(v, v.unit)) {
      mg[v.marker] = toMgDl(v.marker, v.value, v.unit);
      continue;
    }
    const other: Unit = v.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL';
    if (v.unit && isPlausible(v, other)) {
      flags.push({ field: v.marker, code: 'unitMismatch', message: `This value looks like it may be in ${other}. Please check the unit on the report.` });
    } else {
      flags.push({ field: v.marker, code: 'implausible', message: 'This value is unusual for this test, so it may be misread. Please look again.' });
    }
  }

  const { totalCholesterol: tc, hdl, triglycerides: tg, ldl, nonHdl } = mg;
  if (tc !== undefined && hdl !== undefined && tg !== undefined && ldl !== undefined && tg < C.friedewaldMaxTriglycerides) {
    const expected = Math.round(tc - hdl - tg / 5);
    if (Math.abs(expected - ldl) > C.friedewaldTolerance) {
      flags.push({
        field: 'ldl',
        code: 'friedewald',
        message: `Please look again. Your other values suggest LDL near ${expected}, so this may be misread. Check the highlighted line.`,
      });
    }
  }
  if (tc !== undefined && hdl !== undefined && nonHdl !== undefined && Math.abs(tc - hdl - nonHdl) > C.nonHdlTolerance) {
    flags.push({
      field: 'nonHdl',
      code: 'nonHdlMismatch',
      message: `Please look again. Total minus HDL is ${tc - hdl}, so this may be misread. Check the highlighted line.`,
    });
  }

  const age = daysBetween(collectionDate, today);
  if (age < 0) flags.push({ field: 'collectionDate', code: 'dateInFuture', message: 'This date is in the future. Please check the collection date.' });
  else if (age > C.maxReportAgeDays) flags.push({ field: 'collectionDate', code: 'dateTooOld', message: 'This report is more than a year old. Please check the collection date.' });

  return flags;
};
