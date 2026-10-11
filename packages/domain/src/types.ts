import type {
  Escalation,
  FocusGroup,
  FocusMarker,
  IsoDate,
  MarkerId,
  MarkerValues,
  Mode,
  PlanDecision,
  Profile,
  Status,
  Unit,
} from '@lipidly/rules';

/**
 * Lipidly's data model. The phone keeps a `UserData` per signed-in user; the backend stores the
 * same data as one DynamoDB item per record (see `records.ts`).
 */

export interface Account {
  id: string;
  email: string;
  name: string;
  provider: 'password' | 'google';
  verified: boolean;
}

export interface UserProfile extends Profile {
  name: string;
  heightCm?: number;
  weightKg?: number;
  takesLipidMedicine: 'yes' | 'no' | 'notSure';
  /** Meal-plan preferences (spec F13). Missing until the user answers them. */
  food?: FoodPreferences;
}

export type DietType = 'everything' | 'vegetarian' | 'vegan' | 'pescatarian';

export interface FoodPreferences {
  /** Option values (`sriLankan`, `western`) or the user's own words, e.g. "Thai". */
  cuisines: string[];
  dietType: DietType;
  /** Option values (`beef`, `pork`, …) or the user's own words. */
  avoid: string[];
  /** Optional free text for the meal writer, e.g. "I like spicy food, no mushrooms". */
  notes?: string;
  /** How many people the meals are cooked for; recipes and the shopping list scale to it. Missing = 1. */
  people?: number;
}

// ── Meal plans (spec F13) ─────────────────────────────────────────────────────

export type MealSlot = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner';

export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'clove' | 'slice' | 'bunch' | 'pinch' | 'to taste';

export type ShoppingCategory = 'vegetables' | 'fruit' | 'grains' | 'protein' | 'dairy' | 'pantry' | 'spices';

export interface Ingredient {
  /** Plain shopping name, lower case and singular, e.g. "red onion". */
  name: string;
  quantity: number;
  unit: IngredientUnit;
  category: ShoppingCategory;
}

export interface Meal {
  slot: MealSlot;
  title: string;
  /** One line on what it is and why it suits the plan. */
  summary: string;
  minutes: number;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
}

export interface MealDay {
  date: IsoDate;
  meals: Meal[];
}

export interface MealPlan {
  id: string;
  weekStart: IsoDate;
  createdAt: string;
  days: MealDay[];
}

export interface StoredMarker {
  marker: MarkerId;
  /** Confirmed value, in `unit`. */
  value: number;
  unit?: Unit;
  /** What extraction read, kept beside the confirmed value. */
  extractedValue?: number;
  edited: boolean;
}

export type ReportSource = 'camera' | 'photo' | 'pdf' | 'manual';

export interface DraftReport {
  id: string;
  labName: string;
  collectionDate: IsoDate;
  markers: StoredMarker[];
  source: ReportSource;
  /** Local file on this phone (camera or picker), for the preview while confirming. */
  fileUri?: string;
  /** Uploaded originals in S3 (users/<sub>/reports/…), viewable later through a short-lived link. */
  fileKeys?: string[];
  pageCount: number;
}

export interface Report extends DraftReport {
  confirmedAt: string;
  /** Normalised to mg/dL for the rule engine. */
  values: MarkerValues;
  statuses: Partial<Record<MarkerId, Status>>;
}

export interface PlanHabit {
  id: string;
  /** `own` = a habit the user added (F4.15); never used by the plan rules. */
  source: 'app' | 'doctor' | 'own';
  /** Library habit (app habits). */
  habitId?: string;
  title: string;
  question: string;
  committed: boolean;
  reminderTime?: string;
}

export interface Plan {
  id: string;
  status: 'proposed' | 'active' | 'past';
  startDate: IsoDate;
  focus: FocusMarker | null;
  focusGroup: FocusGroup | null;
  mode: Mode;
  retestDate: IsoDate;
  sourceReportId: string;
  decision: PlanDecision;
  summary: string;
  suggestDoctor: boolean;
  habits: PlanHabit[];
  ruleSetVersion: string;
  libraryVersion: string;
  lastSwap?: IsoDate;
  /** Set when this plan follows an escalation: doctor habits only, no app habits. */
  escalationId?: string;
}

