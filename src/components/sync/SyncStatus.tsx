'use client';
import { useState, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { isSyncConfigured, pushState, pullState } from '@/lib/sync';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function SyncStatus() {
  const { syncEnabled, offlineMode, lastSyncTimestamp, setLastSyncTimestamp } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const configured = isSyncConfigured();
  const lastPushRef = useRef(0);

  const handleSync = async () => {
    if (!configured || syncing) return;
    setSyncing(true);
    setStatus('syncing');
    try {
      const store = useAppStore.getState();
      await pushState({
        users: store.users,
        fighters: store.fighters,
        missions: store.missions,
        roles: store.roles,
        specializations: store.specializations,
        vehicleTypes: store.vehicleTypes,
        vehicleAssociations: store.vehicleAssociations,
      });
      lastPushRef.current = Date.now();
      const remote = await pullState();
      if (remote) {
        const merged: Partial<typeof remote> = {};
        const keys: (keyof typeof remote)[] = ['users', 'fighters', 'missions', 'roles', 'specializations', 'vehicleTypes', 'vehicleAssociations'];
        for (const key of keys) {
          if (remote[key] && JSON.stringify(remote[key]) !== JSON.stringify(store[key])) {
            (merged as any)[key] = remote[key];
          }
        }
        if (Object.keys(merged).length > 0) {
          store.importState(merged);
        }
      }
      setLastSyncTimestamp(Date.now());
      setStatus('synced');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setSyncing(false);
    }
  };

  if (!syncEnabled || !configured) return null;

  const statusIcon = () => {
    if (offlineMode) return { icon: '🔴', label: 'Офлайн' };
    if (status === 'syncing') return { icon: '🔄', label: 'Синхронизация...' };
    if (status === 'synced') return { icon: '🟢', label: 'Синхронизировано' };
    if (status === 'error') return { icon: '🔴', label: 'Ошибка' };
    return { icon: '🟢', label: 'Актуально' };
  };

  const { icon, label } = statusIcon();

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          onClick={handleSync}
          disabled={syncing}
        >
          <span>{icon}</span>
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {offlineMode ? 'Офлайн режим. Изменения копятся локально.' :
         `Последняя синхронизация: ${new Date(lastSyncTimestamp).toLocaleTimeString()}`}
      </TooltipContent>
    </Tooltip>
  );
}
