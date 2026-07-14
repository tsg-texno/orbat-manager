'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/specializations/IconPicker';
import { getAllIcons, getCategories } from '@/lib/vehicleIcons';
import type { VehicleAssociation, VehicleType } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { RequirePerm, RequireEdit } from '@/components/auth/RequirePerm';

export default function VehiclesPage() {
  const { vehicleTypes, addVehicleType, updateVehicleType, deleteVehicleType, vehicleAssociations, addVehicleAssociation, removeVehicleAssociation } = useAppStore();
  const allIcons = getAllIcons();
  const categories = getCategories().filter(c => c !== 'Все');

  const [vtOpen, setVtOpen] = useState(false);
  const [vtEditId, setVtEditId] = useState<string | null>(null);
  const [vtName, setVtName] = useState('');
  const [vtModel, setVtModel] = useState('');
  const [vtFaction, setVtFaction] = useState<'ru' | 'us' | 'generic'>('ru');
  const [vtCategory, setVtCategory] = useState('Танк');
  const [vtIcon, setVtIcon] = useState('');
  const [vtCrewSlots, setVtCrewSlots] = useState('');

  const [assocOpen, setAssocOpen] = useState(false);
  const [assocSlotPattern, setAssocSlotPattern] = useState('');
  const [assocSquadPattern, setAssocSquadPattern] = useState('');
  const [assocDependsOn, setAssocDependsOn] = useState('');
  const [assocVehicleId, setAssocVehicleId] = useState('');

  const resetVt = () => {
    setVtName(''); setVtModel(''); setVtFaction('ru'); setVtCategory('Танк'); setVtIcon(''); setVtCrewSlots(''); setVtEditId(null);
  };

  const handleVtEdit = (id: string) => {
    const vt = vehicleTypes.find(v => v.id === id);
    if (!vt) return;
    setVtName(vt.name); setVtModel(vt.model); setVtFaction(vt.faction); setVtCategory(vt.category); setVtIcon(vt.icon);
    setVtCrewSlots((vt.crewSlots || []).join(', '));
    setVtEditId(id); setVtOpen(true);
  };

  const handleVtSave = () => {
    if (!vtName.trim()) return;
    const crewSlots = vtCrewSlots.trim() ? vtCrewSlots.split(',').map(s => s.trim()).filter(Boolean) : undefined;
    const data = { name: vtName.trim(), model: vtModel.trim(), faction: vtFaction, category: vtCategory, icon: vtIcon || `${vtEditId ? vehicleTypes.find(v => v.id === vtEditId)?.icon : ''}`, matchPatterns: [vtName.trim()], crewSlots };
    if (vtEditId) updateVehicleType(vtEditId, data);
    else addVehicleType(data);
    resetVt(); setVtOpen(false);
  };

  const resetAssoc = () => {
    setAssocSlotPattern(''); setAssocSquadPattern(''); setAssocDependsOn(''); setAssocVehicleId(''); setAssocOpen(false);
  };

  const handleAssocAdd = () => {
    if (!assocSlotPattern.trim() || !assocVehicleId) return;
    addVehicleAssociation({
      slotPattern: assocSlotPattern.trim(),
      squadPattern: assocSquadPattern.trim() || undefined,
      dependsOnSlots: assocDependsOn.trim() ? assocDependsOn.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      vehicleTypeId: assocVehicleId,
    });
    resetAssoc();
  };

  return (
    <RequirePerm perm={['view_vehicles', 'manage_vehicles']}>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Техника</h1>

      <Tabs defaultValue="types">
        <TabsList className="mb-4">
          <TabsTrigger value="types">Типы техники</TabsTrigger>
          <TabsTrigger value="associations">Ассоциации</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <RequireEdit perm="manage_vehicles">
            <Dialog open={vtOpen} onOpenChange={(o) => { if (!o) resetVt(); setVtOpen(o); }}>
              <Button variant="default" onClick={() => setVtOpen(true)} title="Добавить новый тип техники">+ Тип техники</Button>
              <DialogContent>
                <DialogHeader><DialogTitle>{vtEditId ? 'Редактировать' : 'Новый'} тип техники</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Название</Label><Input value={vtName} onChange={e => setVtName(e.target.value)} placeholder="БТР-82А" /></div>
                  <div><Label>Модель</Label><Input value={vtModel} onChange={e => setVtModel(e.target.value)} placeholder="БТР-82А" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Фракция</Label>
                      <select className="w-full rounded-md border p-2 bg-background" value={vtFaction} onChange={e => setVtFaction(e.target.value as 'ru' | 'us' | 'generic')}>
                        <option value="ru">🇷🇺 РФ</option><option value="us">🇺🇸 США</option><option value="generic">⚙️ Общее</option>
                      </select>
                    </div>
                    <div><Label>Категория</Label>
                      <select className="w-full rounded-md border p-2 bg-background" value={vtCategory} onChange={e => setVtCategory(e.target.value)}>
                        {categories.map(c => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                  </div>
                  <div><Label>Иконка</Label><IconPicker value={vtIcon} onChange={setVtIcon} icons={allIcons} /></div>
                  <div><Label>Экипаж (через запятую)</Label>
                    <Input value={vtCrewSlots} onChange={e => setVtCrewSlots(e.target.value)} placeholder="Водитель УАЗа" />
                    <p className="text-xs text-muted-foreground mt-1">Названия слотов экипажа, которые будут созданы при привязке техники к отделению</p>
                  </div>
                  <Button onClick={handleVtSave} className="w-full" title={vtEditId ? 'Сохранить изменения типа техники' : 'Создать новый тип техники'}>{vtEditId ? 'Сохранить' : 'Добавить'}</Button>
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
                    <TableHead>Модель</TableHead>
                    <TableHead>Фракция</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleTypes.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Нет типов техники. <RequireEdit perm="manage_vehicles"><Button variant="link" onClick={() => setVtOpen(true)} title="Добавить первый тип техники">Добавить</Button></RequireEdit>
                    </TableCell></TableRow>
                  ) : vehicleTypes.map(vt => (
                    <TableRow key={vt.id}>
                      <TableCell>
                        {vt.icon ? <img src={`/icons/${vt.icon}`} alt={vt.name} className="w-[60px] h-10 object-contain" /> : '—'}
                      </TableCell>
                      <TableCell className="font-medium">{vt.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{vt.model}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{vt.faction === 'ru' ? '🇷🇺 РФ' : vt.faction === 'us' ? '🇺🇸 США' : '⚙️'}</Badge>
                      </TableCell>
                      <TableCell><Badge>{vt.category}</Badge></TableCell>
                      <TableCell>
                        <RequireEdit perm="manage_vehicles">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleVtEdit(vt.id)} title="Редактировать тип техники">✏️</Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteVehicleType(vt.id)} className="text-destructive" title="Удалить тип техники">🗑</Button>
                        </div>
                        </RequireEdit>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <RequireEdit perm="manage_vehicles">
          <Card>
            <CardHeader><CardTitle>Автоматически сопоставленные иконки</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {allIcons.slice(0, 48).map(icon => (
                  <div key={icon.filename} className="flex flex-col items-center gap-1 p-2 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => {
                      if (!vehicleTypes.some(vt => vt.icon === icon.filename)) {
                        addVehicleType({ name: icon.name, model: icon.name, faction: icon.faction, category: icon.category, icon: icon.filename, matchPatterns: [icon.name] });
                      }
                    }}>
                    <img src={`/icons/${icon.filename}`} alt={icon.name} className="w-[60px] h-10 object-contain" />
                    <span className="text-[10px] text-center leading-tight">{icon.name}</span>
                    <Badge variant="outline" className="text-[8px] px-1">{icon.category}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </RequireEdit>
        </TabsContent>

        <TabsContent value="associations" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <RequireEdit perm="manage_vehicles">
            <Dialog open={assocOpen} onOpenChange={(o) => { if (!o) resetAssoc(); setAssocOpen(o); }}>
              <Button variant="default" onClick={() => setAssocOpen(true)} title="Добавить новую ассоциацию слота с техникой">+ Ассоциация</Button>
              <DialogContent>
                <DialogHeader><DialogTitle>Новая ассоциация</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Паттерн названия слота (regex)</Label>
                    <Input value={assocSlotPattern} onChange={e => setAssocSlotPattern(e.target.value)} placeholder="Наводчик БТР-82А" />
                  </div>
                  <div><Label>Паттерн названия отделения (regex, опц.)</Label>
                    <Input value={assocSquadPattern} onChange={e => setAssocSquadPattern(e.target.value)} placeholder="Alpha-2-\d+" />
                  </div>
                  <div><Label>Зависит от слотов (через запятую, опц.)</Label>
                    <Input value={assocDependsOn} onChange={e => setAssocDependsOn(e.target.value)} placeholder="Командир отделения, Старший стрелок" />
                    <p className="text-xs text-muted-foreground mt-1">Ассоциация сработает, только если в отделении есть эти слоты</p>
                  </div>
                  <div><Label>Тип техники</Label>
                    <select className="w-full rounded-md border p-2 bg-background" value={assocVehicleId} onChange={e => setAssocVehicleId(e.target.value)}>
                      <option value="">— Выбрать —</option>
                      {vehicleTypes.map(vt => (
                        <option key={vt.id} value={vt.id}>{vt.icon ? `🖼 ` : ''}{vt.name} ({vt.model})</option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAssocAdd} className="w-full" title="Создать ассоциацию">Добавить</Button>
                </div>
              </DialogContent>
            </Dialog>
            </RequireEdit>
          </div>

          {(() => {
            const grouped = new Map<string, typeof vehicleAssociations>();
            for (const va of vehicleAssociations) {
              const vt = vehicleTypes.find(v => v.id === va.vehicleTypeId);
              const key = vt?.name || 'Без техники';
              if (!grouped.has(key)) grouped.set(key, []);
              grouped.get(key)!.push(va);
            }
            const entries = Array.from(grouped.entries());
            return entries.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Нет ассоциаций</CardContent></Card>
            ) : entries.map(([vtName, vas]) => (
              <AssocGroup key={vtName} vtName={vtName} vas={vas} vehicleTypes={vehicleTypes} removeVehicleAssociation={removeVehicleAssociation} />
            ));
          })()}
        </TabsContent>
      </Tabs>
    </div>
    </RequirePerm>
  );
}

function AssocGroup({ vtName, vas, vehicleTypes, removeVehicleAssociation }: {
  vtName: string;
  vas: VehicleAssociation[];
  vehicleTypes: VehicleType[];
  removeVehicleAssociation: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const vt = vehicleTypes.find(v => v.name === vtName);
  const { can } = usePermissions();
  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {vt?.icon && <img src={`/icons/${vt.icon}`} alt="" className="w-5 h-5" />}
            {vtName}
            <Badge variant="secondary" className="text-xs">{vas.length}</Badge>
          </CardTitle>
          <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <div className="divide-y">
            {vas.map(va => {
              const v = vehicleTypes.find(vt => vt.id === va.vehicleTypeId);
              return (
                <div key={va.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-muted px-1 rounded">{va.slotPattern}</code>
                      {va.squadPattern && (
                        <><span className="text-muted-foreground text-[10px]">в</span><code className="text-xs bg-muted px-1 rounded">{va.squadPattern}</code></>
                      )}
                    </div>
                    {va.dependsOnSlots?.length ? (
                      <div className="flex gap-1 flex-wrap">
                        {va.dependsOnSlots.map(d => (
                          <Badge key={d} variant="outline" className="text-[10px] px-1">⬆ {d}</Badge>
                        ))}
                      </div>
                    ) : null}
                    {v && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        {v.icon && <img src={`/icons/${v.icon}`} alt="" className="w-3.5 h-3.5" />}
                        {v.name} · {v.model}
                      </div>
                    )}
                  </div>
                  {can('manage_vehicles') && <Button variant="ghost" size="sm" onClick={() => removeVehicleAssociation(va.id)} className="text-destructive shrink-0" title="Удалить ассоциацию">🗑</Button>}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
