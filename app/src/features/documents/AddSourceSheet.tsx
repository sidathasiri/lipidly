import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, FileUp, Images, PenLine } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { startManualDraft } from '@/state/actions/reports';
import { Sheet, SourceTile, Text } from '@/ui';

export type DocKind = 'report' | 'prescription';

const COPY: Record<DocKind, { title: string; sub: string; foot: string }> = {
  report: {
    title: 'Add a lab report',
    sub: 'Any lipid profile report. Multi-page PDFs are fine.',
    foot: 'Got the report by email or WhatsApp? Use Share → Lipidly from that app.',
  },
  prescription: {
    title: 'Add a prescription',
    sub: 'A prescription or a pharmacy label. We’ll read each medicine for you to check.',
    foot: 'Handwriting can be hard to read. Anything unclear is left blank for you to fill in.',
  },
};

/** Choose a source: camera, photos, file, or enter by hand (16, 26). */
export function AddSourceSheet({ kind }: { kind: DocKind }) {
  const copy = COPY[kind];

  const toReading = (uri: string | undefined, source: 'photo' | 'pdf') =>
    router.replace({ pathname: '/reading', params: { kind, source, uri: uri ?? '' } });

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled) toReading(res.assets[0]?.uri, 'photo');
  };
  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!res.canceled) toReading(res.assets[0]?.uri, 'pdf');
  };
  const byHand = () => {
    if (kind === 'report') {
      startManualDraft();
      router.replace('/reports/confirm');
    } else {
      router.replace('/medicines/manual');
    }
  };

  return (
    <Sheet>
      <Text variant="h1" style={{ fontSize: 28 }} accessibilityRole="header">
        {copy.title}
      </Text>
      <Text variant="body" color="muted">
        {copy.sub}
      </Text>
      <View style={styles.grid}>
        <View style={styles.row}>
          <SourceTile icon={Camera} tone="primary" label="Take a photo" onPress={() => router.replace({ pathname: '/capture', params: { kind } })} style={styles.tile} />
          <SourceTile icon={Images} tone="sky" label="Choose from photos" onPress={pickPhoto} style={styles.tile} />
        </View>
        <View style={styles.row}>
          <SourceTile icon={FileUp} tone="lilac" label="Upload a PDF" onPress={pickPdf} style={styles.tile} />
          <SourceTile icon={PenLine} tone="tint" label="Enter by hand" onPress={byHand} style={styles.tile} />
        </View>
      </View>
      <Text variant="small" weight={400} color="muted">
        {copy.foot}
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1 },
});
