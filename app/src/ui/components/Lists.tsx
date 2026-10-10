import { ChevronRight, Plus, type LucideIcon } from 'lucide-react-native';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '../primitives/Icon';
import { Tap } from '../primitives/Pressables';
import { Text } from '../primitives/Text';
import { colors, radius, type ColorName } from '../theme';
import { IconTile, type TileTone } from './Tiles';

// ── Section label ─────────────────────────────────────────────────────────────

interface SectionProps {
  title?: string;
  /** Uppercase overline style instead of a bold label. */
  overline?: boolean;
  action?: ReactNode;
  children: ReactNode;
  gap?: number;
}

export function Section({ title, overline, action, children, gap = 10 }: SectionProps) {
  return (
    <View style={{ gap }}>
      {(title || action) && (
        <View style={styles.sectionHead}>
          {title ? (
            <Text variant={overline ? 'overline' : 'label'} color={overline ? 'muted' : 'ink'}>
              {title}
            </Text>
          ) : (
            <View />
          )}
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

// ── List group and row ────────────────────────────────────────────────────────

/** White card holding rows separated by 1px soft dividers. */
export function ListGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.group, style]}>
      {items.map((child, i) => (
        <Fragment key={child.key ?? i}>
          {i > 0 && <View style={styles.divider} />}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Small uppercase label above the title, e.g. "FROM YOUR DOCTOR". */
  overline?: string;
  icon?: LucideIcon;
  iconTone?: TileTone;
  /** Custom leading element (date tile, avatar) in place of the icon tile. */
  leading?: ReactNode;
  /** Value text on the right, e.g. "8:00 pm". */
  value?: string;
  valueColor?: ColorName;
  /** Custom trailing element (toggle, chip, button). */
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  titleColor?: ColorName;
}

export function ListRow({
  title,
  subtitle,
  overline,
  icon,
  iconTone,
  leading,
  value,
  valueColor = 'muted',
  trailing,
  chevron,
  onPress,
  titleColor = 'ink',
}: ListRowProps) {
  const content = (
    <View style={styles.row}>
      {leading ?? (icon ? <IconTile icon={icon} tone={iconTone} size={38} /> : null)}
      <View style={styles.rowText}>
        {overline && (
          <Text variant="overline" color="primary">
            {overline}
          </Text>
        )}
        <Text variant="bodyStrong" color={titleColor}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="small" color="muted">
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="smallStrong" color={valueColor} style={styles.value}>
          {value}
        </Text>
      )}
      {trailing}
      {(chevron ?? !!onPress) && !trailing && <Icon icon={ChevronRight} size={18} color="subtle" />}
    </View>
  );
  return onPress ? (
    <Tap onPress={onPress} accessibilityLabel={[overline, title, subtitle, value].filter(Boolean).join(', ')}>
      {content}
    </Tap>
  ) : (
    content
  );
}

/** Dashed "+" tile and label for adding an item (design: "Add a meal photo", visit-summary add row). */
export function AddRow({ label, caption, onPress }: { label: string; caption?: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label} accessibilityHint={caption} style={styles.addRow}>
      <IconTile icon={Plus} tone="dashed" size={38} />
      <View style={styles.rowText}>
        <Text variant="bodyMedium" color="primary" weight={700}>
          {label}
        </Text>
        {caption && (
          <Text variant="small" weight={400} color="muted">
            {caption}
          </Text>
        )}
      </View>
    </Tap>
  );
}

/** Label / value rows in a white card: profile details, medicine fields, version info. */
export function DetailList({ rows }: { rows: [label: string, value: string][] }) {
  return (
    <View style={styles.group}>
      {rows.map(([label, value], i) => (
        <Fragment key={label}>
          {i > 0 && <View style={styles.divider} />}
          <View style={styles.detail}>
            <Text variant="small" weight={500} color="muted" style={{ fontSize: 14 }}>
              {label}
            </Text>
            <Text variant="smallStrong" style={styles.detailValue}>
              {value}
            </Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

/** A thin rule for separating blocks inside a card. */
export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  group: { backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: 16, paddingVertical: 4 },
  divider: { height: 1, backgroundColor: colors.surfaceSoft },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 56 },
  rowText: { flex: 1, gap: 2 },
  value: { maxWidth: 150, textAlign: 'right' },
  detail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10 },
  detailValue: { fontSize: 14, flexShrink: 1, textAlign: 'right' },
});
