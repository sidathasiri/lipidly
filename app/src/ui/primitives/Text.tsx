import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { bodyFont, colors, typeScale, type BodyWeight, type ColorName, type TextVariant } from '../theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorName;
  /** Overrides the weight of a body variant (ignored for display variants). */
  weight?: BodyWeight;
  align?: TextStyle['textAlign'];
}

/** The only text component screens use. Variants map 1:1 to the token type scale. */
export function Text({ variant = 'body', color = 'ink', weight, align, style, ...rest }: TextProps) {
  const base = typeScale[variant];
  const isDisplay = base.fontFamily?.startsWith('Bricolage');
  return (
    <RNText
      {...rest}
      style={[
        base,
        { color: colors[color] },
        weight && !isDisplay ? { fontFamily: bodyFont(weight) } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
