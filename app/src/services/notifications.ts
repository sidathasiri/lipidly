import { addDays } from '@lipidly/rules';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { activePlan, dailyHabits } from '@/state/actions/plan-builder';
import { today } from '@/state/ids';
import { useStore } from '@/state/store';
import type { UserData } from '@/state/types';

/**
 * Local notifications, all scheduled on the device so they work offline.
 * Text never includes a lab value, a medicine name or a condition (spec: Notifications).
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const res = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
  return res.granted;
}

const hm = (time: string) => {
  const [hour, minute] = time.split(':').map(Number) as [number, number];
  return { hour, minute };
};

const minutes = (time: string) => {
  const { hour, minute } = hm(time);
  return hour * 60 + minute;
};

/** Inside quiet hours (default 10 pm – 7 am). Medicine doses still fire. */
const inQuietHours = (time: string, d: UserData) => {
  const t = minutes(time);
  const start = minutes(d.reminders.quietStart);
  const end = minutes(d.reminders.quietEnd);
  return start > end ? t >= start || t < end : t >= start && t < end;
};

const atDate = (isoDate: string, time: string) => {
  const { hour, minute } = hm(time);
  const [y, m, day] = isoDate.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, day, hour, minute);
};

const daily = (time: string): Notifications.NotificationTriggerInput => ({ type: Notifications.SchedulableTriggerInputTypes.DAILY, ...hm(time) });
const once = (date: Date): Notifications.NotificationTriggerInput => ({ type: Notifications.SchedulableTriggerInputTypes.DATE, date });

/** Rebuilds every scheduled reminder from the user's data. */
export async function rescheduleAll(d: UserData) {
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const schedule = (body: string, url: string, trigger: Notifications.NotificationTriggerInput) =>
    Notifications.scheduleNotificationAsync({ content: { title: 'Lipidly', body, data: { url } }, trigger });

  const plan = activePlan(d);
  const now = new Date();
  const jobs: Promise<string>[] = [];

  // Medicine doses: never capped, fire during quiet hours too.
  for (const m of d.medicines.filter((x) => x.active)) {
    for (const time of m.times) jobs.push(schedule('Time for your medicine. Tap to mark it taken.', '/medicines', daily(time)));
  }

  // Non-medicine reminders: at most three a day (check-in + up to two habit nudges).
  if (plan && d.reminders.checkInEnabled && !inQuietHours(d.reminders.checkInTime, d)) {
    jobs.push(schedule('Time for today’s check-in. It takes under a minute.', '/check-in', daily(d.reminders.checkInTime)));
  }
  if (plan && d.reminders.habitNudges) {
    dailyHabits(d, plan)
      .filter((h) => h.source !== 'doctor' && h.reminderTime && !inQuietHours(h.reminderTime, d))
      .slice(0, 2)
      .forEach((h) => jobs.push(schedule('A small habit is coming up. You’ve got this.', '/plan', daily(h.reminderTime!))));
  }

  if (plan && d.reminders.retest) {
    for (const before of [14, 2]) {
      const when = atDate(addDays(plan.retestDate, -before), '09:00');
      if (when > now) jobs.push(schedule('Your next blood test is coming up. Book it when you can.', '/plan', once(when)));
    }
  }

  for (const a of d.appointments) {
    const at = new Date(a.dateTime);
    const dayBefore = atDate(addDays(a.dateTime.slice(0, 10), -1), '18:00');
    const twoHours = new Date(at.getTime() - 2 * 3600_000);
    if (dayBefore > now) jobs.push(schedule('You have an appointment tomorrow.', '/medicines/appointments', once(dayBefore)));
    if (twoHours > now) jobs.push(schedule('Your appointment is in two hours.', '/medicines/appointments', once(twoHours)));
  }

  if (plan && d.reminders.weeklySummary) {
    jobs.push(
      schedule('Your week in Lipidly is ready.', '/weekly-summary', { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 19, minute: 0 }),
    );
  }

  // Come-back nudge: three days after the last check-in.
  if (plan && d.reminders.comeBack) {
    const last = Object.keys(d.checkIns).sort().pop() ?? today();
    const when = atDate(addDays(last, 3), d.reminders.checkInTime);
    if (when > now) jobs.push(schedule('We’ve missed you. A quick check-in keeps your plan on track.', '/check-in', once(when)));
  }

  await Promise.all(jobs);
}

/** Keeps scheduled reminders in sync with the store, and opens the right screen on tap. */
export function useNotifications() {
  const userData = useStore((s) => (s.session ? s.data[s.session.id] : undefined));

  useEffect(() => {
    if (!userData?.onboarded) return;
    const t = setTimeout(() => rescheduleAll(userData).catch(() => {}), 800);
    return () => clearTimeout(t);
  }, [userData]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    });
    return () => sub.remove();
  }, []);
}
