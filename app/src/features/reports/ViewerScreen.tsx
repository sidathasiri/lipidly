import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtDate } from '@/lib/format';
import { fileUrl } from '@/services/api';
import { useUserData } from '@/state/hooks';
import { Button, colors, DocumentPreview, Icon, IconButton, Tap, Text } from '@/ui';

/** The stored original file: pinch to zoom, page through (24, F2.8). */
export default function ViewerScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const data = useUserData();
  const doc = (id && data.reports.find((r) => r.id === id)) || data.draft || data.reports[0];
  const keys = doc?.fileKeys ?? [];
  const pages = Math.max(1, keys.length || (doc?.pageCount ?? 1));
  const [page, setPage] = useState(1);
  // Uploaded originals open through a 5-minute link; the photo just taken on this phone shows directly.
  const [remote, setRemote] = useState<{ key: string; url: string }>();
  const key = keys[page - 1];
  const local = page === 1 ? doc?.fileUri : undefined;
  useEffect(() => {
    if (!key || local) return;
    let live = true;
    fileUrl(key)
      .then((url) => live && setRemote({ key, url }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key, local]);
  const uri = local ?? (remote?.key === key ? remote.url : undefined);
  const isPdf = (key ?? doc?.fileUri ?? '').toLowerCase().endsWith('.pdf');
  const isImage = !!uri && !isPdf;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.top}>
        <IconButton kind="close" tone="dark" />
        <Text variant="title" color="white">
          {doc ? `${fmtDate(doc.collectionDate)} report` : 'Report'}
        </Text>
        <Button size="xs" variant="primaryDeep" onPress={() => uri && (isPdf ? Linking.openURL(uri) : Share.share({ url: uri }))} disabled={!uri} label={isPdf ? 'Open' : 'Share'} />
      </View>
      <ScrollView style={styles.zoom} contentContainerStyle={styles.zoomContent} maximumZoomScale={4} minimumZoomScale={1} centerContent>
        {isImage ? (
          <Image source={{ uri }} style={styles.image} contentFit="contain" accessibilityLabel={`Original report, page ${page}`} />
        ) : (
          <DocumentPreview dark label={`original file · page ${page}`} height={520} badge="" />
        )}
      </ScrollView>
      <View style={styles.pager}>
        <Tap onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} accessibilityLabel="Previous page" style={styles.arrow}>
          <Icon icon={ChevronLeft} color={page === 1 ? 'muted' : 'white'} />
        </Tap>
        <Text variant="bodyMedium" color="white">
          Page {page} of {pages}
        </Text>
        <Tap onPress={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} accessibilityLabel="Next page" style={styles.arrow}>
          <Icon icon={ChevronRight} color={page === pages ? 'muted' : 'white'} />
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 20, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zoom: { flex: 1 },
  zoomContent: { flexGrow: 1, justifyContent: 'center' },
  image: { width: '100%', height: 560, borderRadius: 16 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.darkSurface, alignItems: 'center', justifyContent: 'center' },
});
