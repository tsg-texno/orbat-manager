import type { SyncDelta } from '@/lib/types';

const TELEGRAM_API = 'https://api.telegram.org/bot';

let botToken = '';
let chatId = '';

export function configureSync(token: string, chat: string) {
  botToken = token;
  chatId = chat;
  if (typeof window !== 'undefined') {
    localStorage.setItem('orbat_telegram_token', token);
    localStorage.setItem('orbat_telegram_chat', chat);
  }
}

export function loadSyncConfig() {
  if (typeof window !== 'undefined') {
    botToken = localStorage.getItem('orbat_telegram_token') || '';
    chatId = localStorage.getItem('orbat_telegram_chat') || '';
  }
  return { botToken, chatId };
}

export function isSyncConfigured(): boolean {
  return !!botToken && !!chatId;
}

export async function pushDeltas(deltas: SyncDelta[]): Promise<boolean> {
  if (!isSyncConfigured()) return false;
  try {
    const resp = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `/push ${JSON.stringify(deltas)}`,
        parse_mode: 'HTML',
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function pullDeltas(lastTimestamp: number): Promise<SyncDelta[] | null> {
  if (!isSyncConfigured()) return null;
  try {
    const resp = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `/pull ${lastTimestamp}`,
      }),
    });
    return resp.ok ? [] : null;
  } catch {
    return null;
  }
}

export async function sendFullSnapshot(snapshot: string): Promise<boolean> {
  if (!isSyncConfigured()) return false;
  try {
    const resp = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `/snapshot ${snapshot}`,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
