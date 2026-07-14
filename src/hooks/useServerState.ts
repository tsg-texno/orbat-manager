'use client';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { pullServerState, pushServerState, extractStoreState } from '@/lib/serverState';

export function useServerState() {
  const initialized = useRef(false);

  useEffect(() => {
    const store = useAppStore;

    // Initial pull from server — replaces local data
    (async () => {
      if (initialized.current) return;
      initialized.current = true;
      const serverState = await pullServerState();
      if (!serverState) return;
      const state = store.getState();
      const safe: Record<string, unknown> = { ...serverState };
      delete safe.user;
      // Merge current user into server users if not present (newly registered)
      const serverUsers = safe.users as Array<{ id: string }> | undefined;
      if (Array.isArray(serverUsers) && state.user) {
        const serverIds = new Set(serverUsers.map(u => u.id));
        if (!serverIds.has(state.user.id)) {
          serverUsers.push(state.user);
        }
      }
      store.getState().importState(safe);
    })();

    // Push on every store change — immediately, no debounce
    const unsub = store.subscribe(() => {
      const data = extractStoreState(store.getState());
      pushServerState(data);
    });

    // Pull on page focus — catches other users' changes
    const onFocus = () => {
      pullServerState().then(serverState => {
        if (!serverState) return;
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
        const local = extractStoreState(store.getState());
        if (JSON.stringify(safe) !== JSON.stringify(local)) {
          store.getState().importState(safe);
        }
      });
    };
    window.addEventListener('focus', onFocus);

    return () => {
      unsub();
      window.removeEventListener('focus', onFocus);
    };
  }, []);
}
