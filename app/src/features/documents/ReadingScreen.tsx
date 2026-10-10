import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { extractPrescription, extractReport, type ExtractionStep } from '@/services/extraction';
import { setDraft } from '@/state/actions/reports';
import { useUserData } from '@/state/hooks';
import type { ReportSource } from '@/state/types';
import { Button, Callout, colors, Mascot, ProgressBar, Screen, Text } from '@/ui';
import { setPendingPrescription } from '../medicines/pendingPrescription';

const STEPS: Record<'report' | 'prescription', { key: ExtractionStep; label: string }[]> = {
  report: [
    { key: 'uploading', label: 'Found the lab and collection date' },
    { key: 'reading', label: 'Found the lipid profile' },
    { key: 'checking', label: 'Reading each value and unit' },
  ],
  prescription: [
    { key: 'uploading', label: 'Found the doctor and date' },
    { key: 'reading', label: 'Found each medicine line' },
    { key: 'checking', label: 'Reading strength, dose and timing' },
  ],
};
const ORDER: ExtractionStep[] = ['uploading', 'reading', 'checking'];

/** Waiting for extraction: progress, step rows, Cancel (18). */
export default function ReadingScreen() {
  const params = useLocalSearchParams<{ kind?: string; source?: string; uri?: string; pages?: string }>();
  const kind = params.kind === 'prescription' ? 'prescription' : 'report';
  const existing = useUserData().reports.length;
  const [step, setStep] = useState<ExtractionStep>('uploading');
  const [progress, setProgress] = useState(0.05);
  const [error, setError] = useState(false);
  const abort = useRef<AbortController | null>(null);

  const start = () => {
    abort.current = new AbortController();
    const onStep = (s: ExtractionStep, p: number) => {
      setStep(s);
      setProgress(p);
    };
    const job =
      kind === 'report'
        ? extractReport({ source: (params.source as ReportSource) ?? 'camera', fileUri: params.uri || undefined, pageCount: Number(params.pages) || undefined, existingReports: existing }, onStep, abort.current.signal).then((draft) => {
            setDraft(draft);
            router.replace('/reports/confirm');
          })
        : extractPrescription(onStep, abort.current.signal).then((rx) => {
            setPendingPrescription(rx);
            router.replace('/medicines/confirm');
          });
    job.catch((e: Error) => {
      if (e.message !== 'cancelled') setError(true);
    });
  };

  const retry = () => {
    setError(false);
    start();
  };

  useEffect(() => {
    start();
    return () => abort.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = ORDER.indexOf(step);

  return (
    <Screen
      scroll={false}
      padding="onboarding"
      gap={20}
      contentStyle={{ paddingTop: 110 }}
      footer={
        <Button
          label="Cancel"
          variant="secondary"
          onPress={() => {
            abort.current?.abort();
            router.back();
          }}
        />
      }
    >
      <View style={styles.scene} accessible={false}>
        <View style={styles.halo} />
        <View style={styles.paper}>
          <View style={[styles.line, { width: 64, backgroundColor: colors.sky }]} />
          <View style={[styles.line, { width: 50, backgroundColor: colors.lilac }]} />
          <View style={[styles.line, { width: 58, backgroundColor: colors.cyan }]} />
        </View>
        <View style={styles.mascot}>
          <Mascot size={72} mood="surprised" />
        </View>
      </View>
      {error ? (
        <>
          <Text variant="h1" align="center">
            We couldn't read this one
          </Text>
          <Callout tone="soft">Try a clearer photo in good light, upload the PDF, or enter the values by hand.</Callout>
          <Button label="Try again" onPress={retry} />
        </>
      ) : (
        <>
          <Text variant="h1" align="center" accessibilityRole="header" accessibilityLiveRegion="polite">
            {kind === 'report' ? 'Reading your report…' : 'Reading your prescription…'}
          </Text>
          <ProgressBar value={progress} height={14} track={colors.line} accessibilityLabel="Reading progress" />
          <View style={{ gap: 12 }}>
            {STEPS[kind].map((s, i) => (
              <View key={s.key} style={styles.step}>
                {i < current ? (
                  <View style={styles.done}>
                    <Text variant="smallStrong" color="white">
                      {'✓'}
                    </Text>
                  </View>
                ) : i === current ? (
                  <ActivityIndicator color={colors.primary} style={{ width: 26 }} />
                ) : (
                  <View style={styles.todo} />
                )}
                <Text variant="bodyMedium" color={i <= current ? 'ink' : 'subtle'} style={{ fontSize: 16 }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
          <Text variant="small" weight={400} color="muted" align="center">
            Usually under 20 seconds. You'll check every value next.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scene: { height: 200, width: 260, alignSelf: 'center' },
  halo: { position: 'absolute', left: 40, top: 10, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.primaryTint },
  paper: {
    position: 'absolute',
    left: 70,
    top: 30,
    width: 100,
    height: 130,
    borderRadius: 14,
    backgroundColor: colors.white,
    transform: [{ rotate: '-6deg' }],
    paddingTop: 26,
    paddingLeft: 16,
    gap: 12,
  },
  line: { height: 6, borderRadius: 3 },
  mascot: { position: 'absolute', left: 150, top: 100 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  done: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  todo: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.line },
});
