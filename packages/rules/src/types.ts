/** ISO calendar date, `YYYY-MM-DD`. Dates are compared as strings and never carry a time zone. */
export type IsoDate = string;

export type MarkerId =
  | 'totalCholesterol'
  | 'ldl'
  | 'hdl'
  | 'triglycerides'
  | 'nonHdl'
  | 'vldl'
  | 'tcHdlRatio';

export type Unit = 'mg/dL' | 'mmol/L';

/** `low` is used only for HDL, which works the other way round. */
export type Status = 'inRange' | 'borderline' | 'high' | 'veryHigh' | 'low';

/** Markers that can be a plan's focus. LDL and non-HDL share one slot. */
export type FocusMarker = 'ldl' | 'nonHdl' | 'triglycerides' | 'hdl';

/** Habit-library grouping: LDL and non-HDL use the same habits. */
export type FocusGroup = 'triglycerides' | 'ldlNonHdl' | 'hdl';

export type Mode = 'active' | 'maintenance';

export type Sex = 'male' | 'female' | 'other';

export type HealthCondition = 'heartDisease' | 'stroke' | 'diabetes' | 'kidneyDisease';

export interface MarkerValue {
  marker: MarkerId;
  value: number;
  /** Missing when the report did not print a unit. */
  unit?: Unit;
}

/** Marker values normalised to mg/dL (ratio is unitless). */
export type MarkerValues = Partial<Record<MarkerId, number>>;

export interface ReportInput {
  collectionDate: IsoDate;
  values: MarkerValues;
}

export interface Profile {
  dateOfBirth: IsoDate;
  sex: Sex;
  pregnant: boolean;
  conditions: HealthCondition[];
  smokes: 'daily' | 'sometimes' | 'never';
  alcohol: 'never' | 'sometimes' | 'often';
  lifestyle: LifestyleAnswers;
}

export type TimeFree = 'under15' | '15to30' | 'over30';
export type Place = 'home' | 'outdoors' | 'gym';
export type Equipment = 'none' | 'treadmill' | 'bicycle' | 'gym' | 'pool';
export type PhysicalLimit = 'none' | 'pain' | 'doctorLimited';

export interface LifestyleAnswers {
  timeFree: TimeFree;
  places: Place[];
  equipment: Equipment[];
  physicalLimit: PhysicalLimit;
  cooks: 'self' | 'someoneElse';
  eatsOut: 'rarely' | 'fewTimesAWeek' | 'mostDays';
  /** Free-text "+ Other" answers. Shown back to the user; not used for matching. */
  other?: { places?: string[]; equipment?: string[]; physicalLimits?: string[] };
}
