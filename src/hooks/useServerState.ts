'use client';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { pullServerState, pushServerState, extractStoreState } from '@/lib/serverState';

const PUSH_DEBOUNCE = 1500;
const PULL_INTERVAL = 8000;

function replaceFromServer(store: typeof useAppStore, partial: Record<string, unknown>) {
  const state = store.getState();
  const safe: Record<string, unknown> = { ...partial };
  delete safe.user;
  // Merge users: server users + local user if not in server (newly registered)
  const serverUsers = safe.users as Array<{ id: string }> | undefined;
  if (Array.isArray(serverUsers) && state.user) {
    const serverIds = new Set(serverUsers.map(u => u.id));
    if (!serverIds.has(state.user.id)) {
      serverUsers.push(state.user);
    }
  }
  // Keep missions, fighters, etc. from server (source of truth) — no merge
  store.getState().importState(safe);
}

export function useServerState() {
  const initialized = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const store = useAppStore;
    const init = async () => {
      if (initialized.current) return;
      initialized.current = true;
      const serverState = await pullServerState();
      if (serverState) {
        replaceFromServer(store, serverState as Record<string, unknown>);
      }
    };
    init();

    let pushTimer: ReturnType<typeof setTimeout>;
    const push = () => {
      clearTimeout(pushTimer);
      pushTimer = setTimeout(async () => {
        const state = extractStoreState(store.getState());
        await pushServerState(state);
      }, PUSH_DEBOUNCE);
    };

    const pull = async () => {
      const serverState = await pullServerState();
      if (!serverState) return;
      const local = extractStoreState(store.getState());
      if (JSON.stringify(serverState) !== JSON.stringify(local)) {
        replaceFromServer(store, serverState as Record<string, unknown>);
      }
    };

    const unsub = store.subscribe(push);
    timerRef.current = setInterval(pull, PULL_INTERVAL);

    return () => {
      unsub();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
}
