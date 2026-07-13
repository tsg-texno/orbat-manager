'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

export default function MissionsPage() {
  const { missions, addMission, deleteMission } = useAppStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [map, setMap] = useState('');
  const [faction, setFaction] = useState('ВДВ РФ');
  const [factionType, setFactionType] = useState<'red' | 'blue'>('red');
  const [server, setServer] = useState(3);

  const handleCreate = () => {
    if (!name.trim()) return;
    addMission({
      name: name.trim(),
      date,
      map,
      faction,
      factionType,
      server,
      slotGroups: [],
      syncRoomKey: `orbat-${Date.now()}`,
    });
    setName(''); setDate(''); setMap('');
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Миссии</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>+ Новая миссия</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Создать миссию</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Название миссии</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Снегопад" /></div>
              <div><Label>Дата</Label><Input value={date} onChange={e => setDate(e.target.value)} placeholder="17.07.2026" /></div>
              <div><Label>Карта</Label><Input value={map} onChange={e => setMap(e.target.value)} placeholder="Напф (зима)" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Фракция</Label>
                  <Select value={faction} onValueChange={(v) => v && setFaction(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ВДВ РФ">ВДВ РФ</SelectItem>
                      <SelectItem value="Мотострелковые войска РФ">Мотострелковые войска РФ</SelectItem>
                      <SelectItem value="ЧСО">ЧСО</SelectItem>
                      <SelectItem value="Морпехи США">Морпехи США</SelectItem>
                      <SelectItem value="101st Airborne">101st Airborne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Сторона</Label>
                  <Select value={factionType} onValueChange={(v) => v && setFactionType(v as 'red' | 'blue')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="red">Красные</SelectItem>
                      <SelectItem value="blue">Синие</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Сервер</Label><Input type="number" value={server} onChange={e => setServer(Number(e.target.value))} /></div>
              <Button onClick={handleCreate} className="w-full">Создать</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {missions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Нет миссий. Создайте первую.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {missions.map(m => (
            <Card key={m.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{m.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{m.date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.factionType === 'red' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    {m.factionType === 'red' ? 'Красные' : 'Синие'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-1">🗺 {m.map || '—'}</p>
                <p className="text-sm text-muted-foreground mb-1">⚔️ {m.faction}</p>
                <p className="text-sm text-muted-foreground mb-3">🎯 {m.slotGroups.reduce((a, g) => a + g.slots.length, 0)} слотов</p>
                <div className="flex gap-2">
                  <Link href={`/missions/${m.id}`} className="flex-1">
                    <Button size="sm" variant="default" className="w-full">Открыть</Button>
                  </Link>
                  <Button size="sm" variant="destructive" onClick={() => deleteMission(m.id)}>✕</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
