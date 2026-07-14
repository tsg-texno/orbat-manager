'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { useSeedLoader } from '@/lib/seedLoader';
import { usePermissions } from '@/lib/usePermissions';
import { RequirePerm } from '@/components/auth/RequirePerm';

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
    acc + m.slotGroups.reduce((sgAcc, sg) => sgAcc + (sg.slots || []).length, 0), 0);
  const takenSlots = missions.reduce((acc, m) =>
    acc + m.slotGroups.reduce((sgAcc, sg) =>
      sgAcc + (sg.slots || []).filter(s => s.status === 'taken_by_us').length, 0), 0);

  const vehicleTypes = useAppStore(s => s.vehicleTypes);
  const missionSpecStats = missions.map(m => {
    const claimableSlots = m.slotGroups.flatMap(g => g.slots || []).filter(s => s.status !== 'reserve' && s.status !== 'occupied_by_others');
    const specCounts = new Map<string, { name: string; icon: string; total: number; filled: number }>();
    let noSpecTotal = 0, noSpecFilled = 0;
    for (const s of claimableSlots) {
      if (s.specializationId) {
        const sp = specializations.find(sp => sp.id === s.specializationId);
        const key = s.specializationId;
        const prev = specCounts.get(key) || { name: sp?.name || '?', icon: sp?.icon || '', total: 0, filled: 0 };
        specCounts.set(key, { ...prev, total: prev.total + 1, filled: prev.filled + (s.status === 'taken_by_us' ? 1 : 0) });
      } else {
        noSpecTotal++;
        if (s.status === 'taken_by_us') noSpecFilled++;
      }
    }
    const groupVehicles = m.slotGroups.flatMap(g =>
      (g.vehicleIds || []).map(vid => {
        const vt = vehicleTypes.find(v => v.id === vid);
        return vt ? { groupName: g.name, vt } : null;
      }).filter(Boolean)
    );
    return { mission: m, specs: Array.from(specCounts.values()), noSpecTotal, noSpecFilled, groupVehicles };
  });

  return (
    <RequirePerm perm="view_orbat">
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
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Слоты по миссиям</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {missions.map(m => {
                const slots = m.slotGroups.flatMap(g => g.slots || []);
                const taken = slots.filter(s => s.status === 'taken_by_us').length;
                const claimable = slots.filter(s => s.status !== 'reserve' && s.status !== 'occupied_by_others').length;
                return (
                  <div key={m.id} className="flex justify-between">
                    <span className="truncate">{m.name}</span>
                    <span className="ml-2 shrink-0">{taken}/{claimable}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
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
                <Link href="/missions"><Button title="Создать новую миссию">Создать миссию</Button></Link>
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {missionSpecStats.map(({ mission: m, specs, noSpecTotal, noSpecFilled, groupVehicles }) => {
                    const total = specs.reduce((s, x) => s + x.total, 0) + noSpecTotal;
                    const filled = specs.reduce((s, x) => s + x.filled, 0) + noSpecFilled;
                    const pct = total > 0 ? Math.round(filled / total * 100) : 0;
                    const barColor = pct < 33 ? 'bg-red-500' : pct < 67 ? 'bg-yellow-500' : 'bg-green-500';
                    return (
                    <Link key={m.id} href={`/missions/${m.id}`}
                      className="block p-4 rounded-lg border hover:bg-accent transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <p className="text-base font-semibold">{m.name}</p>
                          <span className="text-xs text-muted-foreground">{m.date}</span>
                        </div>
                        <span className={`text-sm font-bold ${total > 0 ? (pct < 33 ? 'text-red-500' : pct < 67 ? 'text-yellow-500' : 'text-green-500') : 'text-muted-foreground'}`}>
                          {filled}/{total} ({pct}%)
                        </span>
                      </div>
                      {total > 0 && (
                        <div className="w-full h-2 bg-muted rounded-full mb-3 overflow-hidden">
                          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {specs.map((sp, i) => {
                          const r = sp.total > 0 ? sp.filled / sp.total : 0;
                          const c = r < 0.33 ? 'border-red-500/40 bg-red-500/5' : r < 0.67 ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-green-500/40 bg-green-500/5';
                          return (
                            <div key={i} className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border min-w-[130px] ${c}`}>
                              {sp.icon && <img src={`/icons/${sp.icon}`} alt="" className="w-[38px] h-[38px]" />}
                              <div className="flex flex-col leading-tight">
                                <span className="text-sm font-medium">{sp.name}</span>
                                <span className={`text-sm font-bold ${r < 0.33 ? 'text-red-500' : r < 0.67 ? 'text-yellow-500' : 'text-green-500'}`}>
                                  {sp.filled}/{sp.total}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {noSpecTotal > 0 && (
                          <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border border-muted min-w-[130px]">
                            <div className="w-[38px] h-[38px] rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">?</div>
                            <div className="flex flex-col leading-tight">
                              <span className="text-sm font-medium">Без специ</span>
                              <span className="text-sm font-bold text-muted-foreground">{noSpecFilled}/{noSpecTotal}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {groupVehicles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                          <span className="w-full text-xs text-muted-foreground font-medium mb-1">Приписанная техника:</span>
                          {groupVehicles.map((gv, i) => gv && (
                            <div key={i} className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/5 min-w-[140px]">
                              {gv.vt.icon && <img src={`/icons/${gv.vt.icon}`} alt="" className="w-[48px] h-[32px]" />}
                              <div className="flex flex-col leading-tight">
                                <span className="text-sm font-medium">{gv.vt.name}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">{gv.groupName} <span className="text-[10px]">×{gv.vt.crewSize ?? 1}</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Link>
                    );
                  })}
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
              <Link href="/missions"><Button size="sm" variant="outline" className="w-full mt-2" title="Импортировать миссии из Google Sheets">Импортировать</Button></Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Быстрые действия</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Link href="/missions"><Button className="w-full justify-start" variant="outline" title="Перейти к списку миссий">📋 Управление миссиями</Button></Link>
            <Link href="/specializations"><Button className="w-full justify-start" variant="outline" title="Перейти к управлению специализациями">⭐ Управление специализациями</Button></Link>
            <Link href="/vehicles"><Button className="w-full justify-start" variant="outline" title="Перейти к управлению техникой">🚁 Управление техникой</Button></Link>
            <Link href="/settings"><Button className="w-full justify-start" variant="outline" title="Перейти к настройкам приложения">⚙️ Настройки синхронизации</Button></Link>
            <Link href="/roster"><Button className="w-full justify-start" variant="outline" title="Перейти к ростеру бойцов">📋 Ростер бойцов</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
    </RequirePerm>
  );
}
