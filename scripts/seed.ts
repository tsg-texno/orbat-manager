import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Fighter {
  id: string; nickname: string; status: string; build: string; attendance: number;
}
interface Mission {
  id: string; name: string; date: string; map: string; faction: string; factionType: string; server: number; slotGroups: any[];
}
interface Specialization {
  id: string; name: string; icon: string; matchPatterns: string[]; category: string; color: string; createdBy: string;
}
interface VehicleType {
  id: string; name: string; model: string; faction: string; category: string; icon: string; matchPatterns: string[];
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function parseCSV(filePath: string): string[][] {
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split('\n');
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  });
}

function extractFighters(rows: string[][]): Fighter[] {
  const fighters: Fighter[] = [];
  const skipWords = ['В строю', 'В запасе', 'Пропал', 'Редкостное', 'Перерыв', 'Курсантов', 'Всего', 'ГОЛОСОВАНИЯ НЕТ', 'Экипажи', 'организация'];
  const fighterRows = rows.filter(r => {
    const n = r[1]?.trim();
    if (!n || n.startsWith('[') || n.startsWith('«')) return false;
    for (const sw of skipWords) { if (n.includes(sw)) return false; }
    return true;
  });
  for (const row of fighterRows) {
    const nickname = row[1]?.trim();
    if (!nickname) continue;

    let attendance = 0;
    const rawAtt = row[3]?.trim().replace(',', '.');
    if (rawAtt) attendance = parseFloat(rawAtt) || 0;

    const buildRaw = row[5]?.trim() || '';
    let status = 'active';
    if (buildRaw.includes('Курсант') || buildRaw.includes('Курсантов') || row[4]?.trim() === '0') status = 'cadet';
    else if (buildRaw.includes('Перерыв')) status = 'break';
    else if (buildRaw.includes('Редкостное')) status = 'rare';
    else if (buildRaw.includes('Пропал')) status = 'missing';
    else if (buildRaw.includes('Запас') || buildRaw.includes('запасе')) status = 'reserve';

    if (!fighters.some(f => f.nickname === nickname)) {
      fighters.push({ id: uid(), nickname, status, build: buildRaw, attendance });
    }
  }
  return fighters;
}

function extractMissions(rows: string[][]): Mission[] {
  const missions: Mission[] = [];
  const missionData = [
    { name: 'В три погибели', map: 'Шумава', faction: 'ВДВ РФ', factionType: 'red' },
    { name: 'Снегопад', map: 'Напф (зима)', faction: 'Мотострелковые войска РФ', factionType: 'red' },
    { name: 'Цитадель', map: 'Роше', faction: 'ЧСО', factionType: 'red' },
    { name: 'Карельский бастион', map: 'Виролахти', faction: 'Морпехи США', factionType: 'blue' },
  ];
  for (const md of missionData) {
    missions.push({
      id: uid(),
      name: md.name,
      date: '17.07.2026',
      map: md.map,
      faction: md.faction,
      factionType: md.factionType,
      server: 3,
      slotGroups: [],
    });
  }
  return missions;
}

function extractCrews(rows: string[][]): { name: string; type: string }[] {
  const crews: { name: string; type: string }[] = [];
  for (const row of rows) {
    const name = row[1]?.trim();
    const type = row[2]?.trim();
    if (name?.startsWith('«') && type) {
      crews.push({ name: name.replace(/[«»]/g, '').trim(), type });
    }
  }
  return crews;
}

const csvPath = path.resolve(__dirname, '..', '..', '75th Штабная - Расстановка.csv');
const rows = parseCSV(csvPath);

const fighters = extractFighters(rows);
const missions = extractMissions(rows);
const crews = extractCrews(rows);

const specializations: Specialization[] = [
  { id: uid(), name: 'Пулемётчик', icon: 'RU_PKP-Label.png', matchPatterns: ['Пулеметчик', 'Пулемётчик'], category: 'пехота', color: '#22c55e', createdBy: 'system' },
  { id: uid(), name: 'Гранатомётчик', icon: 'RU_RPG29-Label.png', matchPatterns: ['Гранатометчик', 'Гранатомётчик', 'РПГ'], category: 'пехота', color: '#eab308', createdBy: 'system' },
  { id: uid(), name: 'Снайпер', icon: 'GENERIC_SNIPER-Label.png', matchPatterns: ['Снайпер', 'Стрелок'], category: 'снайпер', color: '#a855f7', createdBy: 'system' },
  { id: uid(), name: 'Санитар', icon: 'supply-Label.png', matchPatterns: ['Санитар', 'Медик'], category: 'медицина', color: '#06b6d4', createdBy: 'system' },
  { id: uid(), name: 'ПТРК', icon: 'RU_KONKURS-Label.png', matchPatterns: ['ПТРК', 'Конкурс', 'Корнет', 'Метис'], category: 'ПТРК', color: '#f97316', createdBy: 'system' },
  { id: uid(), name: 'ПЗРК', icon: 'RU_IGLA-Label.png', matchPatterns: ['ПЗРК', 'Игла', 'Стрела', 'Игла'], category: 'ПВО', color: '#3b82f6', createdBy: 'system' },
  { id: uid(), name: 'АГС / СПГ', icon: 'RU_AGS_17-Label.png', matchPatterns: ['АГС', 'СПГ'], category: 'артиллерия', color: '#ef4444', createdBy: 'system' },
  { id: uid(), name: 'Командир отделения', icon: 'OFFICER-Label.png', matchPatterns: ['Командир отделения', 'Ком.отд', 'Командир'], category: 'командир', color: '#ef4444', createdBy: 'system' },
  { id: uid(), name: 'Старший стрелок', icon: 'GENERIC_RIFLEMEN-Label.png', matchPatterns: ['Старший стрелок'], category: 'пехота', color: '#22c55e', createdBy: 'system' },
];

