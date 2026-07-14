'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/specializations/IconPicker';
import { getAllIcons } from '@/lib/vehicleIcons';
import { usePermissions } from '@/lib/usePermissions';
import { RequirePerm, RequireEdit } from '@/components/auth/RequirePerm';
import type { SpecializationAssociation } from '@/lib/types';

export default function SpecializationsPage() {
  const { specializations, addSpecialization, updateSpecialization, deleteSpecialization, specializationAssociations, addSpecializationAssociation, updateSpecializationAssociation, removeSpecializationAssociation } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('GENERIC_INFANTRY-Label.png');
  const [patterns, setPatterns] = useState('');
  const [category, setCategory] = useState('пехота');
  const [color, setColor] = useState('#22c55e');

  const [assocOpen, setAssocOpen] = useState(false);
  const [assocEditId, setAssocEditId] = useState<string | null>(null);
  const [assocSlotPattern, setAssocSlotPattern] = useState('');
  const [assocSquadPattern, setAssocSquadPattern] = useState('');
  const [assocDependsOn, setAssocDependsOn] = useState('');
  const [assocSpecializationId, setAssocSpecializationId] = useState('');

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

  const resetAssoc = () => {
    setAssocSlotPattern(''); setAssocSquadPattern(''); setAssocDependsOn(''); setAssocSpecializationId(''); setAssocEditId(null); setAssocOpen(false);
  };

  const openAssocEdit = (id: string) => {
    const sa = specializationAssociations.find(a => a.id === id);
    if (!sa) return;
    setAssocSlotPattern(sa.slotPattern);
    setAssocSquadPattern(sa.squadPattern || '');
    setAssocDependsOn((sa.dependsOnSlots || []).join(', '));
    setAssocSpecializationId(sa.specializationId);
    setAssocEditId(id);
    setAssocOpen(true);
  };

  const handleAssocSave = () => {
    if (!assocSlotPattern.trim() || !assocSpecializationId) return;
    const data = {
      slotPattern: assocSlotPattern.trim(),
      squadPattern: assocSquadPattern.trim() || undefined,
      dependsOnSlots: assocDependsOn.trim() ? assocDependsOn.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      specializationId: assocSpecializationId,
    };
    if (assocEditId) updateSpecializationAssociation(assocEditId, data);
    else addSpecializationAssociation(data);
    resetAssoc();
  };

  return (
    <RequirePerm perm={['view_specializations', 'manage_specializations']}>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Специализации</h1>

      <Tabs defaultValue="specs">
        <TabsList className="mb-4">
          <TabsTrigger value="specs">Специализации</TabsTrigger>
          <TabsTrigger value="associations">Ассоциации</TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div />
            <RequireEdit perm="manage_specializations">
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
                  <Button onClick={handleSave} className="w-full" title={editId ? 'Сохранить изменения специализации' : 'Создать новую специализацию'}>Сохранить</Button>
                </div>
              </DialogContent>
            </Dialog>
            </RequireEdit>
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
                      <TableCell><img src={`/icons/${s.icon}`} alt={s.name} className="w-10 h-10 object-contain" /></TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.matchPatterns.join(', ') || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                      <TableCell><div className="w-6 h-6 rounded" style={{ backgroundColor: s.color }} /></TableCell>
                      <TableCell>
                        <RequireEdit perm="manage_specializations">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(s.id)} title="Редактировать специализацию">✏️</Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteSpecialization(s.id)} className="text-destructive" title="Удалить специализацию">🗑</Button>
                        </div>
                        </RequireEdit>
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
                <RequireEdit perm="manage_specializations" key={sugg.name}><Button variant="outline" size="sm" className="justify-start h-auto py-2"
                  onClick={() => addSpecialization({ name: sugg.name, icon: sugg.icon, matchPatterns: sugg.patterns, category: 'пехота', color: '#22c55e', createdBy: 'system' })}>
                  <img src={`/icons/${sugg.icon}`} alt="" className="w-5 h-5 mr-2 object-contain" />
                  {sugg.name}
                </Button></RequireEdit>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="associations" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <RequireEdit perm="manage_specializations">
            <Dialog open={assocOpen} onOpenChange={(o) => { if (!o) resetAssoc(); setAssocOpen(o); }}>
              <Button variant="default" onClick={() => { resetAssoc(); setAssocOpen(true); }} title="Добавить новую ассоциацию слота со специализацией">+ Ассоциация</Button>
              <DialogContent>
                <DialogHeader><DialogTitle>{assocEditId ? 'Редактировать' : 'Новая'} ассоциация</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Паттерн названия слота (regex)</Label>
                    <Input value={assocSlotPattern} onChange={e => setAssocSlotPattern(e.target.value)} placeholder="Пулемётчик" />
                  </div>
                  <div><Label>Паттерн названия отделения (regex, опц.)</Label>
                    <Input value={assocSquadPattern} onChange={e => setAssocSquadPattern(e.target.value)} placeholder="Alpha-2-\d+" />
                  </div>
                  <div><Label>Зависит от слотов (через запятую, опц.)</Label>
                    <Input value={assocDependsOn} onChange={e => setAssocDependsOn(e.target.value)} placeholder="Командир отделения, Старший стрелок" />
                    <p className="text-xs text-muted-foreground mt-1">Ассоциация сработает, только если в отделении есть эти слоты</p>
                  </div>
                  <div><Label>Специализация</Label>
                    <select className="w-full rounded-md border p-2 bg-background" value={assocSpecializationId} onChange={e => setAssocSpecializationId(e.target.value)}>
                      <option value="">— Выбрать —</option>
                      {specializations.map(sp => (
                        <option key={sp.id} value={sp.id}>{sp.icon ? `🖼 ` : ''}{sp.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAssocSave} className="w-full" title={assocEditId ? 'Сохранить изменения ассоциации' : 'Создать ассоциацию'}>{assocEditId ? 'Сохранить' : 'Добавить'}</Button>
                </div>
              </DialogContent>
            </Dialog>
            </RequireEdit>
          </div>

          {(() => {
            const grouped = new Map<string, typeof specializationAssociations>();
            for (const sa of specializationAssociations) {
              const sp = specializations.find(s => s.id === sa.specializationId);
              const key = sp?.name || 'Без специализации';
              if (!grouped.has(key)) grouped.set(key, []);
              grouped.get(key)!.push(sa);
            }
            const entries = Array.from(grouped.entries());
            return entries.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Нет ассоциаций</CardContent></Card>
            ) : entries.map(([spName, sas]) => (
              <SpecAssocGroup key={spName} spName={spName} sas={sas} specializations={specializations} onEdit={openAssocEdit} removeSpecializationAssociation={removeSpecializationAssociation} />
            ));
          })()}
        </TabsContent>
      </Tabs>
    </div>
    </RequirePerm>
  );
}

