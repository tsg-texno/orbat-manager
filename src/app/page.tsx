'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { useSeedLoader } from '@/lib/seedLoader';

interface SheetMission {
  date: string; squad: string; name: string; status: string;
  side: string; ourFaction: string;
}

export default function DashboardPage() {
  const missions = useAppStore(s => s.missions);
  const specializations = useAppStore(s => s.specializations);
  const fighters = useAppStore(s => s.fighters);
  const { loadSeed } = useSeedLoader();

  useEffect(() => { loadSeed(); }, []);

  const [upcoming, setUpcoming] = useState<SheetMission[]>([]);

  useEffect(() => {
    fetch('/api/sheet/missions').then(r => r.json()).then(d => {
      if (d.missions) setUpcoming(d.missions);
    }).catch(() => {});
  }, []);

  const totalSlots = missions.reduce((acc, m) =>
    acc + m.slotGroups.reduce((sgAcc, sg) => sgAcc + sg.slots.length, 0), 0);
  const takenSlots = missions.reduce((acc, m) =>
    acc + m.slotGroups.reduce((sgAcc, sg) =>
      sgAcc + sg.slots.filter(s => s.status === 'taken_by_us').length, 0), 0);

  const missionSpecStats = missions.map(m => {
    const allSlots = m.slotGroups.flatMap(g => g.slots);
    const specCounts = new Map<string, { name: string; icon: string; count: number }>();
    let noSpec = 0;
    for (const s of allSlots) {
      if (s.specializationId) {
        const sp = specializations.find(sp => sp.id === s.specializationId);
        const key = s.specializationId;
        const prev = specCounts.get(key) || { name: sp?.name || '?', icon: sp?.icon || '', count: 0 };
        specCounts.set(key, { ...prev, count: prev.count + 1 });
      } else {
        noSpec++;
      }
    }
    return { mission: m, specs: Array.from(specCounts.values()), noSpec };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Дашборд</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          <CardHeader><CardTitle>Миссии — состав слотов</CardTitle></CardHeader>
          <CardContent>
            {missions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Нет миссий. Создайте первую.</p>
                <Link href="/missions"><Button>Создать миссию</Button></Link>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {missionSpecStats.map(({ mission: m, specs, noSpec }) => (
                    <Link key={m.id} href={`/missions/${m.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-medium">{m.name}</p>
                        <span className="text-xs text-muted-foreground">{m.date}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {specs.map((sp, i) => (
                          <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0.5 gap-1">
                            {sp.icon && <img src={sp.icon} alt="" className="w-4 h-4" />}
                            {sp.name}
                            <span className="text-muted-foreground ml-0.5">×{sp.count}</span>
                          </Badge>
                        ))}
                        {noSpec > 0 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            ? ×{noSpec}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {upcoming.length > 0 && (
          <Card>
            <CardHeader><CardTitle>🗓 Ближайшие миссии (из таблицы)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map((m, i) => (
                <div key={i} className="p-3 rounded-lg border text-sm">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-muted-foreground">{m.date} — {m.squad} — {m.side === 'Красные' ? '🔴' : '🔵'} {m.ourFaction}</p>
                </div>
              ))}
              <Link href="/missions"><Button size="sm" variant="outline" className="w-full mt-2">Импортировать</Button></Link>
            </CardContent>
          </Card>
        )}

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
