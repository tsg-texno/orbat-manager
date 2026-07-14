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
    mission?.slotGroups.flatMap(g => g.slots) ?? [],
    [mission?.slotGroups]
  );
  const taken = allSlots.filter(s => s.status === 'taken_by_us').length;
  const available = allSlots.filter(s => s.status === 'available').length;
  const reserve = allSlots.filter(s => s.status === 'reserve').length;
  const occupied = allSlots.filter(s => s.status === 'occupied_by_others').length;

  const handleGroupVehicle = (groupId: string, vehicleId: string | undefined) => {
    const group = mission?.slotGroups.find(g => g.id === groupId);
    if (!group) return;
    const vt = vehicleTypes.find(v => v.id === vehicleId);
    if (!vt) {
      updateSlotGroup(missionId, groupId, { vehicleId: undefined });
      return;
    }
    // Add missing crew slots
    const newSlots = [...group.slots];
    const existingTitles = new Map(newSlots.map(s => [s.title.toLowerCase(), s]));
    let added = 0;
    for (const crewTitle of (vt.crewSlots || [])) {
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
    updateSlotGroup(missionId, groupId, { vehicleId: vt.id, slots: added > 0 ? newSlots : undefined, totalSlots: added > 0 ? newSlots.length : group.totalSlots });
    if (added > 0 && !group.vehicleId) {
      // Also add vehicle slots via autoAssign for existing matching slots
      const updated = autoAssignVehicles(newSlots, vehicleAssociations, group.name);
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].vehicleId !== group.slots[i]?.vehicleId) {
          updateSlot(missionId, groupId, updated[i].id, { vehicleId: updated[i].vehicleId });
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
            const groupVt = group.vehicleId ? vehicleTypes.find(v => v.id === group.vehicleId) : null;
            return (
            <Card key={group.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {groupVt?.icon && <img src={`/icons/${groupVt.icon}`} alt="" className="w-7 h-7" />}
                  {group.name}
                  <Badge variant="secondary" className="text-xs">{group.slots.length} слотов</Badge>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 mr-2">
                    <Select value={group.vehicleId || 'none'} onValueChange={(v) => handleGroupVehicle(group.id, v === 'none' ? '' : v || '')}>
                      <SelectTrigger className="h-7 text-[11px] w-auto max-w-[140px]">
                        <SelectValue placeholder="Техника отд." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Нет техники —</SelectItem>
                        {vehicleTypes.map(vt => (
                          <SelectItem key={vt.id} value={vt.id} className="text-xs">
                            {vt.icon && <img src={`/icons/${vt.icon}`} alt="" className="w-4 h-4 inline-block mr-1" />}
                            {vt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {groupVt && (
                      <span className="text-[10px] text-muted-foreground">
                        {groupVt.crewSlots?.length ? `👤×${groupVt.crewSlots.length}` : ''}
                      </span>
                    )}
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
