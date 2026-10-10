import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { Zap, ZapOff } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, colors, Icon, IconButton, Screen, ScreenState, StepPill, Tap, Text } from '@/ui';

/** Camera with corner guides; take one photo per page, then Done (17). */
export default function CaptureScreen() {
  const { kind = 'report' } = useLocalSearchParams<{ kind?: string }>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [pages, setPages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (!permission) return <Screen background="ink">{null}</Screen>;
  if (!permission.granted) {
    return (
      <Screen background="ink">
        <IconButton kind="close" tone="dark" />
        <ScreenState
          kind="empty"
          title="Camera access needed"
          message="Lipidly uses the camera only to photograph your report or prescription. You can also choose a photo or a PDF instead."
          actionLabel={permission.canAskAgain ? 'Allow camera' : 'Go back'}
          onAction={permission.canAskAgain ? requestPermission : () => router.back()}
        />
      </Screen>
    );
  }

  const shoot = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const photo = await camera.current?.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) setPages((p) => [...p, photo.uri]);
    } finally {
      setBusy(false);
    }
  };

  const done = () =>
    router.replace({ pathname: '/reading', params: { kind, source: 'camera', uris: JSON.stringify(pages) } });

  return (
    <View style={styles.root}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} onCameraReady={() => setReady(true)} />
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <IconButton kind="close" tone="dark" />
        <StepPill tone="dark" label={`Page ${pages.length + 1}`} />
        <Tap onPress={() => setTorch((t) => !t)} style={styles.pill} accessibilityLabel={torch ? 'Turn flash off' : 'Turn flash on'}>
          <Icon icon={torch ? Zap : ZapOff} size={16} color="white" />
          <Text variant="smallStrong" color="white">
            {torch ? 'Flash on' : 'Flash off'}
          </Text>
        </Tap>
      </View>

      <View style={styles.guideArea} pointerEvents="none">
        <View style={styles.guide}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text variant="bodyMedium" color="white" align="center">
          Fit the whole page inside the corners
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <View style={{ width: 90 }}>
          {pages.length > 0 && (
            <Text variant="smallStrong" color="white">
              {pages.length} {pages.length === 1 ? 'page' : 'pages'}
            </Text>
          )}
        </View>
        <Tap onPress={shoot} accessibilityLabel="Take photo" disabled={!ready || busy} style={styles.shutterRing}>
          <View style={styles.shutter} />
        </Tap>
        <View style={{ width: 90, alignItems: 'flex-end' }}>
          <Button label="Done" size="xs" variant="onPrimary" onPress={done} disabled={pages.length === 0} />
        </View>
      </View>
    </View>
  );
}

const C = 34;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.darkSurface, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  guideArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 34, gap: 16 },
  guide: { aspectRatio: 0.72, width: '100%' },
  corner: { position: 'absolute', width: C, height: C, borderColor: colors.primaryOnDark },
  tl: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 14 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  shutterRing: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: colors.primaryOnDark, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.white },
});
