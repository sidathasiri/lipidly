import type { LucideIcon } from 'lucide-react-native';
import { colors, type ColorName } from '../theme';

export type IconComponent = LucideIcon;

interface IconProps {
  icon: LucideIcon;
  size?: number;
  color?: ColorName;
  strokeWidth?: number;
}

/** Lucide icon with the design's rounded 2px stroke. */
export function Icon({ icon: Glyph, size = 20, color = 'ink', strokeWidth = 2.2 }: IconProps) {
  return <Glyph size={size} color={colors[color]} strokeWidth={strokeWidth} absoluteStrokeWidth={false} />;
}
