'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Permission } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { RequirePerm, RequireEdit } from '@/components/auth/RequirePerm';

const allPermissions: { key: Permission; label: string }[] = [
  { key: 'manage_roles', label: 'Управление ролями' },
  { key: 'manage_specializations', label: 'Управление специализациями' },
  { key: 'manage_vehicles', label: 'Управление техникой' },
  { key: 'manage_missions', label: 'Управление миссиями' },
  { key: 'manage_slots', label: 'Управление слотами' },
  { key: 'assign_specializations', label: 'Назначение специализаций' },
  { key: 'assign_self_to_slot', label: 'Запись в слот' },
  { key: 'view_roster', label: 'Просмотр ростера' },
  { key: 'view_orbat', label: 'Просмотр расстановки' },
  { key: 'view_specializations', label: 'Просмотр специализаций' },
  { key: 'view_vehicles', label: 'Просмотр техники' },
  { key: 'sync_data', label: 'Синхронизация данных' },
];

export default function RolesPage() {
  const { roles, addRole, updateRole, deleteRole } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#22c55e');
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const reset = () => { setName(''); setColor('#22c55e'); setPermissions([]); setEditId(null); };

  const handleEdit = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (!role) return;
    setName(role.name); setColor(role.color); setPermissions(role.permissions);
    setEditId(id); setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editId) updateRole(editId, { name: name.trim(), color, permissions });
    else addRole({ name: name.trim(), color, permissions });
    reset(); setOpen(false);
  };

  const togglePerm = (perm: Permission) => {
    setPermissions(p => p.includes(perm) ? p.filter(x => x !== perm) : [...p, perm]);
  };

  return (
    <RequirePerm perm="manage_roles">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Роли и права</h1>
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
          <DialogTrigger onClick={() => { reset(); setOpen(true); }}>+ Новая роль</DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? 'Редактировать' : 'Создать'} роль</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1"><Label>Название</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="КО" /></div>
                <div className="w-20"><Label>Цвет</Label><Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10" /></div>
              </div>
              <div><Label>Права</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {allPermissions.map(p => (
                    <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={permissions.includes(p.key)} onCheckedChange={() => togglePerm(p.key)} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">Сохранить</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Цвет</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Права</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(role => (
                <TableRow key={role.id}>
                  <TableCell><div className="w-6 h-6 rounded" style={{ backgroundColor: role.color }} /></TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {role.permissions.length === 0 ? <span className="text-xs text-muted-foreground">Нет прав</span> :
                        role.permissions.map(p => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {allPermissions.find(ap => ap.key === p)?.label || p}
                          </Badge>
                        ))
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(role.id)}>✏️</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteRole(role.id)} className="text-destructive">🗑</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </RequirePerm>
  );
}
