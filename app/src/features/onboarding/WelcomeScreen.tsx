import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markWelcomeSeen } from '@/state/actions/onboarding';
import { Button, colors, Mascot, PageDots, Screen, Tap, Text } from '@/ui';

const SLIDES = [
  {
    title: 'Every lab report becomes a plan you can follow',
    body: 'Lipidly helps you build habits alongside your doctor’s plan. It is not medical advice and doesn’t diagnose or prescribe.',
  },
  {
    title: 'Two or three small habits that fit your day',
    body: 'Answer a one-minute check-in each evening. We only suggest habits you’ve said you can do.',
  },
  {
    title: 'Your doctor stays in charge',
    body: 'Your doctor’s instructions always come first. If a result needs a doctor, we’ll tell you plainly.',
  },
];

function Scene({ height }: { height: number }) {
  const k = height / 330;
  return (
    <View style={{ height, transform: [{ scale: k }], transformOrigin: 'top left', width: 340 }} accessible={false}>
      <View style={[styles.blob, { left: 50, top: 30, width: 240, height: 240, backgroundColor: colors.primaryDecor }]} />
      <View style={[styles.paper, { transform: [{ rotate: '-10deg' }] }]}>
        <View style={[styles.line, { width: 52, backgroundColor: colors.sky }]} />
        <View style={[styles.line, { width: 40, backgroundColor: colors.lilac }]} />
      </View>
      <View style={[styles.blob, { right: 16, top: 180, width: 96, height: 44, backgroundColor: colors.cyan, transform: [{ rotate: '8deg' }] }]} />
      <View style={[styles.blob, { right: 56, top: 40, width: 26, height: 26, backgroundColor: colors.lilac }]} />
      <View style={[styles.blob, { left: 70, bottom: 20, width: 16, height: 16, backgroundColor: colors.sky }]} />
      <View style={{ position: 'absolute', left: 113, top: 92 }}>
        <Mascot size={115} tone="cyan" />
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const sceneHeight = Math.min(330, Math.round(height * 0.3));
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const list = useRef<FlatList>(null);

  const finish = () => {
    markWelcomeSeen();
    router.replace('/auth/sign-up');
  };
  const next = () => {
    if (page < SLIDES.length - 1) list.current?.scrollToIndex({ index: page + 1 });
    else finish();
  };

  return (
    <Screen background="primary" scroll={false} padding="none" contentStyle={{ paddingTop: insets.top + 6 }}>
      <View style={styles.skipRow}>
        <Tap onPress={finish} accessibilityLabel="Skip" hitSlop={10}>
          <Text variant="bodyMedium" color="white">
            Skip
          </Text>
        </Tap>
      </View>
      <FlatList
        ref={list}
        style={{ flex: 1 }}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.title}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Scene height={sceneHeight} />
            <Text variant="displayL" color="white" accessibilityRole="header">
              {item.title}
            </Text>
            <Text variant="body" color="white" style={{ fontSize: 16, lineHeight: 24 }}>
              {item.body}
            </Text>
          </View>
        )}
      />
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <PageDots count={SLIDES.length} active={page} />
        <Button label={page < SLIDES.length - 1 ? 'Next' : 'Let’s go'} variant="onPrimary" onPress={next} />
        <Button
          label="I already have an account"
          variant="link"
          onPress={() => {
            markWelcomeSeen();
            router.replace('/auth/sign-in');
          }}
          style={{ alignSelf: 'center' }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24 },
  slide: { paddingHorizontal: 24, gap: 22 },
  blob: { position: 'absolute', borderRadius: 999 },
  paper: {
    position: 'absolute',
    left: 12,
    top: 40,
    width: 84,
    height: 110,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingTop: 26,
    paddingLeft: 14,
    gap: 12,
  },
  line: { height: 6, borderRadius: 3 },
  bottom: { paddingHorizontal: 24, gap: 18 },
});
