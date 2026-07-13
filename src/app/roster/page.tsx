'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { generateId } from '@/lib/utils';
import type { Fighter } from '@/lib/types';

const statusBadge: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500',
  reserve: 'bg-yellow-500/10 text-yellow-500',
  missing: 'bg-gray-500/10 text-gray-500',
  rare: 'bg-orange-500/10 text-orange-500',
  break: 'bg-purple-500/10 text-purple-500',
  cadet: 'bg-blue-500/10 text-blue-500',
};

const statusLabels: Record<string, string> = {
  active: 'В строю',
  reserve: 'В запасе',
  missing: 'Пропал',
  rare: 'Редкостное',
  break: 'Перерыв',
  cadet: 'Курсант',
};

export default function RosterPage() {
  const { fighters, setFighters, roles, assignUserToFighter } = useAppStore();
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState<Fighter['status']>('active');

  const filtered = fighters.filter(f =>
    f.nickname.toLowerCase().includes(search.toLowerCase())
  );

  const handleImport = () => {
    const lines = importText.trim().split('\n').filter(Boolean);
    const parsed: Fighter[] = [];
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length < 2) continue;
      const nickname = parts[0].trim();
      if (!nickname) continue;
      const status = parts[1].trim().toLowerCase();
      let fighterStatus: Fighter['status'] = 'active';
      if (status.includes('запас')) fighterStatus = 'reserve';
      else if (status.includes('пропал')) fighterStatus = 'missing';
      else if (status.includes('редк')) fighterStatus = 'rare';
      else if (status.includes('перер')) fighterStatus = 'break';
      else if (status.includes('курс')) fighterStatus = 'cadet';
      parsed.push({
        id: generateId(),
        nickname,
        status: fighterStatus,
        build: parts[2]?.trim() || '',
        attendance: parseFloat(parts[3]?.trim() || '0') || 0,
        attendanceSlots: [],
        userId: fighters.find(f => f.nickname === nickname)?.userId,
      });
    }
    if (parsed.length > 0) {
      setFighters([...fighters, ...parsed]);
      setImportText('');
      setImportOpen(false);
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const f: Fighter = {
      id: generateId(),
      nickname: newName.trim(),
      status: newStatus,
      build: '',
      attendance: 0,
      attendanceSlots: [],
    };
    setFighters([...fighters, f]);
    setNewName('');
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Ростер бойцов</h1>
        <div className="flex gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger>📥 Импорт CSV</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Импорт бойцов</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Label>Вставьте данные (nickname,status,build,attendance%):</Label>
                <Textarea rows={10} value={importText} onChange={e => setImportText(e.target.value)}
                  placeholder="Bazl,В строю,Sg,98%" />
                <Button onClick={handleImport} className="w-full">Импортировать</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger>+ Добавить</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Добавить бойца</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Позывной</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                <div><Label>Статус</Label>
                  <select className="w-full rounded-md border p-2 bg-background" value={newStatus} onChange={e => setNewStatus(e.target.value as Fighter['status'])}>
                    <option value="active">В строю</option>
                    <option value="reserve">В запасе</option>
                    <option value="missing">Пропал</option>
                    <option value="rare">Редкостное</option>
                    <option value="break">Перерыв</option>
                    <option value="cadet">Курсант</option>
                  </select>
                </div>
                <Button onClick={handleAdd} className="w-full">Добавить</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Input placeholder="🔍 Поиск по позывному..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Позывной</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Build</TableHead>
                <TableHead>Явка</TableHead>
                <TableHead>Пользователь</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Нет бойцов</TableCell></TableRow>
              ) : filtered.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nickname}</TableCell>
                  <TableCell>
                    <Badge className={statusBadge[f.status]} variant="outline">{statusLabels[f.status]}</Badge>
                  </TableCell>
                  <TableCell>{f.build || '—'}</TableCell>
                  <TableCell>{f.attendance}%</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {f.userId ? roles.find(r => fighters.find(ff => ff.userId === f.userId)?.id)?.name || 'Связан' : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
