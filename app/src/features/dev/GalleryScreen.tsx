import { addDays } from '@lipidly/rules';
import { Camera, CupSoda, Images, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { today } from '@/state/ids';
import {
  AnswerPair,
  Button,
  Callout,
  Card,
  Chip,
  ChipGroup,
  CodeInput,
  DateTile,
  DocumentPreview,
  FieldBox,
  IconTile,
  ListGroup,
  Logo,
  ListRow,
  Mascot,
  MonthCalendar,
  ProgressBar,
  ProgressRing,
  RadioCard,
  RangeGauge,
  Screen,
  ScreenState,
  Section,
  SegmentedControl,
  SourceTile,
  StatTile,
  StatusChip,
  Text,
  TextField,
  Toggle,
  TopBar,
  TrendChart,
  ValueField,
  WeekStrip,
} from '@/ui';

/** Developer-only gallery of every shared component, for checking against the design on device. */
export default function GalleryScreen() {
  const [chips, setChips] = useState<string[]>(['home']);
  const [answer, setAnswer] = useState<boolean>();
  const [seg, setSeg] = useState<'week' | 'month'>('week');
  const [toggle, setToggle] = useState(true);
  const [code, setCode] = useState('481');
  const [radio, setRadio] = useState('a');
  const t = today();

  return (
    <Screen topBar={<TopBar title="Components" />} gap={18}>
      <Section title="Logo">
        <View style={{ gap: 12 }}>
          <Logo variant="lockup" height={40} />
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Logo variant="mark" height={40} />
            <Logo variant="mark" tone="mono" height={40} />
            <Logo variant="wordmark" height={32} />
          </View>
          <View style={{ backgroundColor: '#0E7490', padding: 16, borderRadius: 24, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Logo variant="lockup" tone="white" height={32} />
            <Logo variant="mark" tone="white" height={32} />
          </View>
        </View>
      </Section>
      <Section title="Type">
        <Text variant="displayL">Display L</Text>
        <Text variant="h1">Heading 1</Text>
        <Text variant="h2">Heading 2</Text>
        <Text variant="title">Title</Text>
        <Text variant="body">Body text for explanations and descriptions.</Text>
        <Text variant="small" color="muted">
          Secondary text
        </Text>
        <Text variant="overline" color="muted">
          Overline
        </Text>
      </Section>
      <Section title="Buttons">
        <Button label="Primary" />
        <Button label="Primary disabled" disabled />
        <Button label="Secondary" variant="secondary" />
        <View style={{ backgroundColor: '#0E7490', padding: 12, borderRadius: 24, gap: 8 }}>
          <Button label="On primary" variant="onPrimary" />
          <Button label="Primary deep" variant="primaryDeep" size="md" />
        </View>
        <Button label="Dark" variant="dark" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button label="I can do this" size="xs" />
          <Button label="Add" icon={Plus} size="xs" variant="tint" />
          <Button label="Link" variant="link" size="xs" />
        </View>
      </Section>
      <Section title="Chips">
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip label="Active mode" tone="white" />
          <Chip label="Best run · 9 days" />
          <Chip label="Soft" tone="soft" />
          <StatusChip status="inRange" />
          <StatusChip status="borderline" />
          <StatusChip status="high" />
          <StatusChip status="low" />
        </View>
        <ChipGroup
          multiple
          options={[
            { value: 'home', label: 'At home' },
            { value: 'outdoors', label: 'Outdoors nearby' },
            { value: 'gym', label: 'Gym' },
          ]}
          value={chips}
          onChange={setChips}
          other={{ values: [], onChange: () => {} }}
        />
      </Section>
      <Section title="Inputs">
        <AnswerPair value={answer} onChange={setAnswer} />
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <SegmentedControl options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} value={seg} onChange={setSeg} />
          <Toggle value={toggle} onChange={setToggle} accessibilityLabel="Sample toggle" />
        </View>
        <TextField label="Text field" placeholder="Type here" />
        <CodeInput value={code} onChange={setCode} />
        <ValueField value="148" onChange={() => {}} unit="mg/dL" flagged accessibilityLabel="Sample value" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FieldBox label="Strength" value="10 mg" onChange={() => {}} />
          <FieldBox label="How long" value="" onChange={() => {}} />
        </View>
        <RadioCard title="No sweets after dinner" subtitle="Selected" selected={radio === 'a'} onPress={() => setRadio('a')} />
        <RadioCard title="An alcohol-free day" subtitle="Already covered by your doctor's habit" selected={false} disabled onPress={() => {}} />
      </Section>
      <Section title="Cards and tiles">
        <Card tone="primary" raised>
          <Text variant="title" color="white">
            Raised primary card
          </Text>
        </Card>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconTile icon={CupSoda} tone="lilac" />
          <IconTile icon={CupSoda} tone="ice" />
          <IconTile icon={CupSoda} tone="sky" />
          <IconTile icon={CupSoda} tone="tint" />
          <DateTile month="SEP" day={22} tone="primary" />
          <DateTile month="JUN" day={14} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <StatTile tone="primary" size="sm" value={8} label="check-ins this month" />
          <StatTile tone="sky" size="sm" value={2} label="days in a row" />
          <StatTile tone="lilac" size="sm" value={9} label="best run" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SourceTile icon={Camera} tone="primary" label="Take a photo" onPress={() => {}} style={{ flex: 1 }} />
          <SourceTile icon={Images} tone="sky" label="Choose from photos" onPress={() => {}} style={{ flex: 1 }} />
        </View>
        <ListGroup>
          <ListRow title="List row" subtitle="With a subtitle" onPress={() => {}} />
          <ListRow title="With value" value="8:00 pm" />
        </ListGroup>
        <Callout title="What changed">Triglycerides went from 342 to 286 mg/dL, down 16%.</Callout>
        <Callout tone="white" mascot="happy">
          Missed a day? Your run keeps going if you fill it in within two days.
        </Callout>
      </Section>
      <Section title="Progress">
        <ProgressBar segments={6} filled={4} />
        <ProgressBar value={0.62} height={14} />
        <View style={{ backgroundColor: '#0E7490', padding: 12, borderRadius: 24 }}>
          <ProgressRing done={1} total={4} />
        </View>
        <WeekStrip days={['done', 'done', 'done', 'missed', 'done', 'done', 'today'].map((state, i) => ({ date: addDays(t, i - 6), state: state as 'done' }))} />
        <MonthCalendar monthStart={`${t.slice(0, 7)}-01`} cells={Array.from({ length: 28 }, (_, i) => ({ date: addDays(`${t.slice(0, 7)}-01`, i), state: (['all', 'most', 'some', 'missed'] as const)[i % 4]! }))} />
      </Section>
      <Section title="Charts">
        <Card style={{ gap: 12 }}>
          <RangeGauge marker="triglycerides" value={286} sex="male" />
          <RangeGauge marker="hdl" value={38} sex="male" />
          <TrendChart marker="triglycerides" sex="male" points={[{ label: 'Jun', value: 342 }, { label: 'Sep', value: 286 }]} />
        </Card>
      </Section>
      <Section title="Mascot">
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {(['happy', 'calm', 'surprised', 'thinking', 'celebrating'] as const).map((m) => (
            <Mascot key={m} size={56} mood={m} cheeks={m === 'happy'} />
          ))}
        </View>
      </Section>
      <Section title="Documents and states">
        <DocumentPreview label="original report · page 1" highlight={{ x: 0.13, y: 0.55, w: 0.62, h: 0.1 }} />
        <ScreenState kind="offline" />
      </Section>
    </Screen>
  );
}