/** A habit the user adds themselves (spec F4.15–F4.17). Kept per user so it carries over between plans. */
export interface OwnHabit {
  id: string;
  title: string;
  question: string;
  reminderTime?: string;
}

export interface DoctorHabit {
  id: string;
  text: string;
  question: string;
  /** App habits this instruction replaces (F4.5). */
  conflictKeys: string[];
}

export interface CheckIn {
  date: IsoDate;
  /** Answer per plan-habit ID. */
  answers: Record<string, boolean>;
  weightKg?: number;
}

export interface Prescription {
  id: string;
  date: IsoDate;
  doctor?: string;
  fileKeys?: string[];
  confirmedAt: string;
}

/** A medicine line as read from a prescription. Empty strings = couldn't read it; never guessed (F7.4). */
export interface ExtractedMedicine {
  name: string;
  strength: string;
  dose: string;
  frequency: string;
  timing: string;
  duration: string;
  /** Dose times, `HH:mm`. */
  times: string[];
}

export interface DoctorInstruction {
  text: string;
  question: string;
  /** App habits this instruction covers, e.g. "alcohol". */
  conflictKeys: string[];
}

export interface ExtractedPrescription {
  doctor: string;
  date: IsoDate;
  medicines: ExtractedMedicine[];
  doctorInstruction?: DoctorInstruction;
  /** Follow-up visit, local `YYYY-MM-DDTHH:mm`. */
  followUp?: string;
  fileKeys?: string[];
}

export interface Medicine {
  id: string;
  prescriptionId?: string;
  name: string;
  strength: string;
  dose: string;
  frequency: string;
  timing: string;
  duration: string;
  /** Dose times, `HH:mm`. */
  times: string[];
  startDate: IsoDate;
  active: boolean;
}

export interface DoseEvent {
  id: string;
  medicineId: string;
  date: IsoDate;
  time: string;
  outcome: 'taken' | 'skipped' | 'snoozed';
}

export interface Appointment {
  id: string;
  /** Local date and time, `YYYY-MM-DDTHH:mm`. */
  dateTime: string;
  doctor: string;
  note?: string;
}

export interface EscalationRecord extends Escalation {
  id: string;
  date: IsoDate;
  reportId?: string;
  acknowledgedAt?: string;
}

export interface ReminderSettings {
  checkInEnabled: boolean;
  checkInTime: string;
  habitNudges: boolean;
  meals: boolean;
  retest: boolean;
  weeklySummary: boolean;
  comeBack: boolean;
  quietStart: string;
  quietEnd: string;
}

export interface Consent {
  policyVersion: string;
  givenAt: string;
  withdrawnAt?: string;
}

/** Everything stored for one signed-in user. */
export interface UserData {
  consent?: Consent;
  profile?: UserProfile;
  /** Onboarding finished (lifestyle answered and first-report step passed). */
  onboarded: boolean;
  reports: Report[];
  draft?: DraftReport;
  plans: Plan[];
  doctorHabits: DoctorHabit[];
  /** Missing in data saved before own habits existed; read through `ownHabitsOf`. */
  ownHabits?: OwnHabit[];
  checkIns: Record<IsoDate, CheckIn>;
  prescriptions: Prescription[];
  medicines: Medicine[];
  doses: DoseEvent[];
  appointments: Appointment[];
  escalations: EscalationRecord[];
  reminders: ReminderSettings;
  /** "Remind me to get tested" from the no-report state. */
  testReminder?: IsoDate;
  /** The current week of meal ideas (only the latest is kept). Missing in older data. */
  mealPlans?: MealPlan[];
  /** Shopping-list items ticked off, per meal plan ID. */
  shoppingChecked?: Record<string, string[]>;
}
