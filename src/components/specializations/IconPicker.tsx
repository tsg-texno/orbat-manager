'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { IconEntry } from '@/lib/vehicleIcons';

interface IconPickerProps {
  value: string;
  onChange: (filename: string) => void;
  icons: IconEntry[];
}

export function IconPicker({ value, onChange, icons }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');

  const categories = ['Все', ...new Set(icons.map(i => i.category))];
  const filtered = icons.filter(i => {
    if (category !== 'Все' && i.category !== category) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.filename.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full justify-start gap-2 h-12 border border-border bg-background hover:bg-muted hover:text-foreground rounded-lg px-2.5 text-sm font-medium">
        {value ? (
          <><img src={`/icons/${value}`} alt="" className="w-6 h-6 object-contain inline-block align-middle mr-1" />{value}</>
        ) : 'Выбрать иконку'}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Выбор иконки</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="🔍 Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="flex gap-1 flex-wrap">
            {categories.map(c => (
              <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)}>{c}</Button>
            ))}
          </div>
          <ScrollArea className="h-64">
            <div className="grid grid-cols-5 gap-2 p-1">
              {filtered.map(icon => (
                <Button
                  key={icon.filename}
                  variant={value === icon.filename ? 'default' : 'ghost'}
                  size="sm"
                  className="h-auto p-2 flex-col gap-1"
                  onClick={() => { onChange(icon.filename); setOpen(false); }}
                >
                  <img src={`/icons/${icon.filename}`} alt={icon.name} className="w-8 h-8 object-contain" />
                  <span className="text-[10px] leading-tight text-center truncate w-full">{icon.name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
