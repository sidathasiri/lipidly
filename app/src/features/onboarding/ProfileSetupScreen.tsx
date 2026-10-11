import { ineligibleReason, type HealthCondition } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { fmtDate } from '@/lib/format';
import { currentAccount } from '@/state/actions/auth';
import { saveProfile } from '@/state/actions/onboarding';
import { useUserData } from '@/state/hooks';
import { today } from '@/state/ids';
import type { UserProfile } from '@/state/types';
import { Button, ChipGroup, DateField, ProgressBar, Screen, Section, Text, TextField, TopBar } from '@/ui';
import {
  ALCOHOL_OPTIONS,
  CONDITION_OPTIONS,
  DEFAULT_LIFESTYLE,
  MEDICINE_OPTIONS,
  SEX_OPTIONS,
  SMOKING_OPTIONS,
} from './options';

const STEPS = 4;
/** The onboarding progress bar has 6 segments: 4 profile steps, lifestyle, first report. */
const SEGMENTS = 6;

/**
 * Short profile in four steps (F1.4, F1.5). Used for onboarding and, with `edit=1`,
 * from Profile. Eligibility is checked as soon as the answer that decides it is given.
 */
export default function ProfileSetupScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const existing = useUserData().profile;
  const [step, setStep] = useState(0);
  const [p, setP] = useState<UserProfile>(
    existing ?? {
      name: currentAccount()?.name ?? '',
      dateOfBirth: '',
      sex: 'male',
      pregnant: false,
      conditions: [],
      smokes: 'never',
      alcohol: 'never',
      takesLipidMedicine: 'no',
      lifestyle: DEFAULT_LIFESTYLE,
    },
  );
  const [noneSelected, setNoneSelected] = useState(!!existing && existing.conditions.length === 0);
  const [height, setHeight] = useState(existing?.heightCm ? String(existing.heightCm) : '');
  const [weight, setWeight] = useState(existing?.weightKg ? String(existing.weightKg) : '');
  const set = (patch: Partial<UserProfile>) => setP((x) => ({ ...x, ...patch }));

  const complete = (): UserProfile => ({ ...p, heightCm: Number(height) || undefined, weightKg: Number(weight) || undefined });

  const next = () => {
    const profile = complete();
    if ((step === 0 || step === 1) && profile.dateOfBirth && ineligibleReason(profile, today())) {
      saveProfile(profile);
      router.replace('/onboarding/not-eligible');
      return;
    }
    if (step < STEPS - 1) return setStep(step + 1);
    saveProfile(profile);
    if (editing) router.back();
    else router.replace('/onboarding/lifestyle');
  };

  const canContinue = [
    p.name.trim().length > 0 && !!p.dateOfBirth,
    true,
    true,
    noneSelected || p.conditions.length > 0,
  ][step];

  return (
    <Screen
      topBar={
        <TopBar
          left="back"
          onLeft={() => (step > 0 ? setStep(step - 1) : router.canGoBack() ? router.back() : undefined)}
          center={<ProgressBar segments={SEGMENTS} filled={step + 1} accessibilityLabel={`Step ${step + 1} of ${SEGMENTS}`} />}
        />
      }
      padding="onboarding"
      gap={20}
      keyboard
      footer={<Button label={step === STEPS - 1 ? (editing ? 'Save' : 'Continue') : 'Continue'} onPress={next} disabled={!canContinue} />}
    >
      {step === 0 && (
        <>
          <Text variant="h1" accessibilityRole="header">
            About you
          </Text>
          <TextField label="Your name" value={p.name} onChangeText={(name) => set({ name })} autoComplete="name" placeholder="First and last name" />
          <DateField
            label="Date of birth"
            mode="date"
            value={p.dateOfBirth || undefined}
            display={p.dateOfBirth ? fmtDate(p.dateOfBirth) : ''}
            placeholder="Choose a date"
            initial="1985-01-01"
            maximumDate={today()}
            onChange={(dateOfBirth) => set({ dateOfBirth })}
          />
          <Text variant="small" weight={400} color="muted">
            Lipidly is for adults aged 18 and over.
          </Text>
        </>
      )}

      {step === 1 && (
        <>
          <Text variant="h1" accessibilityRole="header">
            A little more about you
          </Text>
          <Section title="Sex">
            <ChipGroup options={SEX_OPTIONS} value={[p.sex]} onChange={([sex]) => set({ sex: sex!, pregnant: sex === 'male' ? false : p.pregnant })} layout="grid" />
          </Section>
          {p.sex !== 'male' && (
            <Section title="Are you pregnant?">
              <ChipGroup
                options={[
                  { value: 'no', label: 'No' },
                  { value: 'yes', label: 'Yes' },
                ]}
                value={[p.pregnant ? 'yes' : 'no']}
                onChange={([v]) => set({ pregnant: v === 'yes' })}
                layout="grid"
                columns={2}
              />
            </Section>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <Text variant="h1" accessibilityRole="header">
            Your body and habits
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField label="Height" value={height} onChangeText={setHeight} keyboardType="decimal-pad" suffix="cm" placeholder="170" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Weight" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix="kg" placeholder="70" />
            </View>
          </View>
          <Section title="How often do you drink alcohol?">
            <ChipGroup options={ALCOHOL_OPTIONS} value={[p.alcohol]} onChange={([alcohol]) => set({ alcohol: alcohol! })} layout="grid" />
          </Section>
        </>
      )}

      {step === 3 && (
        <>
          <Text variant="h1" accessibilityRole="header">
            A few health questions
          </Text>
          <Section title="Has a doctor told you that you have any of these?">
            <ChipGroup
              multiple
              exclusiveValue="none"
              options={CONDITION_OPTIONS}
              value={noneSelected ? ['none'] : p.conditions}
              onChange={(v) => {
                const none = v.includes('none');
                setNoneSelected(none);
                set({ conditions: none ? [] : (v as HealthCondition[]) });
              }}
            />
          </Section>
          <Section title="Do you take a medicine for cholesterol?">
            <ChipGroup options={MEDICINE_OPTIONS} value={[p.takesLipidMedicine]} onChange={([v]) => set({ takesLipidMedicine: v! })} layout="grid" />
          </Section>
          <Section title="Do you smoke?">
            <ChipGroup options={SMOKING_OPTIONS} value={[p.smokes]} onChange={([v]) => set({ smokes: v! })} layout="grid" />
          </Section>
        </>
      )}
    </Screen>
  );
}
