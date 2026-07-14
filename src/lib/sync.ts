import type { AppState, SyncDelta } from '@/lib/types';

export function isSyncConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const tk = localStorage.getItem('orbat_telegram_token');
  const ch = localStorage.getItem('orbat_telegram_chat');
  return !!tk && !!ch;
}

export function configureSync(token: string, chat: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('orbat_telegram_token', token);
    localStorage.setItem('orbat_telegram_chat', chat);
  }
}

export function loadSyncConfig() {
  if (typeof window !== 'undefined') {
    return {
      botToken: localStorage.getItem('orbat_telegram_token') || '',
      chatId: localStorage.getItem('orbat_telegram_chat') || '',
    };
  }
  return { botToken: '', chatId: '' };
}

export async function pushState(state: Partial<AppState>): Promise<boolean> {
  const chatId = localStorage.getItem('orbat_telegram_chat');
  if (!chatId) return false;
  try {
    const resp = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, chatId }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function pullState(): Promise<Partial<AppState> | null> {
  const chatId = localStorage.getItem('orbat_telegram_chat');
  if (!chatId) return null;
  try {
    const resp = await fetch(`/api/sync?chatId=${encodeURIComponent(chatId)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.state || null;
  } catch {
    return null;
  }
}

export async function pushDeltas(_deltas: SyncDelta[]): Promise<boolean> {
  return false;
}

export async function pullDeltas(_lastTimestamp: number): Promise<SyncDelta[] | null> {
  return null;
}

export async function sendFullSnapshot(_snapshot: string): Promise<boolean> {
  return false;
}
