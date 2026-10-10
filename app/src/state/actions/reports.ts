import { assessReport, checkConsistency, normaliseValues, statusesOf, type ConsistencyFlag } from '@lipidly/rules';
import { newId, today } from '../ids';
import { currentUserData, updateUser } from '../store';
import type { DraftReport, Report, StoredMarker } from '../types';
import { applyOutcome, previousCycle } from './plan-builder';

export function setDraft(draft: DraftReport | undefined) {
  updateUser((d) => {
    d.draft = draft;
  });
}

/** A blank draft for "Enter values by hand". */
export function startManualDraft() {
  setDraft({
    id: newId('draft_'),
    labName: '',
    collectionDate: today(),
    markers: (['totalCholesterol', 'triglycerides', 'hdl', 'ldl', 'nonHdl'] as const).map((marker) => ({ marker, value: NaN, unit: 'mg/dL', edited: true })),
    source: 'manual',
    pageCount: 0,
  });
}

export const draftFlags = (draft: DraftReport): ConsistencyFlag[] =>
  checkConsistency(
    draft.markers.filter((m) => Number.isFinite(m.value)).map(({ marker, value, unit }) => ({ marker, value, unit })),
    draft.collectionDate,
    today(),
  );

/**
 * Confirms the draft: saves the report, then runs the rule engine for escalation, focus and the
 * plan proposal. Nothing is saved before this (F2.4).
 */
export function confirmDraft(edited: { labName: string; collectionDate: string; markers: StoredMarker[] }): { reportId: string; escalated: boolean } {
  const data = currentUserData();
  const draft = data.draft;
  if (!draft || !data.profile) throw new Error('Nothing to confirm');
  const markers = edited.markers.filter((m) => Number.isFinite(m.value));
  const values = normaliseValues(markers.map(({ marker, value, unit }) => ({ marker, value, unit })));
  const report: Report = {
    ...draft,
    labName: edited.labName.trim() || 'Lab report',
    collectionDate: edited.collectionDate,
    markers,
    confirmedAt: new Date().toISOString(),
    values,
    statuses: statusesOf(values, data.profile.sex),
  };
  const outcome = assessReport({ values, collectionDate: report.collectionDate, profile: data.profile, previous: previousCycle(data) });

  updateUser((d) => {
    d.reports.push(report);
    d.reports.sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));
    d.draft = undefined;
    applyOutcome(d, report, outcome);
  });
  return { reportId: report.id, escalated: outcome.kind === 'escalation' };
}

/** Reports newest first, plus the one before a given report (for "change since"). */
export const previousReport = (reports: Report[], id: string): Report | undefined => {
  const i = reports.findIndex((r) => r.id === id);
  return i >= 0 ? reports[i + 1] : undefined;
};
