'use client';
import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { parseSlotText, autoAssignSpecializations, autoAssignVehicles } from '@/lib/parser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { SlotCard } from '@/components/orbat/SlotCard';
import { generateId } from '@/lib/utils';
import Link from 'next/link';

export default function MissionDetailPage() {
  const params = useParams();
  const missionId = params.id as string;
  const mission = useAppStore(s => s.missions.find(m => m.id === missionId));
  const { addSlotGroup, removeSlotGroup, updateSlot, updateMission, fighters, specializations, vehicleTypes, vehicleAssociations } = useAppStore();

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const handlePaste = () => {
    const parsed = parseSlotText(pasteText);
    if (!parsed) return;
    const withSpecs = autoAssignSpecializations(parsed.slots, specializations);
    const withVehicles = autoAssignVehicles(withSpecs, vehicleAssociations, parsed.name);
    addSlotGroup(missionId, { ...parsed, slots: withVehicles });
    setPasteText('');
    setPasteOpen(false);
  };

  const allSlots = useMemo(() =>
    mission?.slotGroups.flatMap(g => g.slots) ?? [],
    [mission?.slotGroups]
  );
  const taken = allSlots.filter(s => s.status === 'taken_by_us').length;
  const available = allSlots.filter(s => s.status === 'available').length;
  const reserve = allSlots.filter(s => s.status === 'reserve').length;
  const occupied = allSlots.filter(s => s.status === 'occupied_by_others').length;

  const getSpecName = (id?: string) => specializations.find(s => s.id === id)?.name;
  const getVehicleName = (id?: string) => vehicleTypes.find(v => v.id === id)?.name;
  const getVehicleIcon = (id?: string) => vehicleTypes.find(v => v.id === id)?.icon;

  if (!mission) return (
    <div className="text-center py-12">
      <p className="text-xl text-muted-foreground mb-4">Миссия не найдена</p>
      <Link href="/missions"><Button>Вернуться к списку</Button></Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/missions" className="text-sm text-muted-foreground hover:text-foreground">← Миссии</Link>
          </div>
          <h1 className="text-2xl font-bold mt-1">{mission.name}</h1>
          <p className="text-sm text-muted-foreground">{mission.date} — {mission.map} — {mission.faction}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="bg-green-500/10 text-green-500">🟢 {available}</Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-500">🔴 {taken}</Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">🟡 {reserve}</Badge>
            <Badge variant="outline" className="bg-gray-500/10 text-gray-500">⚫ {occupied}</Badge>
          </div>
          <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
            <DialogTrigger>📋 Вставить расстановку</DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Вставить расстановку</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Label>Вставьте текст расстановки (скопированный из игры):</Label>
                <Textarea
                  rows={10}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={`Alpha-2-1 (7)\nКомандир отделения\nСтарший стрелок\nПулеметчик\nГранатометчик\nПомощник гранатометчика\nНаводчик БТР-82А\nВодитель БТР-82А`}
                />
                <Button onClick={handlePaste} className="w-full">Добавить расстановку</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {mission.slotGroups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-lg mb-2">Нет расстановки</p>
            <p className="text-sm mb-4">Вставьте скопированную расстановку из игры или из текстового файла</p>
            <Button onClick={() => setPasteOpen(true)}>📋 Вставить расстановку</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mission.slotGroups.map(group => (
            <Card key={group.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {group.name}
                  <Badge variant="secondary" className="text-xs">{group.slots.length} слотов</Badge>
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSlotGroup(missionId, group.id)}>
                  ✕
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.slots.map(slot => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      missionId={missionId}
                      groupId={group.id}
                      fighters={fighters}
                      specializations={specializations}
                      getSpecName={getSpecName}
                      getVehicleName={getVehicleName}
                      getVehicleIcon={getVehicleIcon}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
