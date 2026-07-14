'use client';
import { useAppStore } from '@/store/appStore';
import { LoginOverlay } from './LoginOverlay';
import { NoAccessStub } from './NoAccessStub';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useAppStore(s => s.user);
  const users = useAppStore(s => s.users);
  const roles = useAppStore(s => s.roles);

  if (users.length === 0 || !user) {
    return <LoginOverlay />;
  }

  const hasAccess = user.roleIds.some(rid =>
    roles.some(r => r.id === rid && r.permissions.length > 0)
  );

  if (!hasAccess) {
    return <NoAccessStub />;
  }

  return <>{children}</>;
}