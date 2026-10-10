import { confirmPrescription as applyPrescription } from '@lipidly/domain';
import { canEditCheckIn, type IsoDate } from '@lipidly/rules';
import { serverOp } from '@/services/api';
import { flush, mergeRecords } from '@/services/sync';
import { newId, today } from '../ids';
import { getState, isSyncedSession, updateUser } from '../store';
import type { Appointment, DoseEvent, ExtractedPrescription, Medicine, ReminderSettings } from '../types';

// ── Check-ins ─────────────────────────────────────────────────────────────────

/** Saves a day's check-in. Today and the previous two days can be filled in (F5.3). */
export function saveCheckIn(date: IsoDate, answers: Record<string, boolean>, weightKg?: number) {
  if (!canEditCheckIn(date, today())) return;
  updateUser((d) => {
    d.checkIns[date] = { date, answers, weightKg: weightKg ?? d.checkIns[date]?.weightKg };
  });
}

// ── Medicines ─────────────────────────────────────────────────────────────────

/** Doctor, medicines, the doctor's habit (when the toggle is on, F7.8) and the follow-up visit, as confirmed. */
export type ConfirmedPrescription = ExtractedPrescription;

/**
 * Saves a confirmed prescription. The server adds the doctor habit to the plan and returns the
 * records; needs a connection. The local developer account saves it on the phone.
 */
export async function confirmPrescription(rx: ConfirmedPrescription) {
  const t = today();
  if (!isSyncedSession()) {
    updateUser((d) => applyPrescription(d, rx, t, new Date().toISOString()));
    return;
  }
  if (!(await flush())) throw new Error('No connection. Check your internet and try again.');
  const res = await serverOp('confirmPrescription', { prescription: { type: 'AWSJSON!', value: rx }, today: { type: 'AWSDate!', value: t } });
  mergeRecords(getState().session!.id, res.records);
}

export function addMedicine(m: Omit<Medicine, 'id' | 'startDate' | 'active'>) {
  updateUser((d) => {
    d.medicines.push({ ...m, id: newId('med_'), startDate: today(), active: true });
  });
}

export function stopMedicine(id: string) {
  updateUser((d) => {
    const m = d.medicines.find((x) => x.id === id);
    if (m) m.active = false;
  });
}

/** Taken / Skipped / Snooze for one scheduled dose (F7.6). */
export function recordDose(medicineId: string, date: IsoDate, time: string, outcome: DoseEvent['outcome']) {
  updateUser((d) => {
    d.doses = d.doses.filter((x) => !(x.medicineId === medicineId && x.date === date && x.time === time));
    d.doses.push({ id: newId('dose_'), medicineId, date, time, outcome });
  });
}

// ── Appointments ──────────────────────────────────────────────────────────────

export function addAppointment(a: Omit<Appointment, 'id'>) {
  updateUser((d) => {
    d.appointments.push({ ...a, id: newId('appt_') });
  });
}

export function deleteAppointment(id: string) {
  updateUser((d) => {
    d.appointments = d.appointments.filter((a) => a.id !== id);
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function updateReminders(patch: Partial<ReminderSettings>) {
  updateUser((d) => {
    d.reminders = { ...d.reminders, ...patch };
  });
}
