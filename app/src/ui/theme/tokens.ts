/**
 * Design tokens, mirrored from /tokens.json (the design hand-off). Screens never use raw values;
 * they use these tokens through the ui/ components.
 */
export const colors = {
  primary: '#0E7490',
  primaryPressed: '#155E75',
  primaryTint: '#ECFEFF',
  onPrimaryTint: '#164E63',
  primaryDecor: '#2B8AA6',
  primaryDeep: '#0B6680',
  primaryMuted: '#5FA9BE',
  primaryDisabled: '#A5D3DE',
  primaryDashed: '#7FC3D3',
  primaryOnDark: '#22D3EE',

  ink: '#0F172A',
  inkSoft: '#334155',
  muted: '#4B5A6B',
  subtle: '#9AA8B4',
  tabInactive: '#7C8B99',
  background: '#F5F8F9',
  surface: '#FFFFFF',
  surfaceSoft: '#EEF2F4',
  line: '#E3E9EC',
  progressEmpty: '#E2E8EC',
  toggleOff: '#D5DEE4',
  dashedNeutral: '#C9D3DA',
  dimOverlay: '#5E6B78',
  darkSurface: '#1E293B',
  darkSurface2: '#334155',
  white: '#FFFFFF',

  sky: '#DDEBFF',
  skyStrong: '#C4DBFB',
  onSky: '#2B4E7E',
  skyIcon: '#2F6FC4',
  skyBar: '#4A8FE7',
  lilac: '#EDE9FE',
  onLilac: '#5B21B6',
  lilacIcon: '#6D28D9',
  lilacBar: '#8B5CF6',
  lilacCheek: '#C4B5FD',
  ice: '#E0F2FE',
  iceStrong: '#BAE6FD',
  iceLine: '#38BDF8',
  cyan: '#A5F3FC',
  cyanBar: '#0891B2',
} as const;

/** Logo colours (brand: two-tone heart). Never recolour the heart red, green or amber. */
export const brandColors = {
  left: '#0E7490',
  right: '#22D3EE',
  overlap: '#026086',
  wordmark: '#0F172A',
  iconBackground: '#ECFEFF',
  whiteLeft: '#FFFFFF',
  whiteRight: '#A5F3FC',
} as const;

/** Result status colours. Only StatusChip, RangeGauge and TrendChart may use these. */
export const statusColors = {
  inRange: { fg: '#15803D', bg: '#DCFCE7' },
  borderline: { fg: '#B45309', bg: '#FEF3C7' },
  high: { fg: '#B91C1C', bg: '#FEE2E2' },
  escalation: { fg: '#B91C1C', bg: '#FEE2E2', title: '#7F1D1D', ring: '#FCA5A5' },
} as const;

export const radius = {
  pill: 999,
  card: 24,
  cardLarge: 28,
  headerBottom: 36,
  tile: 14,
  tileSmall: 12,
  input: 18,
  field: 16,
} as const;

export const spacing = {
  screenX: 20,
  screenXOnboarding: 24,
  xs: 4,
  s: 6,
  m: 8,
  l: 10,
  xl: 12,
  xxl: 14,
  xxxl: 16,
  xxxxl: 20,
  cardPad: 16,
  cardPadL: 18,
} as const;

export const sizes = {
  primaryButton: 56,
  answerButton: 46,
  doseButton: 52,
  tabBarHeight: 66,
  dayDot: 34,
  toggle: { width: 48, height: 30, knob: 24 },
} as const;

/** "Raised" solid shadows are drawn as a View underneath (see PressableRaised), since RN shadows blur. */
export const shadows = {
  tabBar: { shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  floating: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  paper: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  segment: { shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
} as const;

export const motion = {
  pressMs: 80,
  chipMs: 150,
} as const;

export type ColorName = keyof typeof colors;
