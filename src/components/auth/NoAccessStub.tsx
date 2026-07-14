'use client';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function NoAccessStub() {
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);
  const fighter = user?.fighterId ? useAppStore(s => s.fighters.find(f => f.id === user!.fighterId)) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Доступ ограничен</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Ваша учётная запись <strong>{user?.name}</strong> создана, но ещё не имеет прав доступа.
          </p>
          {fighter && (
            <p className="text-sm text-muted-foreground">
              Привязанный боец: <strong>{fighter.nickname}</strong>
            </p>
          )}
          <div className="bg-muted rounded-lg p-4 text-sm text-left space-y-2">
            <p>📋 Что делать:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Обратитесь к администратору (КО / Зам.КО)</li>
              <li>Сообщите свой ПИН-код для назначения прав</li>
              <li>После назначения роли перезайдите в приложение</li>
            </ol>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={logout} title="Выйти из учётной записи">Выйти</Button>
            <Link href="/settings"><Button variant="default" title="Перейти к настройкам профиля">Настройки</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}