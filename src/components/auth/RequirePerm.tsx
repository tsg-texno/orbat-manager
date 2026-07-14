'use client';
import { usePermissions } from '@/lib/usePermissions';
import type { Permission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function RequirePerm({ perm, children }: { perm: Permission | Permission[]; children: React.ReactNode }) {
  const { canAny } = usePermissions();
  const perms = Array.isArray(perm) ? perm : [perm];
  if (!canAny(...perms)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Нет доступа</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">У вашей учётной записи нет прав для просмотра этой страницы.</p>
            <Link href="/"><Button variant="outline" size="sm" title="Вернуться на главную страницу">На дашборд</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}

export function RequireEdit({ perm, children, fallback }: { perm: Permission; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { can } = usePermissions();
  if (!can(perm)) {
    return <>{fallback || null}</>;
  }
  return <>{children}</>;
}