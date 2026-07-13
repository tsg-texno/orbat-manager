'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { SyncStatus } from '@/components/sync/SyncStatus';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Дашборд', icon: '📊' },
  { href: '/missions', label: 'Миссии', icon: '🎯' },
  { href: '/roster', label: 'Ростер', icon: '📋' },
  { href: '/specializations', label: 'Специализации', icon: '⭐' },
  { href: '/vehicles', label: 'Техника', icon: '🚁' },
  { href: '/roles', label: 'Роли', icon: '🔑' },
  { href: '/settings', label: 'Настройки', icon: '⚙️' },
];

export function Header() {
  const pathname = usePathname();
  const user = useAppStore(s => s.user);

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-1">
          <Link href="/" className="font-bold text-lg mr-4 text-foreground">
            ORBAT<span className="text-primary">Manager</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <span className="mr-1">{item.icon}</span>
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
