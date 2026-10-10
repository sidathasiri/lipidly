import { create } from 'zustand';
import type { ExtractedPrescription } from '@/state/types';

/**
 * Extraction result held in memory between "reading" and "confirm". Never persisted:
 * nothing is saved until the user confirms (F7.3).
 */
const usePending = create<{ rx?: ExtractedPrescription }>(() => ({}));

export const setPendingPrescription = (rx: ExtractedPrescription | undefined) => usePending.setState({ rx });
export const usePendingPrescription = () => usePending((s) => s.rx);
