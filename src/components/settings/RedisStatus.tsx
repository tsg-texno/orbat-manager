'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RedisStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const resp = await fetch('/api/state');
        if (cancelled) return;
        if (resp.ok) {
          setStatus('connected');
          setError('');
        } else {
          const body = await resp.json().catch(() => ({}));
          setStatus('disconnected');
          setError(body?.error || `HTTP ${resp.status}`);
        }
      } catch (e) {
        if (cancelled) return;
        setStatus('disconnected');
        setError(String(e));
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const label = status === 'loading' ? 'Проверка...' : status === 'connected' ? 'Подключено' : 'Не подключено';
  const color = status === 'connected' ? 'bg-green-500' : status === 'loading' ? 'bg-yellow-500' : 'bg-destructive';

  return (
    <Card>
      <CardHeader><CardTitle>База данных (Redis)</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-3">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm font-medium">{label}</span>
        {status === 'disconnected' && error && (
          <span className="text-xs text-muted-foreground">— {error}</span>
        )}
        {status === 'connected' && (
          <Badge variant="outline" className="text-xs">Данные синхронизируются между всеми пользователями</Badge>
        )}
      </CardContent>
    </Card>
  );
}
