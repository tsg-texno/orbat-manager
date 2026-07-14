'use client';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { pullServerState, pushServerState, extractStoreState } from '@/lib/serverState';

function importWithCurrentUser(serverState: object) {
  const store = useAppStore;
  const state = store.getState();
  const safe: Record<string, unknown> = { ...serverState };
  delete safe.user;
  const serverUsers = safe.users as Array<{ id: string }> | undefined;
  if (Array.isArray(serverUsers) && state.user) {
    const serverIds = new Set(serverUsers.map(u => u.id));
    if (!serverIds.has(state.user.id)) {
      serverUsers.push(state.user);
    }
  }
  store.getState().importState(safe);
}

export function useServerState() {
  const initialized = useRef(false);

  useEffect(() => {
    const store = useAppStore;

    (async () => {
      if (initialized.current) return;
      initialized.current = true;
      const serverState = await pullServerState();
      if (serverState) importWithCurrentUser(serverState);
    })();

    const unsub = store.subscribe(() => {
      const data = extractStoreState(store.getState());
      pushServerState(data);
    });

    return () => { unsub(); };
  }, []);
}
