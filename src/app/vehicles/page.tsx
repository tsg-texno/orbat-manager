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

  const [assocOpen, setAssocOpen] = useState(false);
  const [assocSlotPattern, setAssocSlotPattern] = useState('');
  const [assocSquadPattern, setAssocSquadPattern] = useState('');
  const [assocDependsOn, setAssocDependsOn] = useState('');
  const [assocVehicleId, setAssocVehicleId] = useState('');

  const resetVt = () => {
    setVtName(''); setVtModel(''); setVtFaction('ru'); setVtCategory('Танк'); setVtIcon(''); setVtEditId(null);
  };

  const handleVtEdit = (id: string) => {
    const vt = vehicleTypes.find(v => v.id === id);
    if (!vt) return;
    setVtName(vt.name); setVtModel(vt.model); setVtFaction(vt.faction); setVtCategory(vt.category); setVtIcon(vt.icon);
    setVtEditId(id); setVtOpen(true);
  };

  const handleVtSave = () => {
    if (!vtName.trim()) return;
    const data = { name: vtName.trim(), model: vtModel.trim(), faction: vtFaction, category: vtCategory, icon: vtIcon || `${vtEditId ? vehicleTypes.find(v => v.id === vtEditId)?.icon : ''}`, matchPatterns: [vtName.trim()] };
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🛠 Техника</h1>

      <Tabs defaultValue="types">
        <TabsList className="mb-4">
          <TabsTrigger value="types">Типы техники</TabsTrigger>
          <TabsTrigger value="associations">Ассоциации</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={vtOpen} onOpenChange={(o) => { if (!o) resetVt(); setVtOpen(o); }}>
              <Button variant="default" onClick={() => setVtOpen(true)}>+ Тип техники</Button>
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
                  <Button onClick={handleVtSave} className="w-full">{vtEditId ? 'Сохранить' : 'Добавить'}</Button>
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
                    <TableHead>Модель</TableHead>
                    <TableHead>Фракция</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleTypes.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Нет типов техники. <Button variant="link" onClick={() => setVtOpen(true)}>Добавить</Button>
                    </TableCell></TableRow>
                  ) : vehicleTypes.map(vt => (
                    <TableRow key={vt.id}>
                      <TableCell>
                        {vt.icon ? <img src={`/icons/${vt.icon}`} alt={vt.name} className="w-8 h-8 object-contain" /> : '—'}
                      </TableCell>
                      <TableCell className="font-medium">{vt.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{vt.model}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{vt.faction === 'ru' ? '🇷🇺 РФ' : vt.faction === 'us' ? '🇺🇸 США' : '⚙️'}</Badge>
                      </TableCell>
                      <TableCell><Badge>{vt.category}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleVtEdit(vt.id)}>✏️</Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteVehicleType(vt.id)} className="text-destructive">🗑</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

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
                    <img src={`/icons/${icon.filename}`} alt={icon.name} className="w-10 h-10 object-contain" />
                    <span className="text-[10px] text-center leading-tight">{icon.name}</span>
                    <Badge variant="outline" className="text-[8px] px-1">{icon.category}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="associations" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={assocOpen} onOpenChange={(o) => { if (!o) resetAssoc(); setAssocOpen(o); }}>
              <Button variant="default" onClick={() => setAssocOpen(true)}>+ Ассоциация</Button>
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
                  <Button onClick={handleAssocAdd} className="w-full">Добавить</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Паттерн слота</TableHead>
                    <TableHead>Паттерн отделения</TableHead>
                    <TableHead>Зависит от слотов</TableHead>
                    <TableHead>Техника</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleAssociations.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Нет ассоциаций</TableCell></TableRow>
                  ) : vehicleAssociations.map(va => (
                    <TableRow key={va.id}>
                      <TableCell><code className="text-xs bg-muted px-1 rounded">{va.slotPattern}</code></TableCell>
                      <TableCell><code className="text-xs bg-muted px-1 rounded">{va.squadPattern || '—'}</code></TableCell>
                      <TableCell>
                        {va.dependsOnSlots?.length ? va.dependsOnSlots.map(d => (
                          <Badge key={d} variant="outline" className="text-xs mr-1">{d}</Badge>
                        )) : '—'}
                      </TableCell>
                      <TableCell>{vehicleTypes.find(vt => vt.id === va.vehicleTypeId)?.name || '—'}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" onClick={() => removeVehicleAssociation(va.id)} className="text-destructive">🗑</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
