import type { TextStyle } from 'react-native';

/** Font family per weight. RN picks a font file by family name, so weights map to families. */
export const fonts = {
  display700: 'BricolageGrotesque_700Bold',
  display800: 'BricolageGrotesque_800ExtraBold',
  body400: 'Figtree_400Regular',
  body500: 'Figtree_500Medium',
  body600: 'Figtree_600SemiBold',
  body700: 'Figtree_700Bold',
  body800: 'Figtree_800ExtraBold',
  mono: 'Menlo',
} as const;

export type BodyWeight = 400 | 500 | 600 | 700 | 800;

export const bodyFont = (weight: BodyWeight): string => fonts[`body${weight}`];

const display = (size: number, lineHeight = 1.05): TextStyle => ({
  fontFamily: fonts.display800,
  fontSize: size,
  lineHeight: Math.round(size * lineHeight),
  letterSpacing: -0.02 * size,
});

const body = (size: number, weight: BodyWeight, lineHeight = 1.35): TextStyle => ({
  fontFamily: bodyFont(weight),
  fontSize: size,
  lineHeight: Math.round(size * lineHeight),
});

/** Type scale from tokens.json. `<Text variant>` is the only way screens set type. */
export const typeScale = {
  displayXL: display(52, 1),
  displayL: display(36),
  hero: display(42),
  h1: display(30),
  h2: display(26),
  h3: display(22),
  stat: display(40, 1),
  statL: display(60, 1),
  statS: display(28, 1),
  /** Big numbers set in the body font (values, initials, code digits). */
  figure: body(26, 800, 1.15),
  title: body(17, 800),
  bodyStrong: body(16, 800),
  label: body(16, 700),
  body: body(15, 400, 1.5),
  bodyMedium: body(15, 600, 1.4),
  small: body(13, 600),
  smallStrong: body(13, 700),
  caption: body(12, 700),
  overline: { ...body(11, 800), letterSpacing: 0.44, textTransform: 'uppercase' },
  tabLabel: body(11, 600),
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typeScale;
