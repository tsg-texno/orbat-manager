import { generateId } from '@/lib/utils';
import type { SlotGroup, Slot, SlotStatus } from '@/lib/types';

export function parseSlotText(text: string): SlotGroup | null {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const headerMatch = lines[0].match(/^(.+?)\s*\((\d+)\)\s*$/);
  if (!headerMatch) return null;

  const name = headerMatch[1].trim();
  const totalSlots = parseInt(headerMatch[2], 10);

  const slotLines = lines.slice(1, 1 + totalSlots);
  const slots: Slot[] = slotLines.map((title) => {
    let status: SlotStatus = 'available';
    let cleanTitle = title;

    if (title.startsWith('[Занят]') || title.startsWith('[ЗАНЯТ]')) {
      status = 'taken_by_us';
      cleanTitle = title.replace(/^\[Занят\]\s*/i, '');
    } else if (title.startsWith('[Резерв]') || title.startsWith('[РЕЗЕРВ]')) {
      status = 'reserve';
      cleanTitle = title.replace(/^\[Резерв\]\s*/i, '');
    } else if (title.startsWith('[') && (title.includes(']'))) {
      status = 'occupied_by_others';
      cleanTitle = title.replace(/^\[[^\]]+\]\s*/, '');
    }

    return {
      id: generateId(),
      title: cleanTitle,
      status,
    };
  });

  return {
    id: generateId(),
    name,
    totalSlots,
    slots,
  };
}

export function autoAssignSpecializations(
  slots: Slot[],
  specializations: { id: string; name: string; matchPatterns: string[] }[]
): Slot[] {
  return slots.map(slot => {
    const match = specializations.find(sp =>
      sp.matchPatterns.some(pattern => {
        try {
          return new RegExp(pattern, 'i').test(slot.title);
        } catch {
          return slot.title.toLowerCase().includes(pattern.toLowerCase());
        }
      })
    );
    if (match) {
      return { ...slot, specializationId: match.id };
    }
    return slot;
  });
}

export function autoAssignVehicles(
  slots: Slot[],
  associations: { id: string; slotPattern: string; vehicleTypeId: string; squadPattern?: string; dependsOnSlots?: string[] }[],
  squadName?: string,
  allSlots?: Slot[]
): { slots: Slot[]; matchedVehicleIds: string[] } {
  const matchedVehicleIds = new Set<string>();
  const result = slots.map((slot, idx) => {
    if (slot.vehicleManuallySet) return slot;
    const match = associations.find(va => {
      try {
        const slotMatch = new RegExp(va.slotPattern, 'i').test(slot.title);
        if (!slotMatch) return false;
        // squadPattern is insignificant — only slot pattern matters for match
        if (va.dependsOnSlots && va.dependsOnSlots.length > 0) {
          const deps = allSlots || slots;
          const allDepMatch = va.dependsOnSlots.every(dp => {
            try { return deps.some(s => new RegExp(dp, 'i').test(s.title)); }
            catch { return deps.some(s => s.title.toLowerCase().includes(dp.toLowerCase())); }
          });
          if (!allDepMatch) return false;
        }
        return true;
      } catch {
        return slot.title.toLowerCase().includes(va.slotPattern.toLowerCase());
      }
    });
    if (match) {
      matchedVehicleIds.add(match.vehicleTypeId);
      return { ...slot, vehicleId: match.vehicleTypeId };
    }
    return slot;
  });
  return { slots: result, matchedVehicleIds: Array.from(matchedVehicleIds) };
}
