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
import { IconPicker } from '@/components/specializations/IconPicker';
import { getAllIcons } from '@/lib/vehicleIcons';

export default function SpecializationsPage() {
  const { specializations, addSpecialization, updateSpecialization, deleteSpecialization } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('GENERIC_INFANTRY-Label.png');
  const [patterns, setPatterns] = useState('');
  const [category, setCategory] = useState('пехота');
  const [color, setColor] = useState('#22c55e');

  const specIcons = getAllIcons().filter(i =>
    ['Пехота', 'Снайпер', 'Разведка', 'Спецназ', 'ВДВ', 'Мотострелки', 'Механизированные', 'Общее'].includes(i.category) ||
    i.filename.includes('OFFICER') || i.filename.includes('VIP') || i.filename.includes('PILOT') ||
    i.filename.includes('TANK_CREW') || i.filename.includes('FLAMETHROWER') || i.filename.includes('HMG') ||
    i.filename.includes('RPG') || i.filename.includes('KONKURS') || i.filename.includes('METIS') ||
    i.filename.includes('IGLA') || i.filename.includes('AGS') || i.filename.includes('PKP') ||
    i.filename.includes('SNIPER') || i.filename.includes('SUPPLY') || i.filename.includes('RECON') ||
    i.filename.includes('RIFLEMEN') || i.filename.includes('BLACK_BERET')
  );

  const reset = () => {
    setName(''); setIcon('GENERIC_INFANTRY-Label.png'); setPatterns(''); setCategory('пехота'); setColor('#22c55e'); setEditId(null);
  };

  const handleEdit = (id: string) => {
    const spec = specializations.find(s => s.id === id);
    if (!spec) return;
    setName(spec.name); setIcon(spec.icon); setPatterns(spec.matchPatterns.join(', ')); setCategory(spec.category); setColor(spec.color);
    setEditId(id); setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), icon, matchPatterns: patterns.split(',').map(s => s.trim()).filter(Boolean), category, color, createdBy: 'user' };
    if (editId) updateSpecialization(editId, data);
    else addSpecialization(data);
    reset(); setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Специализации</h1>
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
          <DialogTrigger onClick={() => setEditId(null)}>+ Новая специализация</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Редактировать' : 'Создать'} специализацию</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Название</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Пулемётчик" /></div>
              <div><Label>Иконка</Label><IconPicker value={icon} onChange={setIcon} icons={specIcons} /></div>
              <div><Label>Паттерны (через запятую)</Label>
                <Input value={patterns} onChange={e => setPatterns(e.target.value)} placeholder="Пулемётчик, Пулеметчик" />
                <p className="text-xs text-muted-foreground mt-1">Названия слотов для автоприсвоения</p>
              </div>
              <div><Label>Цвет</Label><Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10" /></div>
              <div><Label>Категория</Label>
                <select className="w-full rounded-md border p-2 bg-background" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="пехота">Пехота</option>
                  <option value="ПТРК">ПТРК</option>
                  <option value="ПВО">ПВО</option>
                  <option value="артиллерия">Артиллерия</option>
                  <option value="техника">Техника</option>
                  <option value="авиация">Авиация</option>
                  <option value="снайпер">Снайпер</option>
                  <option value="спецназ">Спецназ</option>
                  <option value="медицина">Медицина</option>
                  <option value="командир">Командир</option>
                </select>
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
                <TableHead>Иконка</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Паттерны</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Цвет</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specializations.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Нет специализаций</TableCell></TableRow>
              ) : specializations.map(s => (
                <TableRow key={s.id}>
                  <TableCell><img src={`/icons/${s.icon}`} alt={s.name} className="w-8 h-8 object-contain" /></TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.matchPatterns.join(', ') || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                  <TableCell><div className="w-6 h-6 rounded" style={{ backgroundColor: s.color }} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(s.id)}>✏️</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteSpecialization(s.id)} className="text-destructive">🗑</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Предлагаемые специализации</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { name: 'Пулемётчик', patterns: ['Пулеметчик', 'Пулемётчик'], icon: 'RU_PKP-Label.png' },
            { name: 'Гранатомётчик', patterns: ['Гранатометчик', 'Гранатомётчик', 'РПГ'], icon: 'RU_RPG29-Label.png' },
            { name: 'Пом. гранатомётчика', patterns: ['Помощник гранатометчика'], icon: 'RU_RPG29-Label.png' },
            { name: 'Санитар', patterns: ['Санитар', 'Медик'], icon: 'supply-Label.png' },
            { name: 'Снайпер', patterns: ['Снайпер', 'Стрелок'], icon: 'GENERIC_SNIPER-Label.png' },
            { name: 'ПТРК', patterns: ['ПТРК', 'Конкурс', 'Корнет', 'Метис'], icon: 'RU_KONKURS-Label.png' },
            { name: 'ПЗРК', patterns: ['ПЗРК', 'Игла', 'Стрела'], icon: 'RU_IGLA-Label.png' },
            { name: 'АГС', patterns: ['АГС', 'СПГ'], icon: 'RU_AGS_17-Label.png' },
            { name: 'Командир отделения', patterns: ['Командир отделения', 'Ком.отд'], icon: 'OFFICER-Label.png' },
            { name: 'Старший стрелок', patterns: ['Старший стрелок'], icon: 'GENERIC_RIFLEMEN-Label.png' },
            { name: 'Пулемётчик (ручной)', patterns: ['Ручной пулеметчик', 'РПК'], icon: 'RU_PKP-Label.png' },
            { name: 'Разведчик', patterns: ['Разведчик', 'Разведка', 'Скорпион'], icon: 'GENERIC_RECON-Label.png' },
          ].filter(sugg => !specializations.some(s => s.name === sugg.name)).map(sugg => (
            <Button key={sugg.name} variant="outline" size="sm" className="justify-start h-auto py-2"
              onClick={() => addSpecialization({ name: sugg.name, icon: sugg.icon, matchPatterns: sugg.patterns, category: 'пехота', color: '#22c55e', createdBy: 'system' })}>
              <img src={`/icons/${sugg.icon}`} alt="" className="w-5 h-5 mr-2 object-contain" />
              {sugg.name}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
