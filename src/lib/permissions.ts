import type { Permission } from '@/lib/types';

export function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required);
}

export function can(userPermissions: Permission[], action: Permission): boolean {
  return hasPermission(userPermissions, action);
}