const vehicleTypes: VehicleType[] = [
  { id: uid(), name: 'БТР-82А', model: 'БТР-82А', faction: 'ru', category: 'БТР', icon: 'RU_BTR82-Label.png', matchPatterns: ['БТР-82А', 'БТР-82'] },
  { id: uid(), name: 'БТР-80', model: 'БТР-80', faction: 'ru', category: 'БТР', icon: 'RU_BTR80-Label.png', matchPatterns: ['БТР-80'] },
  { id: uid(), name: 'Т-90М', model: 'Т-90М', faction: 'ru', category: 'Танк', icon: 'RU_T90M-Label.png', matchPatterns: ['Т-90М', 'Т-90'] },
  { id: uid(), name: 'Т-72Б', model: 'Т-72Б', faction: 'ru', category: 'Танк', icon: 'RU_T72B-Label.png', matchPatterns: ['Т-72Б', 'Т-72'] },
  { id: uid(), name: 'БМД-4', model: 'БМД-4', faction: 'ru', category: 'БМД', icon: 'RU_BMD_4-Label.png', matchPatterns: ['БМД-4', 'БМД4'] },
  { id: uid(), name: 'БМД-2', model: 'БМД-2', faction: 'ru', category: 'БМД', icon: 'RU_BMD_2-Label.png', matchPatterns: ['БМД-2', 'БМД2'] },
  { id: uid(), name: 'БМП-2', model: 'БМП-2', faction: 'ru', category: 'БМП', icon: 'RU_BMP2-Label.png', matchPatterns: ['БМП-2', 'БМП2'] },
  { id: uid(), name: 'БМП-3', model: 'БМП-3', faction: 'ru', category: 'БМП', icon: 'RU_BMP3-Label.png', matchPatterns: ['БМП-3', 'БМП3'] },
  { id: uid(), name: 'Ка-52', model: 'Ка-52', faction: 'ru', category: 'Вертолёт', icon: 'RU_KA52-Label.png', matchPatterns: ['Ка-52', 'КА-52'] },
  { id: uid(), name: 'Ми-8', model: 'Ми-8', faction: 'ru', category: 'Вертолёт', icon: 'RU_MI8_AMTSH-Label.png', matchPatterns: ['Ми-8', 'МИ-8'] },
  { id: uid(), name: 'Т-14 Армата', model: 'Т-14', faction: 'ru', category: 'Танк', icon: 'RU_T14-Label.png', matchPatterns: ['Т-14', 'Армата'] },
  { id: uid(), name: 'Панцирь-С1', model: 'Панцирь-С1', faction: 'ru', category: 'ПВО', icon: 'RU_PANTSIR-Label.png', matchPatterns: ['Панцирь', 'Панцирь-С1'] },
  { id: uid(), name: 'Тор-М2', model: 'Тор-М2', faction: 'ru', category: 'ПВО', icon: 'RU_TOR-Label.png', matchPatterns: ['Тор', 'Тор-М2'] },
  { id: uid(), name: 'Мста-С', model: 'Мста-С', faction: 'ru', category: 'Артиллерия', icon: 'RU_MSTA-Label.png', matchPatterns: ['Мста', 'Мста-С'] },
  { id: uid(), name: 'Ураган', model: 'Ураган', faction: 'ru', category: 'Артиллерия', icon: 'RU_URAGAN_1M-Label.png', matchPatterns: ['Ураган', 'БМ-27'] },
  { id: uid(), name: 'ТОС-1', model: 'ТОС-1', faction: 'ru', category: 'Артиллерия', icon: 'RU_TOS-Label.png', matchPatterns: ['ТОС', 'Солнцепек'] },
];

const output = { fighters, missions, specializations, vehicleTypes, vehicleAssociations: [] };
const outPath = path.resolve(__dirname, '..', 'public', 'seed-data.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Seed data written to ${outPath}`);
console.log(`- ${fighters.length} fighters`);
console.log(`- ${missions.length} missions`);
console.log(`- ${specializations.length} specializations`);
console.log(`- ${vehicleTypes.length} vehicle types`);
console.log(`- ${crews.length} crews found but not auto-imported`);
