import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

/** Height to keep clear above the floating tab bar. */
export const TAB_BAR_SPACE = 66 + 24 + 6 + 16;

interface ScreenProps {
  children: ReactNode;
  /** Full-bleed block above the content (ColouredHeader). It handles the top safe area itself. */
  header?: ReactNode;
  /** Sticky bottom area for primary actions (stays within thumb reach). */
  footer?: ReactNode;
  scroll?: boolean;
  /** `onboarding` = 24px sides; `none` = edge to edge. */
  padding?: 'default' | 'onboarding' | 'none';
  background?: 'background' | 'primary' | 'ink' | 'surface';
  /** Leave room for the floating tab bar. */
  tabBar?: boolean;
  /** Gap between content blocks. */
  gap?: number;
  contentStyle?: StyleProp<ViewStyle>;
  keyboard?: boolean;
}

const BG = { background: colors.background, primary: colors.primary, ink: colors.ink, surface: colors.surface };

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  padding = 'default',
  background = 'background',
  tabBar,
  gap = 12,
  contentStyle,
  keyboard,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const px = padding === 'none' ? 0 : padding === 'onboarding' ? spacing.screenXOnboarding : spacing.screenX;
  const dark = background === 'primary' || background === 'ink';

  const body = (
    <View style={[{ paddingHorizontal: px, gap, paddingTop: header ? 14 : insets.top + 10 }, scroll ? null : styles.flex, contentStyle]}>
      {children}
    </View>
  );

  const bottomPad = tabBar ? TAB_BAR_SPACE + insets.bottom : footer ? 16 : insets.bottom + 24;

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: bottomPad, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {header}
      {body}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingBottom: footer ? 0 : bottomPad }]}>
      {header}
      {body}
    </View>
  );

  const inner = (
    <>
      {content}
      {footer && <View style={[styles.footer, { paddingHorizontal: px || spacing.screenX, paddingBottom: insets.bottom + 12 }]}>{footer}</View>}
    </>
  );

  return (
    <View style={[styles.flex, { backgroundColor: BG[background] }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {keyboard ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { paddingTop: 10, gap: 8 },
});
