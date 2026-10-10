import { canEditCheckIn, habitById, type IsoDate } from '@lipidly/rules';
import type { ExtractedPrescription } from '@/services/extraction';
import { newId, today } from '../ids';
import { updateUser } from '../store';
import type { Appointment, DoseEvent, Medicine, ReminderSettings } from '../types';

// ── Check-ins ─────────────────────────────────────────────────────────────────

/** Saves a day's check-in. Today and the previous two days can be filled in (F5.3). */
export function saveCheckIn(date: IsoDate, answers: Record<string, boolean>, weightKg?: number) {
  if (!canEditCheckIn(date, today())) return;
  updateUser((d) => {
    d.checkIns[date] = { date, answers, weightKg: weightKg ?? d.checkIns[date]?.weightKg };
  });
}

// ── Medicines ─────────────────────────────────────────────────────────────────

export interface ConfirmedPrescription {
  doctor: string;
  date: IsoDate;
  medicines: ExtractedPrescription['medicines'];
  /** Doctor's lifestyle instruction, added as a doctor habit when the toggle is on (F7.8). */
  doctorInstruction?: ExtractedPrescription['doctorInstruction'];
  followUp?: string;
}

export function confirmPrescription(rx: ConfirmedPrescription) {
  updateUser((d) => {
    const prescriptionId = newId('rx_');
    d.prescriptions.push({ id: prescriptionId, date: rx.date, doctor: rx.doctor, confirmedAt: new Date().toISOString() });
    for (const m of rx.medicines) {
      d.medicines.push({ ...m, id: newId('med_'), prescriptionId, startDate: today(), active: true });
    }
    if (rx.doctorInstruction) {
      const instr = rx.doctorInstruction;
      const dh = { id: newId('dh_'), text: instr.text, question: instr.question, conflictKeys: instr.conflictKeys };
      d.doctorHabits.push(dh);
      const plan = d.plans.find((p) => p.status === 'active');
      if (plan) {
        // Doctor habits replace any app habit they conflict with (F4.5).
        plan.habits = plan.habits.filter((h) => !(h.habitId && instr.conflictKeys.includes(habitById(h.habitId)?.conflictKey ?? '')));
        plan.habits.push({ id: `doc_${dh.id}`, source: 'doctor', title: dh.text, question: dh.question, committed: true });
      }
    }
    if (rx.followUp) d.appointments.push({ id: newId('appt_'), dateTime: rx.followUp, doctor: rx.doctor });
  });
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
