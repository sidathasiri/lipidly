import { MARKER_LABELS, SEVERITY, STATUS_LABELS, type MarkerId, type Status } from '@lipidly/rules';
import type { Report } from '@/state/types';

/** Display order on result screens. */
export const MARKER_ORDER: MarkerId[] = ['triglycerides', 'nonHdl', 'totalCholesterol', 'hdl', 'ldl', 'vldl', 'tcHdlRatio'];

export const orderedMarkers = (r: Report) =>
  [...r.markers].sort((a, b) => MARKER_ORDER.indexOf(a.marker) - MARKER_ORDER.indexOf(b.marker));

/** "Triglycerides high" for the worst marker, plus how many are out of range. */
export function reportHeadline(r: Report): { worst?: { marker: MarkerId; status: Status; label: string }; outOfRange: number } {
  const entries = (Object.entries(r.statuses) as [MarkerId, Status][]).filter(([, s]) => s !== 'inRange');
  const worst = entries.sort((a, b) => SEVERITY[b[1]] - SEVERITY[a[1]] || MARKER_ORDER.indexOf(a[0]) - MARKER_ORDER.indexOf(b[0]))[0];
  return {
    worst: worst && { marker: worst[0], status: worst[1], label: `${MARKER_LABELS[worst[0]]} ${STATUS_LABELS[worst[1]].toLowerCase()}` },
    outOfRange: entries.length,
  };
}

export const unitLabel = (m: MarkerId) => (m === 'tcHdlRatio' ? '' : 'mg/dL');
