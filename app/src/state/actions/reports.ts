import { confirmReport, type ConfirmedValues } from '@lipidly/domain';
import { checkConsistency, type ConsistencyFlag } from '@lipidly/rules';
import { serverOp } from '@/services/api';
import { flush, mergeRecords } from '@/services/sync';
import { newId, today } from '../ids';
import { currentUserData, getState, isSyncedSession, updateUser } from '../store';
import type { DraftReport, Report } from '../types';

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
 * Confirms the draft: the server saves the report and runs the rule engine for escalation,
 * focus and the plan proposal, then returns the new records. Needs a connection; nothing is
 * saved before this (F2.4). The local developer account runs it on the phone.
 */
export async function confirmDraft(edited: ConfirmedValues): Promise<{ reportId: string; escalated: boolean }> {
  const data = currentUserData();
  const draft = data.draft;
  if (!draft || !data.profile) throw new Error('Nothing to confirm');
  const t = today();
  if (!isSyncedSession()) {
    let result = { reportId: '', escalated: false };
    updateUser((d) => {
      result = confirmReport(d, draft, edited, t, new Date().toISOString());
    });
    return result;
  }
  // The server needs the profile and earlier changes first.
  if (!(await flush())) throw new Error('No connection. Check your internet and try again.');
  const markers = edited.markers.filter((m) => Number.isFinite(m.value));
  const { fileUri: _local, ...stored } = draft;
  const res = await serverOp<{ reportId: string; escalated: boolean }>('confirmReport', {
    draft: { type: 'AWSJSON!', value: stored },
    edited: { type: 'AWSJSON!', value: { ...edited, markers } },
    today: { type: 'AWSDate!', value: t },
  });
  const userId = getState().session!.id;
  mergeRecords(userId, res.records);
  updateUser((d) => {
    d.draft = undefined;
  });
  return res.info;
}

/** Reports newest first, plus the one before a given report (for "change since"). */
export const previousReport = (reports: Report[], id: string): Report | undefined => {
  const i = reports.findIndex((r) => r.id === id);
  return i >= 0 ? reports[i + 1] : undefined;
};
