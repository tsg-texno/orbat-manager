'use client';
import { useAppStore } from '@/store/appStore';

export function useSeedLoader() {
  const { fighters, setFighters, missions, addMission, specializations, addSpecialization, vehicleTypes, addVehicleType } = useAppStore();

  const loadSeed = async () => {
    if (fighters.length > 0 || missions.length > 0) return;

    try {
      const resp = await fetch('/seed-data.json');
      const data = await resp.json();

      if (data.fighters && fighters.length === 0) {
        setFighters(data.fighters);
      }

      if (data.specializations && specializations.length === 0) {
        for (const spec of data.specializations) {
          addSpecialization({ name: spec.name, icon: spec.icon, matchPatterns: spec.matchPatterns, category: spec.category, color: spec.color, createdBy: spec.createdBy });
        }
      }

      if (data.vehicleTypes && vehicleTypes.length === 0) {
        for (const vt of data.vehicleTypes) {
          addVehicleType({ name: vt.name, model: vt.model, faction: vt.faction, category: vt.category, icon: vt.icon, matchPatterns: vt.matchPatterns, crewSize: vt.crewSize });
        }
      }

      if (data.missions && missions.length === 0) {
        for (const m of data.missions) {
          addMission({ name: m.name, date: m.date, map: m.map, faction: m.faction, factionType: m.factionType, server: m.server, slotGroups: m.slotGroups || [], syncRoomKey: `orbat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
        }
      }
    } catch (e) {
      console.warn('Seed loader: no seed data found or error loading', e);
    }
  };

  return { loadSeed };
}
