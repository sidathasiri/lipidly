import { StyleSheet, View } from 'react-native';
import { ColouredHeader, Mascot, Text, type MascotMood } from '@/ui';

/** Tinted header with a large title and the mascot, shared by every sign-in screen (from design 02). */
export function AuthHeader({ title, mood = 'happy', back }: { title: string; mood?: MascotMood; back?: boolean }) {
  return (
    <ColouredHeader tone="tint" left={back ? 'back' : undefined} paddingBottom={28}>
      <View style={styles.row}>
        <Text variant="displayL" style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Mascot size={72} mood={mood} />
      </View>
    </ColouredHeader>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 16, paddingHorizontal: 4, gap: 12 },
  title: { flex: 1, fontSize: 32, lineHeight: 34, maxWidth: 240 },
});
