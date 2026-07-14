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
import type { VehicleType } from '@/lib/types';
import Link from 'next/link';

export default function MissionDetailPage() {
  const params = useParams();
  const missionId = params.id as string;
  const mission = useAppStore(s => s.missions.find(m => m.id === missionId));
  const { addSlotGroup, removeSlotGroup, updateSlotGroup, updateSlot, updateMission, addVehicleAssociation, fighters, specializations, vehicleTypes, vehicleAssociations } = useAppStore();

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const handlePaste = () => {
    const parsed = parseSlotText(pasteText);
    if (!parsed) return;
    const withSpecs = autoAssignSpecializations(parsed.slots, specializations);
    // Only auto-assign vehicles for slots not manually set
    const withVehicles = autoAssignVehicles(withSpecs, vehicleAssociations, parsed.name);
    addSlotGroup(missionId, { ...parsed, slots: withVehicles });
    setPasteText('');
    setPasteOpen(false);
  };

  const reapplyVehicles = () => {
    if (!mission) return;
    for (const group of mission.slotGroups) {
      for (const slot of group.slots) {
        if (slot.vehicleManuallySet) continue;
        const assigned = autoAssignVehicles([slot], vehicleAssociations, group.name);
        if (assigned[0].vehicleId !== slot.vehicleId) {
          updateSlot(missionId, group.id, slot.id, { vehicleId: assigned[0].vehicleId });
        }
      }
    }
  };

  const allSlots = useMemo(() =>
    (mission?.slotGroups || []).flatMap(g => g.slots || []) ?? [],
    [mission?.slotGroups]
  );
  const taken = allSlots.filter(s => s.status === 'taken_by_us').length;
  const available = allSlots.filter(s => s.status === 'available').length;
  const reserve = allSlots.filter(s => s.status === 'reserve').length;
  const occupied = allSlots.filter(s => s.status === 'occupied_by_others').length;

  const toggleGroupVehicle = (groupId: string, vehicleId: string) => {
    const group = mission?.slotGroups.find(g => g.id === groupId);
    if (!group) return;
    const current = group.vehicleIds || [];
    const idx = current.indexOf(vehicleId);
    const next = idx >= 0 ? current.filter(v => v !== vehicleId) : [...current, vehicleId];
    updateSlotGroup(missionId, groupId, { vehicleIds: next.length > 0 ? next : undefined });
    // If adding, auto-create missing crew slots
    if (idx < 0) {
      const vt = vehicleTypes.find(v => v.id === vehicleId);
      if (vt && vt.crewSlots?.length) {
        const newSlots = [...(group.slots || [])];
        const existingTitles = new Map(newSlots.map(s => [s.title.toLowerCase(), s]));
        let added = 0;
        for (const crewTitle of vt.crewSlots) {
          if (!existingTitles.has(crewTitle.toLowerCase())) {
            newSlots.push({
              id: generateId(),
              title: crewTitle,
              status: 'available',
              vehicleId: vt.id,
              vehicleManuallySet: true,
            });
            added++;
          }
        }
        if (added > 0) {
          updateSlotGroup(missionId, groupId, { vehicleIds: next, slots: newSlots, totalSlots: newSlots.length });
        }
      }
    }
  };

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
          <Button variant="outline" size="sm" onClick={reapplyVehicles} title="Переприменить ассоциации техники">
            🔄 Техника
          </Button>
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
          {mission.slotGroups.map(group => {
            const groupVts: VehicleType[] = (group.vehicleIds || []).map(vid => vehicleTypes.find(v => v.id === vid)).filter((v): v is VehicleType => !!v);
            return (
            <Card key={group.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {group.name}
                  <Badge variant="secondary" className="text-xs">{(group.slots || []).length} слотов</Badge>
                </CardTitle>
                <div className="flex items-center gap-1 flex-wrap">
                  {groupVts.map(vt => (
                    <span key={vt.id} className="text-[10px] text-muted-foreground mr-1">
                      {vt.crewSlots?.length ? `👤×${vt.crewSlots.length}` : ''}
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    {vehicleTypes.map(vt => {
                      const isSelected = group.vehicleIds?.includes(vt.id);
                      return (
                        <button key={vt.id}
                          onClick={() => toggleGroupVehicle(group.id, vt.id)}
                          className={`p-1 rounded border text-xs transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}
                          title={`${isSelected ? 'Убрать' : 'Добавить'} ${vt.name}`}>
                          {vt.icon
                            ? <img src={`/icons/${vt.icon}`} alt={vt.name} className="w-6 h-6" />
                            : <span className="text-[10px] px-1">{vt.name.slice(0, 4)}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[11px] px-2"
                    onClick={() => {
                      let added = 0;
                      for (const s of group.slots) {
                        if (!s.vehicleId) continue;
                        const exists = vehicleAssociations.some(
                          va => va.slotPattern === s.title && va.squadPattern === group.name
                        );
                        if (exists) continue;
                        addVehicleAssociation({
                          slotPattern: s.title,
                          squadPattern: group.name,
                          vehicleTypeId: s.vehicleId,
                        });
                        added++;
                      }
                      if (added > 0) alert(`Сохранено ${added} ассоциаций`);
                      else alert('Новых ассоциаций нет (либо уже есть, либо нет техники в слотах)');
                    }}>
                    💾 Запомнить
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSlotGroup(missionId, group.id)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              {groupVts.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-3">
                  {groupVts.map(vt => (
                    <div key={vt.id} className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-primary/30 bg-primary/5">
                      {vt.icon && <img src={`/icons/${vt.icon}`} alt={vt.name} className="w-12 h-12" />}
                      <span className="text-[10px] font-medium text-center leading-tight">{vt.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <CardContent>
                <div className="space-y-2">
                  {(group.slots || []).map(slot => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      missionId={missionId}
                      groupId={group.id}
                      fighters={fighters}
                      specializations={specializations}
                      vehicleTypes={vehicleTypes}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
