import { useLocalSearchParams } from 'expo-router';
import { LEARN_ARTICLES } from '@/content/markers';
import { Screen, ScreenState, Text, TopBar } from '@/ui';

/** Short approved articles linked from the no-report Home. */
export default function LearnScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const article = LEARN_ARTICLES[slug];
  return (
    <Screen topBar={<TopBar />} gap={12}>
      {article ? (
        <>
          <Text variant="h1" accessibilityRole="header">
            {article.title}
          </Text>
          {article.body.map((p) => (
            <Text key={p} variant="body" color="inkSoft">
              {p}
            </Text>
          ))}
        </>
      ) : (
        <ScreenState kind="error" title="Article not found" />
      )}
    </Screen>
  );
}
