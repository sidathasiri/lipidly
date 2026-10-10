import { Alert } from 'react-native';

/**
 * "Report a problem" on any AI-produced screen (F11.5). Mocked until the backend exists;
 * the real version sends the screen context (not health values) to the review queue.
 */
export function reportProblem(context: 'extraction' | 'prescription' | 'explanation') {
  Alert.alert(
    'Report a problem',
    context === 'explanation' ? 'Tell us if something here looks wrong.' : 'Did we read something wrong? Our team will review this upload.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send report', onPress: () => Alert.alert('Thank you', 'We’ll look into it.') },
    ],
  );
}
