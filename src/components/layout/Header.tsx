'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { SyncStatus } from '@/components/sync/SyncStatus';
import { usePermissions } from '@/lib/usePermissions';
import { cn } from '@/lib/utils';

const navItems: { href: string; label: string; icon: string; needs: Parameters<ReturnType<typeof usePermissions>['canAny']> }[] = [
  { href: '/', label: 'Дашборд', icon: '📊', needs: ['view_orbat'] },
  { href: '/missions', label: 'Миссии', icon: '🎯', needs: ['view_orbat', 'manage_missions'] },
  { href: '/roster', label: 'Ростер', icon: '📋', needs: ['view_roster'] },
  { href: '/specializations', label: 'Специализации', icon: '⭐', needs: ['view_specializations', 'manage_specializations'] },
  { href: '/vehicles', label: 'Техника', icon: '🚁', needs: ['view_vehicles', 'manage_vehicles'] },
  { href: '/roles', label: 'Роли', icon: '🔑', needs: ['manage_roles'] },
  { href: '/settings', label: 'Настройки', icon: '⚙️', needs: [] as any },
];

export function Header() {
  const pathname = usePathname();
  const user = useAppStore(s => s.user);
  const { canAny } = usePermissions();

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between px-5 h-16">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-xl mr-5 text-foreground">
            ORBAT<span className="text-primary">Manager</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.filter(item => !item.needs.length || canAny(...item.needs)).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-sm transition-colors',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <span className="mr-1.5 text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus />
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.name}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
