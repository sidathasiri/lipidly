import Svg, { G, Path } from 'react-native-svg';
import { brandColors } from '../theme';
import { HALF_LEFT_D, HALF_RIGHT_D, LOCKUP_VIEWBOX, MARK_VIEWBOX, OVERLAP_D, WORDMARK_D, WORDMARK_VIEWBOX } from './paths';

export type LogoVariant = 'mark' | 'lockup' | 'wordmark';
/** `color` on light backgrounds, `white` on teal or dark, `mono` single teal. */
export type LogoTone = 'color' | 'white' | 'mono';

interface LogoProps {
  variant?: LogoVariant;
  tone?: LogoTone;
  /** Rendered height; width follows the logo's proportions. */
  height?: number;
}

const ASPECT: Record<LogoVariant, number> = {
  mark: 100.419 / 89.565,
  wordmark: 126.92 / 47.82,
  lockup: 195.55 / 54.5,
};
const VIEWBOX: Record<LogoVariant, string> = { mark: MARK_VIEWBOX, wordmark: WORDMARK_VIEWBOX, lockup: LOCKUP_VIEWBOX };

/**
 * The Lipidly logo: two overlapping halves of a heart (your habits and your doctor's plan),
 * optionally with the "lipidly" wordmark. Brand rules: keep clear space of half the heart's
 * width, minimum 16px for the mark and 80px wide for the lockup, never stretch or recolour.
 */
export function Logo({ variant = 'lockup', tone = 'color', height = 32 }: LogoProps) {
  const left = tone === 'white' ? brandColors.whiteLeft : brandColors.left;
  const right = tone === 'white' ? brandColors.whiteRight : tone === 'mono' ? brandColors.left : brandColors.right;
  const word = tone === 'white' ? brandColors.whiteLeft : tone === 'mono' ? brandColors.left : brandColors.wordmark;

  const heart = (
    <>
      <Path d={HALF_RIGHT_D} transform="rotate(-45 50 80)" fill={left} />
      <Path d={HALF_LEFT_D} transform="rotate(45 50 80)" fill={right} />
      {tone === 'color' && <Path d={OVERLAP_D} fill={brandColors.overlap} />}
    </>
  );

  return (
    <Svg height={height} width={height * ASPECT[variant]} viewBox={VIEWBOX[variant]} accessibilityRole="image" accessibilityLabel="Lipidly">
      {variant === 'mark' && heart}
      {variant === 'lockup' && <G transform="translate(0 2.4) scale(0.48)">{heart}</G>}
      {variant !== 'mark' && <Path d={WORDMARK_D} fill={word} transform={variant === 'lockup' ? 'translate(64 0)' : undefined} />}
    </Svg>
  );
}
