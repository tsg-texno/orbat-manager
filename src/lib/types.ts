export interface Fighter {
  id: string;
  nickname: string;
  status: 'active' | 'reserve' | 'missing' | 'rare' | 'break' | 'cadet';
  build: string;
  attendance: number;
  attendanceSlots: number[];
  userId?: string;
}

export interface AppUser {
  id: string;
  name: string;
  fighterId?: string;
  roleIds: string[];
  telegramChatId?: string;
  telegramRegistered: boolean;
  lastSyncTimestamp: number;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: Permission[];
}

export type Permission =
  | 'manage_roles'
  | 'manage_specializations'
  | 'manage_vehicles'
  | 'manage_missions'
  | 'manage_slots'
  | 'assign_specializations'
  | 'assign_self_to_slot'
  | 'view_roster'
  | 'view_orbat'
  | 'view_specializations'
  | 'view_vehicles'
  | 'sync_data';

export interface Mission {
  id: string;
  name: string;
  date: string;
  map: string;
  faction: string;
  factionType: 'red' | 'blue';
  server: number;
  slotGroups: SlotGroup[];
  syncRoomKey: string;
  createdAt: number;
  updatedAt: number;
}

export interface SlotGroup {
  id: string;
  name: string;
  totalSlots: number;
  slots: Slot[];
  squadType?: string;
}

export interface Slot {
  id: string;
  title: string;
  specializationId?: string;
  vehicleId?: string;
  status: SlotStatus;
  occupiedBy?: string;
  occupiedByUserId?: string;
}

export type SlotStatus = 'available' | 'taken_by_us' | 'reserve' | 'occupied_by_others';

export interface Specialization {
  id: string;
  name: string;
  icon: string;
  matchPatterns: string[];
  category: string;
  color: string;
  createdBy: string;
}

export interface VehicleType {
  id: string;
  name: string;
  model: string;
  faction: 'ru' | 'us' | 'generic';
  category: string;
  icon: string;
  matchPatterns: string[];
}

export interface VehicleAssociation {
  id: string;
  slotPattern: string;
  vehicleTypeId: string;
  squadPattern?: string;
}

export interface SyncDelta {
  path: string;
  value: unknown;
  timestamp: number;
  userId: string;
  op: 'update' | 'delete' | 'create';
}

export interface AppState {
  user: AppUser | null;
  fighters: Fighter[];
  missions: Mission[];
  roles: Role[];
  specializations: Specialization[];
  vehicleTypes: VehicleType[];
  vehicleAssociations: VehicleAssociation[];
  syncEnabled: boolean;
  lastSyncTimestamp: number;
  pendingDeltas: SyncDelta[];
  offlineMode: boolean;
}
