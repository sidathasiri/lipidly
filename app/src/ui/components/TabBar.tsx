import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import { forwardRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../primitives/Icon';
import { Text } from '../primitives/Text';
import { colors, shadows, sizes } from '../theme';

/** Floating white pill holding the five tab buttons. */
export function TabBarContainer({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>{children}</View>
    </View>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: LucideIcon; label: string };

/** Active: 36×26 primary pill behind a white icon, label primary 11/800. Inactive: outline icon, muted label. */
export const TabButton = forwardRef<View, TabButtonProps>(function TabButton({ icon, label, isFocused, ...props }, ref) {
  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={label}
      style={styles.tab}
    >
      <View style={[styles.pill, isFocused && styles.pillActive]}>
        <Icon icon={icon} size={18} color={isFocused ? 'white' : 'tabInactive'} strokeWidth={isFocused ? 2.4 : 2} />
      </View>
      <Text variant="tabLabel" weight={isFocused ? 800 : 600} color={isFocused ? 'primary' : 'muted'}>
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 6, paddingHorizontal: 14 },
  bar: {
    height: sizes.tabBarHeight,
    borderRadius: sizes.tabBarHeight / 2,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    ...shadows.tabBar,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  pill: { width: 36, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: colors.primary },
});
