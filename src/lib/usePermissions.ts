import { useAppStore } from '@/store/appStore';
import type { Permission } from '@/lib/types';

export function usePermissions() {
  const user = useAppStore(s => s.user);
  const roles = useAppStore(s => s.roles);
  const perms = new Set<Permission>();

  if (user && roles.length > 0) {
    for (const rid of user.roleIds) {
      const role = roles.find(r => r.id === rid);
      if (role) {
        for (const p of role.permissions) {
          perms.add(p);
        }
      }
    }
  }

  const can = (p: Permission) => perms.has(p);
  const canAny = (...ps: Permission[]) => ps.some(p => perms.has(p));

  return { can, canAny, permissions: perms };
}