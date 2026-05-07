import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PushRegistrationResult =
  | { ok: true; expoPushToken: string }
  | { ok: false; reason: 'not-a-device' | 'permission-denied' | 'error'; error?: unknown };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getEasProjectId(): string | undefined {
  const anyConstants = Constants as any;
  return (
    anyConstants?.easConfig?.projectId ??
    anyConstants?.expoConfig?.extra?.eas?.projectId ??
    anyConstants?.expoConfig?.extra?.projectId
  );
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  try {
    if (!Device.isDevice) return { ok: false, reason: 'not-a-device' };

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existingPerms: any = await Notifications.getPermissionsAsync();
    const existingGranted = existingPerms.status === 'granted';
    let finalGranted = existingGranted;
    if (!existingGranted) {
      const requested: any = await Notifications.requestPermissionsAsync();
      finalGranted = requested.status === 'granted';
    }

    if (!finalGranted) return { ok: false, reason: 'permission-denied' };

    const projectId = getEasProjectId();
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return { ok: true, expoPushToken: token.data };
  } catch (error) {
    return { ok: false, reason: 'error', error };
  }
}

// ─── Live Pomodoro Notification ───────────────────────────────────────────────

const POMODORO_CHANNEL_ID = 'pomodoro-timer';
const POMODORO_NOTIF_ID = 'pomodoro-live';

async function ensurePomodoroChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(POMODORO_CHANNEL_ID, {
      name: 'Pomodoro Timer',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
      enableLights: false,
    });
  }
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const perms: any = await Notifications.getPermissionsAsync();
  if (perms.status === 'granted') return true;
  const requested: any = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

function formatRemaining(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export async function showPomodoroNotification(taskName: string, remainingSeconds: number): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  await ensurePomodoroChannel();

  await Notifications.dismissNotificationAsync(POMODORO_NOTIF_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: POMODORO_NOTIF_ID,
    content: {
      title: `Focus: ${taskName}`,
      body: `${formatRemaining(remainingSeconds)} remaining`,
      data: { type: 'pomodoro' },
      sticky: true,
      autoDismiss: false,
    },
    trigger: null,
  });
}

export async function dismissPomodoroNotification(): Promise<void> {
  await Notifications.dismissNotificationAsync(POMODORO_NOTIF_ID).catch(() => {});
}
