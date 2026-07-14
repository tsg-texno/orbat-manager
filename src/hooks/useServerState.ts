'use client';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { pullServerState, pushServerState, extractStoreState } from '@/lib/serverState';

const PUSH_DEBOUNCE = 1500;
const PULL_INTERVAL = 8000;

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
        // Don't overwrite current session user
        const { user: _, ...safe } = serverState as any;
        store.getState().importState(safe);
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
        const { user: _, ...safe } = serverState as any;
        store.getState().importState(safe);
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
