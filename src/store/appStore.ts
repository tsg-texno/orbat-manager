import { create } from 'zustand';
import type { AppState, Fighter, Mission, Role, Specialization, VehicleType, VehicleAssociation, SyncDelta, AppUser, SlotGroup } from '@/lib/types';
import { generateId } from '@/lib/utils';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`orbat_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(`orbat_${key}`, JSON.stringify(value)); } catch {}
}

const defaultRoles: Role[] = [
  { id: 'role-ko', name: 'КО', color: '#ef4444', permissions: ['manage_roles', 'manage_specializations', 'manage_vehicles', 'manage_missions', 'manage_slots', 'assign_specializations', 'assign_self_to_slot', 'view_roster', 'view_orbat', 'view_specializations', 'view_vehicles', 'sync_data'] },
  { id: 'role-zamko', name: 'Зам.КО', color: '#f97316', permissions: ['manage_specializations', 'manage_vehicles', 'manage_slots', 'assign_specializations', 'assign_self_to_slot', 'view_roster', 'view_orbat', 'view_specializations', 'view_vehicles', 'sync_data'] },
  { id: 'role-squad', name: 'Командир отделения', color: '#eab308', permissions: ['assign_specializations', 'assign_self_to_slot', 'view_roster', 'view_orbat', 'view_specializations', 'view_vehicles', 'sync_data'] },
  { id: 'role-soldier', name: 'Стрелок', color: '#22c55e', permissions: ['assign_self_to_slot', 'view_orbat'] },
  { id: 'role-cadet', name: 'Курсант', color: '#6b7280', permissions: ['view_orbat'] },
];

interface AppStore extends AppState {
  setUser: (user: AppUser | null) => void;
  setFighters: (fighters: Fighter[]) => void;
  addMission: (mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMission: (id: string, data: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  addSlotGroup: (missionId: string, group: SlotGroup) => void;
  removeSlotGroup: (missionId: string, groupId: string) => void;
  updateSlot: (missionId: string, groupId: string, slotId: string, data: Partial<SlotGroup['slots'][0]>) => void;
  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (id: string, data: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  addSpecialization: (spec: Omit<Specialization, 'id'>) => void;
  updateSpecialization: (id: string, data: Partial<Specialization>) => void;
  deleteSpecialization: (id: string) => void;
  addVehicleType: (vt: Omit<VehicleType, 'id'>) => void;
  updateVehicleType: (id: string, data: Partial<VehicleType>) => void;
  deleteVehicleType: (id: string) => void;
  addVehicleAssociation: (va: Omit<VehicleAssociation, 'id'>) => void;
  removeVehicleAssociation: (id: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setOfflineMode: (offline: boolean) => void;
  addPendingDelta: (delta: SyncDelta) => void;
  clearPendingDeltas: () => void;
  setLastSyncTimestamp: (ts: number) => void;
  importState: (state: Partial<AppState>) => void;
  assignUserToFighter: (userId: string, fighterId: string) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: loadFromStorage<AppUser | null>('user', null),
  fighters: loadFromStorage<Fighter[]>('fighters', []),
  missions: loadFromStorage<Mission[]>('missions', []),
  roles: loadFromStorage<Role[]>('roles', defaultRoles),
  specializations: loadFromStorage<Specialization[]>('specializations', []),
  vehicleTypes: loadFromStorage<VehicleType[]>('vehicleTypes', []),
  vehicleAssociations: loadFromStorage<VehicleAssociation[]>('vehicleAssociations', []),
  syncEnabled: loadFromStorage<boolean>('syncEnabled', true),
  lastSyncTimestamp: loadFromStorage<number>('lastSyncTimestamp', 0),
  pendingDeltas: loadFromStorage<SyncDelta[]>('pendingDeltas', []),
  offlineMode: loadFromStorage<boolean>('offlineMode', false),

  setUser: (user) => { set({ user }); saveToStorage('user', user); },
  setFighters: (fighters) => { set({ fighters }); saveToStorage('fighters', fighters); },
  
  addMission: (mission) => {
    const now = Date.now();
    const m: Mission = { ...mission, id: generateId(), createdAt: now, updatedAt: now };
    set((s) => { const missions = [...s.missions, m]; saveToStorage('missions', missions); return { missions }; });
  },
  updateMission: (id, data) => set((s) => {
    const missions = s.missions.map(m => m.id === id ? { ...m, ...data, updatedAt: Date.now() } : m);
    saveToStorage('missions', missions); return { missions };
  }),
  deleteMission: (id) => set((s) => {
    const missions = s.missions.filter(m => m.id !== id);
    saveToStorage('missions', missions); return { missions };
  }),
  
  addSlotGroup: (missionId, group) => set((s) => {
    const missions = s.missions.map(m => m.id === missionId ? { ...m, slotGroups: [...m.slotGroups, group], updatedAt: Date.now() } : m);
    saveToStorage('missions', missions); return { missions };
  }),
  removeSlotGroup: (missionId, groupId) => set((s) => {
    const missions = s.missions.map(m => m.id === missionId ? { ...m, slotGroups: m.slotGroups.filter(g => g.id !== groupId), updatedAt: Date.now() } : m);
    saveToStorage('missions', missions); return { missions };
  }),
  updateSlot: (missionId, groupId, slotId, data) => set((s) => {
    const missions = s.missions.map(m => m.id === missionId ? {
      ...m, slotGroups: m.slotGroups.map(g => g.id === groupId ? {
        ...g, slots: g.slots.map(sl => sl.id === slotId ? { ...sl, ...data } : sl)
      } : g), updatedAt: Date.now()
    } : m);
    saveToStorage('missions', missions); return { missions };
  }),

  addRole: (role) => { const id = generateId(); set((s) => { const roles = [...s.roles, { ...role, id }]; saveToStorage('roles', roles); return { roles }; }); },
  updateRole: (id, data) => set((s) => { const roles = s.roles.map(r => r.id === id ? { ...r, ...data } : r); saveToStorage('roles', roles); return { roles }; }),
  deleteRole: (id) => set((s) => { const roles = s.roles.filter(r => r.id !== id); saveToStorage('roles', roles); return { roles }; }),

  addSpecialization: (spec) => { const id = generateId(); set((s) => { const specializations = [...s.specializations, { ...spec, id }]; saveToStorage('specializations', specializations); return { specializations }; }); },
  updateSpecialization: (id, data) => set((s) => { const specializations = s.specializations.map(sp => sp.id === id ? { ...sp, ...data } : sp); saveToStorage('specializations', specializations); return { specializations }; }),
  deleteSpecialization: (id) => set((s) => { const specializations = s.specializations.filter(sp => sp.id !== id); saveToStorage('specializations', specializations); return { specializations }; }),

  addVehicleType: (vt) => { const id = generateId(); set((s) => { const vehicleTypes = [...s.vehicleTypes, { ...vt, id }]; saveToStorage('vehicleTypes', vehicleTypes); return { vehicleTypes }; }); },
  updateVehicleType: (id, data) => set((s) => { const vehicleTypes = s.vehicleTypes.map(vt => vt.id === id ? { ...vt, ...data } : vt); saveToStorage('vehicleTypes', vehicleTypes); return { vehicleTypes }; }),
  deleteVehicleType: (id) => set((s) => { const vehicleTypes = s.vehicleTypes.filter(vt => vt.id !== id); saveToStorage('vehicleTypes', vehicleTypes); return { vehicleTypes }; }),

  addVehicleAssociation: (va) => { const id = generateId(); set((s) => { const vehicleAssociations = [...s.vehicleAssociations, { ...va, id }]; saveToStorage('vehicleAssociations', vehicleAssociations); return { vehicleAssociations }; }); },
  removeVehicleAssociation: (id) => set((s) => { const vehicleAssociations = s.vehicleAssociations.filter(va => va.id !== id); saveToStorage('vehicleAssociations', vehicleAssociations); return { vehicleAssociations }; }),

  setSyncEnabled: (syncEnabled) => { set({ syncEnabled }); saveToStorage('syncEnabled', syncEnabled); },
  setOfflineMode: (offlineMode) => { set({ offlineMode }); saveToStorage('offlineMode', offlineMode); },
  addPendingDelta: (delta) => set((s) => { const pendingDeltas = [...s.pendingDeltas, delta]; saveToStorage('pendingDeltas', pendingDeltas); return { pendingDeltas }; }),
  clearPendingDeltas: () => { set({ pendingDeltas: [] }); saveToStorage('pendingDeltas', []); },
  setLastSyncTimestamp: (lastSyncTimestamp) => { set({ lastSyncTimestamp }); saveToStorage('lastSyncTimestamp', lastSyncTimestamp); },

  importState: (partial) => set((s) => {
    const merged = { ...s, ...partial };
    Object.entries({ user: merged.user, fighters: merged.fighters, missions: merged.missions, roles: merged.roles, specializations: merged.specializations, vehicleTypes: merged.vehicleTypes, vehicleAssociations: merged.vehicleAssociations, syncEnabled: merged.syncEnabled, lastSyncTimestamp: merged.lastSyncTimestamp, pendingDeltas: merged.pendingDeltas, offlineMode: merged.offlineMode }).forEach(([k, v]) => saveToStorage(k, v));
    return merged;
  }),

  assignUserToFighter: (userId, fighterId) => set((s) => {
    const fighters = s.fighters.map(f => f.id === fighterId ? { ...f, userId } : f);
    saveToStorage('fighters', fighters); return { fighters };
  }),
}));
