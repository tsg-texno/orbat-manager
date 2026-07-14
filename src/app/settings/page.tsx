'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { configureSync, loadSyncConfig, isSyncConfigured, pushState, pullState } from '@/lib/sync';
import { generateId } from '@/lib/utils';
import { usePermissions } from '@/lib/usePermissions';
import type { AppUser } from '@/lib/types';

export default function SettingsPage() {
  const { user, users, setUser, updateUser, deleteUser, logout, fighters, roles, assignUserToFighter, syncEnabled, setSyncEnabled, offlineMode, setOfflineMode, lastSyncTimestamp, importState } = useAppStore();
  const { can } = usePermissions();

  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [userName, setUserName] = useState('');
  const [userPin, setUserPin] = useState('');
  const [userFighter, setUserFighter] = useState('');
  const [userRole, setUserRole] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editFighter, setEditFighter] = useState('');
  const [editRole, setEditRole] = useState('');

  const openEdit = (u: AppUser) => {
    setEditUserId(u.id); setEditName(u.name); setEditPin(''); setEditFighter(u.fighterId || ''); setEditRole(u.roleIds[0] || '');
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (!editName.trim() || !editUserId) return;
    const data: Partial<AppUser> = { name: editName.trim(), fighterId: editFighter || undefined, roleIds: editRole ? [editRole] : [] };
    if (editPin.trim()) data.pin = editPin.trim();
    const wasCurrent = user?.id === editUserId;
    updateUser(editUserId, data);
    if (editFighter) assignUserToFighter(editUserId, editFighter);
    setEditOpen(false);
  };

  useEffect(() => {
    const cfg = loadSyncConfig();
    setBotToken(cfg.botToken);
    setChatId(cfg.chatId);
    if (user) {
      setUserName(user.name);
      setUserPin(user.pin || '');
      setUserFighter(user.fighterId || '');
      setUserRole(user.roleIds[0] || '');
    }
  }, [user]);

  const handleSaveSync = () => {
    configureSync(botToken, chatId);
  };

  const handleSaveUser = () => {
    if (!userName.trim()) return;
    const updated: Partial<AppUser> = {
      name: userName.trim(),
      pin: userPin || user?.pin,
      fighterId: userFighter || undefined,
      roleIds: userRole ? [userRole] : [],
    };
    if (user) {
      updateUser(user.id, updated);
      if (userFighter) assignUserToFighter(user.id, userFighter);
    }
  };

  const handleExport = () => {
    const state = {
      fighters,
      missions: useAppStore.getState().missions,
      specializations: useAppStore.getState().specializations,
      vehicleTypes: useAppStore.getState().vehicleTypes,
      vehicleAssociations: useAppStore.getState().vehicleAssociations,
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orbat-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        importState(data);
        alert('Данные импортированы');
      } catch { alert('Ошибка импорта'); }
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Настройки</h1>

      <Card>
        <CardHeader><CardTitle>Профиль пользователя</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Имя / Позывной</Label><Input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Ваш позывной" /></div>
          <div><Label>ПИН-код</Label>
            <Input type="password" value={userPin} onChange={e => setUserPin(e.target.value)} placeholder="Новый ПИН-код" />
          </div>
          {can('manage_settings') && (
            <><div><Label>Связать с бойцом</Label>
            <Select value={userFighter} onValueChange={(v) => v && setUserFighter(v)}>
              <SelectTrigger><SelectValue placeholder="Выберите бойца" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Не выбрано —</SelectItem>
                {fighters.filter(f => !users.some(u => u.fighterId === f.id && u.id !== user?.id)).map(f => <SelectItem key={f.id} value={f.id}>{f.nickname} ({f.status})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Роль</Label>
            <Select value={userRole} onValueChange={(v) => v && setUserRole(v)}>
              <SelectTrigger><SelectValue placeholder="Выберите роль" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Не выбрано —</SelectItem>
                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div></>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSaveUser}>Сохранить</Button>
            <Button variant="outline" onClick={logout}>Выйти</Button>
          </div>
        </CardContent>
      </Card>

      {can('manage_settings') && (
      <Card>
        <CardHeader><CardTitle>Управление пользователями</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет пользователей</p>
          ) : (
            <div className="divide-y">
              {users.map(u => {
                const f = fighters.find(f => f.id === u.fighterId);
                const userRoles = u.roleIds.map(rid => roles.find(r => r.id === rid)).filter(Boolean);
                return (
                  <div key={u.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {f ? `🎖 ${f.nickname}` : '— боец не привязан'}
                        {userRoles.length > 0 ? ` · ${userRoles.map(r => r!.name).join(', ')}` : ' · 🔒 нет роли'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => openEdit(u)}>✏️</Button>
                      {u.id !== user?.id && (
                        <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0 text-xs"
                          onClick={() => { if (confirm(`Удалить пользователя ${u.name}?`)) deleteUser(u.id); }}>✕</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Редактировать пользователя</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Имя / Позывной</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div><Label>Новый ПИН-код (оставьте пустым, если не меняете)</Label>
                <Input type="password" value={editPin} onChange={e => setEditPin(e.target.value)} placeholder="Оставьте пустым" />
              </div>
              <div><Label>Привязать к бойцу</Label>
                <Select value={editFighter} onValueChange={(v) => v && setEditFighter(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Выберите бойца" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Не привязан —</SelectItem>
                    {fighters.filter(f => !users.some(u => u.fighterId === f.id && u.id !== editUserId)).map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nickname} ({f.status})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Роль</Label>
                <Select value={editRole} onValueChange={(v) => v && setEditRole(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Выберите роль" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Нет роли —</SelectItem>
                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditSave} className="w-full">Сохранить</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
      )}

      {can('manage_settings') && (<>
      <Card>
        <CardHeader><CardTitle>Бэкап данных</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Все данные хранятся локально в браузере. Экспортируйте или импортируйте для переноса между устройствами.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>📤 Экспорт JSON</Button>
            <Button variant="outline" onClick={handleImport}>📥 Импорт JSON</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>⚙ Синхронизация через Telegram (опционально)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Необязательно. Приложение полностью работает без синхронизации — все данные хранятся локально.</p>

          <div className="flex items-center justify-between">
            <div>
              <Label>Включить синхронизацию</Label>
              <p className="text-xs text-muted-foreground">Автоматический push/pull изменений</p>
            </div>
            <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Офлайн режим</Label>
              <p className="text-xs text-muted-foreground">Изменения копятся локально, синхронизация по кнопке</p>
            </div>
            <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
          </div>

          <div><Label>Telegram Bot Token</Label>
            <Input value={botToken} onChange={e => setBotToken(e.target.value)} placeholder="1234567890:ABCdef..." type="password" />
          </div>
          <div><Label>Chat ID (личный)</Label>
            <Input value={chatId} onChange={e => setChatId(e.target.value)} placeholder="123456789" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveSync}>Сохранить настройки</Button>
            <Button variant="outline" onClick={async () => {
              const store = useAppStore.getState();
              await pushState({
                users: store.users, fighters: store.fighters, missions: store.missions,
                roles: store.roles, specializations: store.specializations,
                vehicleTypes: store.vehicleTypes, vehicleAssociations: store.vehicleAssociations,
              });
              const remote = await pullState();
              if (remote) {
                const merged: any = {};
                for (const key of ['users', 'fighters', 'missions', 'roles', 'specializations', 'vehicleTypes', 'vehicleAssociations']) {
                  if ((remote as any)[key] && JSON.stringify((remote as any)[key]) !== JSON.stringify(store[key as keyof typeof store])) {
                    merged[key] = (remote as any)[key];
                  }
                }
                if (Object.keys(merged).length > 0) store.importState(merged);
              }
              store.setLastSyncTimestamp(Date.now());
              alert('Синхронизация завершена');
            }}>🔄 Принудительная синхронизация</Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
            <p>🟢 Статус: {isSyncConfigured() ? 'Настроен' : 'Не настроен'}</p>
            <p>🕐 Последняя синхронизация: {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString() : 'никогда'}</p>
          </div>
        </CardContent>
      </Card>
      </>)}
    </div>
  );
}
