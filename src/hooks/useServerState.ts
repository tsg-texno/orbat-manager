'use client';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { pullServerState, pushServerState, extractStoreState } from '@/lib/serverState';

const PUSH_DEBOUNCE = 1500;
const PULL_INTERVAL = 8000;

function mergeFromServer(store: typeof useAppStore, partial: Record<string, unknown>) {
  const state = store.getState();
  const merged: Record<string, unknown> = {};
  const mergeKeys = ['users', 'fighters', 'missions', 'specializations', 'vehicleTypes', 'vehicleAssociations', 'specializationAssociations'];
  for (const key of mergeKeys) {
    const serverItems = partial[key] as Array<{ id: string }> | undefined;
    const localItems = (state as any)[key] as Array<{ id: string }> | undefined;
    if (!serverItems || !localItems) {
      if (serverItems) merged[key] = serverItems;
      continue;
    }
    const serverIds = new Set(serverItems.map(i => i.id));
    // Keep any local items not on server (newly created locally)
    merged[key] = [...serverItems, ...localItems.filter(i => !serverIds.has(i.id))];
  }
  // For non-merge keys, use server value (but never overwrite current user session)
  for (const [k, v] of Object.entries(partial)) {
    if (k === 'user') continue;
    if (!(k in merged)) merged[k] = v;
  }
  store.getState().importState(merged);
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
        mergeFromServer(store, serverState as Record<string, unknown>);
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
        mergeFromServer(store, serverState as Record<string, unknown>);
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
