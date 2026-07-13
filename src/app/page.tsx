'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSeedLoader } from '@/lib/seedLoader';

export default function DashboardPage() {
  const missions = useAppStore(s => s.missions);
  const { loadSeed } = useSeedLoader();

  useEffect(() => { loadSeed(); }, []);
  const fighters = useAppStore(s => s.fighters);
  const pendingDeltas = useAppStore(s => s.pendingDeltas);

  const totalSlots = missions.reduce((acc, m) =>
    acc + m.slotGroups.reduce((sgAcc, sg) => sgAcc + sg.slots.length, 0), 0);
  const takenSlots = missions.reduce((acc, m) =>
    acc + m.slotGroups.reduce((sgAcc, sg) =>
      sgAcc + sg.slots.filter(s => s.status === 'taken_by_us').length, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <div className="flex gap-2">
          {pendingDeltas.length > 0 && (
            <span className="text-sm text-yellow-500">
              ⏳ {pendingDeltas.length} несинхронизированных изменений
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Миссии</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{missions.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Бойцы</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{fighters.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Всего слотов</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalSlots}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Занято</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              {takenSlots}/{totalSlots}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Последние миссии</CardTitle></CardHeader>
          <CardContent>
            {missions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Нет миссий. Создайте первую миссию.</p>
                <Link href="/missions"><Button>Создать миссию</Button></Link>
              </div>
            ) : (
              <div className="space-y-2">
                {missions.map(m => (
                  <Link key={m.id} href={`/missions/${m.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">{m.date} — {m.map}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {m.slotGroups.length} групп(ы)
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Быстрые действия</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Link href="/missions"><Button className="w-full justify-start" variant="outline">📋 Управление миссиями</Button></Link>
            <Link href="/specializations"><Button className="w-full justify-start" variant="outline">⭐ Управление специализациями</Button></Link>
            <Link href="/vehicles"><Button className="w-full justify-start" variant="outline">🚁 Управление техникой</Button></Link>
            <Link href="/settings"><Button className="w-full justify-start" variant="outline">⚙️ Настройки синхронизации</Button></Link>
            <Link href="/roster"><Button className="w-full justify-start" variant="outline">📋 Ростер бойцов</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
