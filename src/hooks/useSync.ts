'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { isSyncConfigured, pushState, pullState } from '@/lib/sync';

export function useSync() {
  const syncEnabled = useAppStore(s => s.syncEnabled);
  const offlineMode = useAppStore(s => s.offlineMode);

  const push = useCallback(async () => {
    if (!syncEnabled || offlineMode || !isSyncConfigured()) return;
    const store = useAppStore.getState();
    const state = {
      users: store.users,
      fighters: store.fighters,
      missions: store.missions,
      roles: store.roles,
      specializations: store.specializations,
      vehicleTypes: store.vehicleTypes,
      vehicleAssociations: store.vehicleAssociations,
    };
    await pushState(state);
  }, [syncEnabled, offlineMode]);

  const pull = useCallback(async () => {
    if (!syncEnabled || offlineMode || !isSyncConfigured()) return;
    const remote = await pullState();
    if (!remote) return;
    const store = useAppStore.getState();
    const merged: Partial<typeof remote> = {};

    if (remote.users && JSON.stringify(remote.users) !== JSON.stringify(store.users)) merged.users = remote.users;
    if (remote.fighters && JSON.stringify(remote.fighters) !== JSON.stringify(store.fighters)) merged.fighters = remote.fighters;
    if (remote.missions && JSON.stringify(remote.missions) !== JSON.stringify(store.missions)) merged.missions = remote.missions;
    if (remote.roles && JSON.stringify(remote.roles) !== JSON.stringify(store.roles)) merged.roles = remote.roles;
    if (remote.specializations && JSON.stringify(remote.specializations) !== JSON.stringify(store.specializations)) merged.specializations = remote.specializations;
    if (remote.vehicleTypes && JSON.stringify(remote.vehicleTypes) !== JSON.stringify(store.vehicleTypes)) merged.vehicleTypes = remote.vehicleTypes;
    if (remote.vehicleAssociations && JSON.stringify(remote.vehicleAssociations) !== JSON.stringify(store.vehicleAssociations)) merged.vehicleAssociations = remote.vehicleAssociations;

    if (Object.keys(merged).length > 0) {
      store.importState(merged);
    }
    store.setLastSyncTimestamp(Date.now());
  }, [syncEnabled, offlineMode]);

  useEffect(() => {
    if (syncEnabled && !offlineMode && isSyncConfigured()) {
      push();
      const interval = setInterval(() => { push(); pull(); }, 15000);
      return () => clearInterval(interval);
    }
  }, [syncEnabled, offlineMode, push, pull]);

  return { push, pull };
}
