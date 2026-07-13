'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { isSyncConfigured, pushDeltas, pullDeltas } from '@/lib/sync';
import type { SyncDelta } from '@/lib/types';

export function useSync() {
  const { syncEnabled, offlineMode, pendingDeltas, lastSyncTimestamp, setLastSyncTimestamp, addPendingDelta, clearPendingDeltas } = useAppStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const push = useCallback(async () => {
    if (!syncEnabled || offlineMode || !isSyncConfigured() || pendingDeltas.length === 0) return;
    const ok = await pushDeltas(pendingDeltas);
    if (ok) clearPendingDeltas();
  }, [syncEnabled, offlineMode, pendingDeltas, clearPendingDeltas]);

  const pull = useCallback(async () => {
    if (!syncEnabled || offlineMode || !isSyncConfigured()) return;
    await pullDeltas(lastSyncTimestamp);
    setLastSyncTimestamp(Date.now());
  }, [syncEnabled, offlineMode, lastSyncTimestamp, setLastSyncTimestamp]);

  const queueDelta = useCallback((delta: SyncDelta) => {
    addPendingDelta(delta);
    if (!offlineMode && isSyncConfigured()) {
      pushDeltas([delta]).then(ok => {
        if (ok) {
          const store = useAppStore.getState();
          store.setLastSyncTimestamp(Date.now());
          store.clearPendingDeltas();
        }
      });
    }
  }, [addPendingDelta, offlineMode]);

  useEffect(() => {
    if (syncEnabled && !offlineMode && isSyncConfigured()) {
      intervalRef.current = setInterval(() => { push(); pull(); }, 30000);
      pull();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [syncEnabled, offlineMode, push, pull]);

  return { push, pull, queueDelta };
}
