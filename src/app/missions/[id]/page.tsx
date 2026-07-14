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
import { usePermissions } from '@/lib/usePermissions';
import { RequirePerm, RequireEdit } from '@/components/auth/RequirePerm';

export default function MissionDetailPage() {
  const params = useParams();
  const missionId = params.id as string;
  const mission = useAppStore(s => s.missions.find(m => m.id === missionId));
  const { addSlotGroup, removeSlotGroup, updateSlotGroup, updateSlot, updateMission, addVehicleAssociation, addSpecializationAssociation, fighters, specializations, vehicleTypes, vehicleAssociations, specializationAssociations } = useAppStore();

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const handlePaste = () => {
    const parsed = parseSlotText(pasteText);
    if (!parsed) return;
    const withSpecs = autoAssignSpecializations(parsed.slots, specializations, specializationAssociations);
    const { slots: withVehicles, matchedVehicleIds } = autoAssignVehicles(withSpecs, vehicleAssociations, parsed.name, undefined, specializations);
    const deduped = [...new Set(matchedVehicleIds.filter(Boolean))];
    addSlotGroup(missionId, { ...parsed, slots: withVehicles, vehicleIds: deduped.length > 0 ? deduped : undefined });
    setPasteText('');
    setPasteOpen(false);
  };

  const reapplyVehicles = () => {
    if (!mission) return;
    for (const group of mission.slotGroups) {
      const allInGroup = group.slots || [];
      const vehicleCounts = new Map<string, number>();
      for (const slot of allInGroup) {
        if (slot.vehicleManuallySet) continue;
        const { slots: assigned } = autoAssignVehicles([slot], vehicleAssociations, group.name, undefined, specializations);
        if (assigned[0].vehicleId !== slot.vehicleId) {
          updateSlot(missionId, group.id, slot.id, { vehicleId: assigned[0].vehicleId });
        }
        if (assigned[0].vehicleId) {
          vehicleCounts.set(assigned[0].vehicleId, (vehicleCounts.get(assigned[0].vehicleId) || 0) + 1);
        }
      }
      // Build vehicleIds — divide matched count by crewSize
      const newVehicleIds: string[] = [];
      for (const [vid, count] of vehicleCounts) {
        const vt = vehicleTypes.find(v => v.id === vid);
        const crewSize = vt?.crewSize ?? 1;
        const instances = Math.ceil(count / crewSize);
        for (let i = 0; i < instances; i++) newVehicleIds.push(vid);
      }
      updateSlotGroup(missionId, group.id, { vehicleIds: newVehicleIds.length > 0 ? newVehicleIds : undefined });
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

  const addGroupVehicle = (groupId: string, vehicleId: string) => {
    const group = mission?.slotGroups.find(g => g.id === groupId);
    if (!group) return;
    const current = group.vehicleIds || [];
    const next = [...current, vehicleId];
    updateSlotGroup(missionId, groupId, { vehicleIds: next });
    // Auto-create missing crew slots
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
  };

  const removeGroupVehicle = (groupId: string, vehicleId: string, instanceIndex: number) => {
    const group = mission?.slotGroups.find(g => g.id === groupId);
    if (!group) return;
    const current = group.vehicleIds || [];
    let count = -1;
    const next = current.filter(v => { if (v === vehicleId) { count++; return count !== instanceIndex; } return true; });
    updateSlotGroup(missionId, groupId, { vehicleIds: next.length > 0 ? next : undefined });
  };

  if (!mission) return (
    <div className="text-center py-12">
      <p className="text-xl text-muted-foreground mb-4">Миссия не найдена</p>
      <Link href="/missions"><Button title="Вернуться к списку миссий">Вернуться к списку</Button></Link>
    </div>
  );

  return (
    <RequirePerm perm="view_orbat">
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
          <RequireEdit perm="manage_slots"><Button variant="outline" size="sm" onClick={reapplyVehicles} title="Переприменить ассоциации техники">
            🔄 Техника
          </Button></RequireEdit>
          <RequireEdit perm="manage_slots">
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
                <Button onClick={handlePaste} className="w-full" title="Разобрать текст и создать группы слотов">Добавить расстановку</Button>
              </div>
            </DialogContent>
          </Dialog>
          </RequireEdit>
        </div>
      </div>

      {mission.slotGroups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-lg mb-2">Нет расстановки</p>
            <p className="text-sm mb-4">Вставьте скопированную расстановку из игры или из текстового файла</p>
            <RequireEdit perm="manage_slots"><Button onClick={() => setPasteOpen(true)} title="Вставить скопированную из игры расстановку">📋 Вставить расстановку</Button></RequireEdit>
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
                  <RequireEdit perm="manage_slots">
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 text-xs rounded-md border bg-background px-2"
                      value=""
                      onChange={e => { if (e.target.value) { addGroupVehicle(group.id, e.target.value); e.target.value = ''; } }}
                    >
                      <option value="">+ Добавить технику</option>
                      {vehicleTypes.map(vt => (
                        <option key={vt.id} value={vt.id}>{vt.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[11px] px-2" title="Сохранить соответствие техники и специализаций слотам как ассоциации"
                    onClick={() => {
                      let vehAdded = 0;
                      let specAdded = 0;
                      // Group slots by vehicle type to create one association per vehicle
                      const vehGroups = new Map<string, { titles: string[]; specNames: Set<string> }>();
                      for (const s of group.slots) {
                        if (s.vehicleId) {
                          if (!vehGroups.has(s.vehicleId)) vehGroups.set(s.vehicleId, { titles: [], specNames: new Set() });
                          const entry = vehGroups.get(s.vehicleId)!;
                          entry.titles.push(s.title);
                          if (s.specializationId) {
                            const sp = specializations.find(sp => sp.id === s.specializationId);
                            if (sp) entry.specNames.add(sp.name);
                          }
                        }
                      }
                      for (const [vehicleId, { titles, specNames }] of vehGroups) {
                        const vt = vehicleTypes.find(v => v.id === vehicleId);
                        if (!vt) continue;
                        // Derive pattern from vehicle model or name
                        const pattern = vt.model || vt.name;
                        const exists = vehicleAssociations.some(va => va.slotPattern === pattern && va.squadPattern === group.name);
                        if (!exists) {
                          addVehicleAssociation({
                            slotPattern: pattern,
                            squadPattern: group.name,
                            vehicleTypeId: vehicleId,
                            dependsOnSlots: specNames.size > 0 ? Array.from(specNames) : undefined,
                          });
                          vehAdded++;
                        }
                      }
                      // Per-slot specialization associations
                      for (const s of group.slots) {
                        if (s.specializationId) {
                          const exists = specializationAssociations.some(
                            sa => sa.slotPattern === s.title && sa.squadPattern === group.name
                          );
                          if (!exists) {
                            addSpecializationAssociation({ slotPattern: s.title, squadPattern: group.name, specializationId: s.specializationId });
                            specAdded++;
                          }
                        }
                      }
                      const msgs = [];
                      if (vehAdded > 0) msgs.push(`техники: ${vehAdded}`);
                      if (specAdded > 0) msgs.push(`специализаций: ${specAdded}`);
                      if (msgs.length > 0) alert(`Сохранено ассоциаций: ${msgs.join(', ')}`);
                      else alert('Новых ассоциаций нет');
                    }}>
                    💾 Запомнить
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Удалить группу слотов"
                    onClick={() => removeSlotGroup(missionId, group.id)}>
                    ✕
                  </Button>
                  </RequireEdit>
                </div>
              </CardHeader>
              {groupVts.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {(() => {
                    const instanceCount = new Map<string, number>();
                    return (group.vehicleIds || []).map((vid, idx) => {
                      const vt = vehicleTypes.find(v => v.id === vid);
                      if (!vt) return null;
                      const count = instanceCount.get(vid) || 0;
                      instanceCount.set(vid, count + 1);
                      return (
                        <div key={`${vid}-${idx}`} className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-primary/30 bg-primary/5 relative group/veh">
                          <RequireEdit perm="manage_slots">
                            <button
                              onClick={() => removeGroupVehicle(group.id, vid, count)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-none flex items-center justify-center opacity-0 group-hover/veh:opacity-100 transition-opacity"
                              title="Убрать"
                            >✕</button>
                          </RequireEdit>
                          {vt.icon && <img src={`/icons/${vt.icon}`} alt={vt.name} className="w-[72px] h-12" />}
                          <span className="text-[10px] font-medium text-center leading-tight">{vt.name}</span>
                          <span className="text-[9px] text-muted-foreground">×{(vt.crewSize ?? 1)}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    // Group consecutive slots with same vehicleId into crews
                    const groups: { vehicleId: string | undefined; slots: typeof group.slots }[] = [];
                    for (const s of group.slots || []) {
                      const last = groups[groups.length - 1];
                      if (last && last.vehicleId && last.vehicleId === s.vehicleId) {
                        last.slots.push(s);
                      } else {
                        groups.push({ vehicleId: s.vehicleId, slots: [s] });
                      }
                    }
                    return groups.map((grp, gi) => {
                      const vt = grp.vehicleId ? vehicleTypes.find(v => v.id === grp.vehicleId) : null;
                      const crewSize = vt?.crewSize ?? 1;
                      const isCrew = grp.vehicleId && grp.slots.length > 1;
                      return (
                        <div key={gi} className={isCrew ? 'rounded-lg border border-primary/20 bg-primary/[0.02] p-2 space-y-1.5' : 'space-y-1.5'}>
                          {isCrew && (
                            <div className="flex items-center gap-1.5 px-1.5 pb-1 border-b border-primary/10">
                              {vt?.icon && <img src={`/icons/${vt.icon}`} alt="" className="w-[30px] h-5" />}
                              <span className="text-[10px] font-medium text-muted-foreground">Экипаж ×{grp.slots.length} — {vt?.name}</span>
                            </div>
                          )}
                          {grp.slots.map(slot => (
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
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
    </RequirePerm>
  );
}