function SpecAssocGroup({ spName, sas, specializations, onEdit, removeSpecializationAssociation }: {
  spName: string;
  sas: SpecializationAssociation[];
  specializations: { id: string; name: string; icon: string }[];
  onEdit: (id: string) => void;
  removeSpecializationAssociation: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const sp = specializations.find(s => s.name === spName);
  const { can } = usePermissions();
  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {sp?.icon && <img src={`/icons/${sp.icon}`} alt="" className="w-5 h-5" />}
            {spName}
            <Badge variant="secondary" className="text-xs">{sas.length}</Badge>
          </CardTitle>
          <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <div className="divide-y">
            {sas.map(sa => {
              const s = specializations.find(sp => sp.id === sa.specializationId);
              return (
                <div key={sa.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-muted px-1 rounded">{sa.slotPattern}</code>
                      {sa.squadPattern && (
                        <><span className="text-muted-foreground text-[10px]">в</span><code className="text-xs bg-muted px-1 rounded">{sa.squadPattern}</code></>
                      )}
                    </div>
                    {sa.dependsOnSlots?.length ? (
                      <div className="flex gap-1 flex-wrap">
                        {sa.dependsOnSlots.map(d => (
                          <Badge key={d} variant="outline" className="text-[10px] px-1">⬆ {d}</Badge>
                        ))}
                      </div>
                    ) : null}
                    {s && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        {s.icon && <img src={`/icons/${s.icon}`} alt="" className="w-3.5 h-3.5" />}
                        {s.name}
                      </div>
                    )}
                  </div>
                  {can('manage_specializations') && <>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(sa.id)} title="Редактировать ассоциацию">✏️</Button>
                    <Button variant="ghost" size="sm" onClick={() => removeSpecializationAssociation(sa.id)} className="text-destructive shrink-0" title="Удалить ассоциацию">🗑</Button>
                  </>}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}