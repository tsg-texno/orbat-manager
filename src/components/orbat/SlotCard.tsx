'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Slot, Fighter, Specialization, VehicleType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SlotCardProps {
  slot: Slot;
  missionId: string;
  groupId: string;
  fighters: Fighter[];
  specializations: Specialization[];
  vehicleTypes: VehicleType[];
}

const statusColors: Record<string, string> = {
  available: 'border-green-500/30 bg-green-500/5',
  taken_by_us: 'border-red-500/30 bg-red-500/5',
  reserve: 'border-yellow-500/30 bg-yellow-500/5',
  occupied_by_others: 'border-gray-500/30 bg-gray-500/5',
};

const statusLabels: Record<string, string> = {
  available: 'Доступен',
  taken_by_us: 'Занят нами',
  reserve: 'Резерв',
  occupied_by_others: 'Занят другими',
};

const statusIcons: Record<string, string> = {
  available: '🟢',
  taken_by_us: '🔴',
  reserve: '🟡',
  occupied_by_others: '⚫',
};

export function SlotCard({ slot, missionId, groupId, fighters, specializations, vehicleTypes }: SlotCardProps) {
  const { updateSlot } = useAppStore();
  const [assigning, setAssigning] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);

  const occupant = slot.occupiedBy ? fighters.find(f => f.id === slot.occupiedBy) : null;
  const spec = slot.specializationId ? specializations.find(s => s.id === slot.specializationId) : null;
  const vehicle = slot.vehicleId ? vehicleTypes.find(v => v.id === slot.vehicleId) : null;

  const handleAssign = (fighterId: string | null) => {
    if (!fighterId || fighterId === 'none') {
      updateSlot(missionId, groupId, slot.id, { occupiedBy: undefined, occupiedByUserId: undefined, status: 'available' });
    } else {
      updateSlot(missionId, groupId, slot.id, { occupiedBy: fighterId, status: 'taken_by_us' });
    }
    setAssigning(false);
  };

  const handleStatusChange = (status: string | null) => {
    if (status) updateSlot(missionId, groupId, slot.id, { status: status as Slot['status'] });
  };

  const handleSpecializationChange = (specId: string | null) => {
    if (specId) updateSlot(missionId, groupId, slot.id, { specializationId: specId === 'none' ? undefined : specId });
  };

  const handleVehicleChange = (vehicleId: string | null) => {
    if (!vehicleId) return;
    updateSlot(missionId, groupId, slot.id, {
      vehicleId: vehicleId === 'none' ? undefined : vehicleId,
      vehicleManuallySet: vehicleId !== 'none',
    });
    setVehicleOpen(false);
  };

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${statusColors[slot.status]}`}>
      <div className="flex-shrink-0 w-5 text-center text-base">{statusIcons[slot.status]}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{slot.title}</span>
          {spec && (
            <Tooltip>
              <TooltipTrigger className="cursor-help inline-flex items-center">
                <Badge variant="secondary" className="text-sm px-2 py-1 h-7 gap-1.5">
                  {spec.icon && <img src={`/icons/${spec.icon}`} alt="" className="w-6 h-6 inline-block" />}
                  {spec.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{spec.name}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Select value={slot.specializationId || 'none'} onValueChange={handleSpecializationChange}>
            <SelectTrigger className="h-6 text-[11px] w-auto max-w-[140px] border-dashed">
              <SelectValue placeholder="Специализация" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Без специ —</SelectItem>
              {specializations.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.icon && <img src={`/icons/${s.icon}`} alt="" className="w-5 h-5 inline-block mr-1" />}
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger className="inline-flex items-center" onClick={() => setVehicleOpen(true)}>
            {vehicle ? (
              <img src={`/icons/${vehicle.icon}`} alt="" className="w-8 h-8 cursor-pointer" />
            ) : (
              <span className="w-8 h-8 rounded border border-dashed border-muted-foreground inline-block cursor-pointer" />
            )}
          </TooltipTrigger>
          {vehicle && (
            <TooltipContent>
              <p>{vehicle.name}</p>
              {slot.vehicleManuallySet && <p className="text-[10px] text-muted-foreground">(вручную)</p>}
            </TooltipContent>
          )}
        </Tooltip>

        {vehicleOpen && (
          <Select onValueChange={handleVehicleChange} open={true} onOpenChange={(o) => !o && setVehicleOpen(false)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Техника..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Без техники —</SelectItem>
              {vehicleTypes.map(v => (
                <SelectItem key={v.id} value={v.id} className="text-xs">
                  {v.icon && <img src={`/icons/${v.icon}`} alt="" className="w-6 h-6 inline-block mr-1" />}
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {slot.status !== 'occupied_by_others' && (
          <>
            {assigning ? (
              <Select onValueChange={handleAssign} defaultValue={slot.occupiedBy || 'none'}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Боец" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Снять —</SelectItem>
                  {fighters.filter(f => f.status === 'active' || f.status === 'reserve').map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nickname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => setAssigning(true)}>
                {occupant ? occupant.nickname : '✚'}
              </Button>
            )}
          </>
        )}

        {occupant && !assigning && (
          <Button variant="ghost" size="sm" className="h-8 text-xs px-2 text-destructive"
            onClick={() => updateSlot(missionId, groupId, slot.id, { occupiedBy: undefined, status: 'available' })}>
            ✕
          </Button>
        )}

        <Select value={slot.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">🟢 Доступен</SelectItem>
            <SelectItem value="taken_by_us">🔴 Занят</SelectItem>
            <SelectItem value="reserve">🟡 Резерв</SelectItem>
            <SelectItem value="occupied_by_others">⚫ Занят другими</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
