'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { isSyncConfigured, pushDeltas, pullDeltas } from '@/lib/sync';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function SyncStatus() {
  const { pendingDeltas, offlineMode, lastSyncTimestamp, setLastSyncTimestamp, clearPendingDeltas, syncEnabled } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const configured = isSyncConfigured();

  const handleSync = async () => {
    if (!configured || syncing) return;
    setSyncing(true);
    setStatus('syncing');
    try {
      if (pendingDeltas.length > 0) {
        const ok = await pushDeltas(pendingDeltas);
        if (ok) clearPendingDeltas();
      }
      await pullDeltas(lastSyncTimestamp);
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

  if (!syncEnabled) return null;

  const statusIcon = () => {
    if (offlineMode) return { icon: '🔴', label: 'Офлайн' };
    if (!configured) return { icon: '⚪', label: 'Не настроен' };
    if (status === 'syncing') return { icon: '🔄', label: 'Синхронизация...' };
    if (status === 'synced') return { icon: '🟢', label: 'Синхронизировано' };
    if (status === 'error') return { icon: '🔴', label: 'Ошибка' };
    if (pendingDeltas.length > 0) return { icon: '🟡', label: `${pendingDeltas.length} изменений` };
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
          disabled={syncing || !configured}
        >
          <span>{icon}</span>
          {!configured ? 'Настройка' : label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {!configured ? 'Настройте Telegram бота в настройках' :
         offlineMode ? 'Офлайн режим. Изменения копятся локально.' :
         `Последняя синхронизация: ${new Date(lastSyncTimestamp).toLocaleTimeString()}`}
      </TooltipContent>
    </Tooltip>
  );
}
