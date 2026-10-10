import {
  HABIT_LIBRARY_VERSION,
  RULESET,
  addDays,
  habitById,
  normaliseValues,
  statusesOf,
  type IsoDate,
} from '@lipidly/rules';
import { appPlanHabit } from './actions/plan-builder';
import { newId, today } from './ids';
import { DEFAULT_REMINDERS, updateUser } from './store';
import type { Report, StoredMarker, UserData, UserProfile } from './types';

const mg = (marker: StoredMarker['marker'], value: number): StoredMarker => ({ marker, value, unit: 'mg/dL', extractedValue: value, edited: false });

/**
 * Loads the design's sample user (Nimal, two reports, an active plan, two medicines) into the
 * signed-in account, dated relative to today. For trying the app on a device.
 */
export function loadSampleData() {
  const t = today();
  const profile: UserProfile = {
    name: 'Nimal Perera',
    dateOfBirth: '1980-03-02',
    sex: 'male',
    pregnant: false,
    conditions: [],
    smokes: 'never',
    alcohol: 'sometimes',
    takesLipidMedicine: 'yes',
    heightCm: 170,
    weightKg: 77.5,
    lifestyle: {
      timeFree: '15to30',
      places: ['home', 'outdoors'],
      equipment: ['none'],
      physicalLimit: 'none',
      cooks: 'someoneElse',
      eatsOut: 'fewTimesAWeek',
      other: { equipment: ['Skipping rope'] },
    },
  };

  const makeReport = (date: IsoDate, markers: StoredMarker[]): Report => {
    const values = normaliseValues(markers);
    return {
      id: newId('rep_'),
      labName: 'Lanka Diagnostics',
      collectionDate: date,
      markers,
      source: 'camera',
      pageCount: 2,
      confirmedAt: `${date}T12:00:00.000Z`,
      values,
      statuses: statusesOf(values, 'male'),
    };
  };

  const sep = makeReport(addDays(t, -18), [mg('totalCholesterol', 222), mg('triglycerides', 286), mg('hdl', 38), mg('nonHdl', 184), mg('ldl', 127)]);
  const jun = makeReport(addDays(t, -118), [mg('totalCholesterol', 232), mg('triglycerides', 342), mg('hdl', 36), mg('nonHdl', 196), mg('ldl', 131)]);

  const doctorHabit = { id: newId('dh_'), text: 'Alcohol-free days', question: 'Was today alcohol-free?', conflictKeys: ['alcohol'] };
  const habits = ['no-sugary-drinks', 'half-rice-dinner', 'brisk-walk-30'].map((id) => appPlanHabit(habitById(id)!, true));
  const planHabits = [...habits, { id: `doc_${doctorHabit.id}`, source: 'doctor' as const, title: doctorHabit.text, question: doctorHabit.question, committed: true }];
  const ownHabit = { id: newId('own_'), title: 'Drink 8 glasses of water', question: 'Did you drink 8 glasses of water today?' };
  const startDate = addDays(t, -16);

  // Check-ins for the past two weeks: most days, with a gap three days ago.
  const checkIns: UserData['checkIns'] = {};
  for (let i = 1; i <= 15; i++) {
    if (i === 3 || i === 11) continue;
    const date = addDays(t, -i);
    checkIns[date] = { date, answers: Object.fromEntries([...planHabits, ownHabit].map((h, j) => [h.id, (i + j) % 4 !== 0])) };
  }

  const rxId = newId('rx_');
  const atorva = { id: newId('med_'), prescriptionId: rxId, name: 'Atorvastatin', strength: '10 mg', dose: '1 tablet', frequency: 'Once daily', timing: 'At night', duration: '30 days', times: ['21:00'], startDate: addDays(t, -9), active: true };
  const vitd = { id: newId('med_'), prescriptionId: rxId, name: 'Vitamin D3', strength: '1000 IU', dose: '1 capsule', frequency: 'Once daily', timing: 'After breakfast', duration: '30 days', times: ['08:00'], startDate: addDays(t, -9), active: true };

  updateUser((d) => ({
    ...d,
    consent: { policyVersion: 'privacy-2026-10', givenAt: new Date().toISOString() },
    profile,
    onboarded: true,
    reports: [sep, jun],
    draft: undefined,
    plans: [
      {
        id: newId('plan_'),
        status: 'active',
        startDate,
        focus: 'triglycerides',
        focusGroup: 'triglycerides',
        mode: 'active',
        retestDate: addDays(sep.collectionDate, 84),
        sourceReportId: sep.id,
        decision: 'keep',
        summary: 'Triglycerides went from 342 to 286 mg/dL, down 16%. Still high, so the focus stays the same.',
        suggestDoctor: false,
        habits: planHabits,
        ruleSetVersion: RULESET.version,
        libraryVersion: HABIT_LIBRARY_VERSION,
      },
    ],
    doctorHabits: [doctorHabit],
    ownHabits: [ownHabit],
    checkIns,
    prescriptions: [{ id: rxId, date: addDays(t, -9), doctor: 'Dr. S. Fernando', confirmedAt: new Date().toISOString() }],
    medicines: [atorva, vitd],
    doses: Array.from({ length: 7 }, (_, i) => [
      { id: newId('dose_'), medicineId: atorva.id, date: addDays(t, -(i + 1)), time: '21:00', outcome: i === 2 ? ('skipped' as const) : ('taken' as const) },
      { id: newId('dose_'), medicineId: vitd.id, date: addDays(t, -(i + 1)), time: '08:00', outcome: 'taken' as const },
    ]).flat(),
    appointments: [
      { id: newId('appt_'), dateTime: `${addDays(t, 69)}T10:30`, doctor: 'Dr. S. Fernando', note: 'Lipid clinic follow-up' },
      { id: newId('appt_'), dateTime: `${addDays(t, -9)}T09:00`, doctor: 'Dr. S. Fernando' },
    ],
    escalations: [],
    reminders: { ...DEFAULT_REMINDERS },
  }));
}
