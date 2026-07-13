'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Slot, Fighter, Specialization } from '@/lib/types';
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
  getSpecName: (id?: string) => string | undefined;
  getVehicleName: (id?: string) => string | undefined;
  getVehicleIcon: (id?: string) => string | undefined;
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

export function SlotCard({ slot, missionId, groupId, fighters, specializations, getSpecName, getVehicleName, getVehicleIcon }: SlotCardProps) {
  const { updateSlot } = useAppStore();
  const [assigning, setAssigning] = useState(false);

  const occupant = slot.occupiedBy ? fighters.find(f => f.id === slot.occupiedBy) : null;
  const vehicleIcon = slot.vehicleId ? getVehicleIcon(slot.vehicleId) : null;

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

  return (
    <div className={`flex items-center gap-2 p-2 rounded-md border text-sm ${statusColors[slot.status]}`}>
      <div className="flex-shrink-0 w-5 text-center">{statusIcons[slot.status]}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{slot.title}</span>
          {slot.specializationId && (
            <Badge variant="secondary" className="text-xs px-1 py-0 h-5">
              {getSpecName(slot.specializationId)}
            </Badge>
          )}
          {vehicleIcon && (
            <Tooltip>
              <TooltipTrigger className="text-xs cursor-help inline-flex items-center">
                <img src={vehicleIcon} alt={getVehicleName(slot.vehicleId)} className="w-5 h-5 inline-block" />
              </TooltipTrigger>
              <TooltipContent>{getVehicleName(slot.vehicleId)}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {slot.specializationId && (
          <Badge variant="outline" className="text-xs mr-1">
            {getSpecName(slot.specializationId)}
          </Badge>
        )}

        {slot.status !== 'occupied_by_others' && (
          <>
            {assigning ? (
              <Select onValueChange={handleAssign} defaultValue={slot.occupiedBy || 'none'}>
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue placeholder="Выбрать бойца" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Снять —</SelectItem>
                  {fighters.filter(f => f.status === 'active' || f.status === 'reserve').map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nickname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setAssigning(true)}>
                {occupant ? occupant.nickname : '✚'}
              </Button>
            )}
          </>
        )}

        {occupant && !assigning && (
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-destructive"
            onClick={() => updateSlot(missionId, groupId, slot.id, { occupiedBy: undefined, status: 'available' })}>
            ✕
          </Button>
        )}

        <Select value={slot.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-7 w-24 text-xs">
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
