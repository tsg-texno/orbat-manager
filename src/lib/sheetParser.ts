const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1QnS0yXILGfnz5rLAVkRZOPYcD9bizVCGUwGFmgo2-6w/export?format=csv&gid=673987660';

export interface SheetMission {
  date: string;
  squad: string;
  name: string;
  status: string;
  side: string;
  ourFaction: string;
  ourSlots: string;
  opponentFaction: string;
  opponentSlots: string;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { current.push(field); field = ''; }
      else if (ch === '\n') { current.push(field); field = ''; rows.push(current); current = []; }
      else if (ch === '\r') { /* skip */ }
      else { field += ch; }
    }
  }
  if (field || current.length) { current.push(field); rows.push(current); }
  return rows;
}

function parseDateRu(dateStr: string): Date | null {
  const m = dateStr.trim().match(/^(\d{2})\.(\d{2})\.(\d{2})/);
  if (!m) return null;
  return new Date(2000 + parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
}

export async function fetchSheetMissions(): Promise<SheetMission[]> {
  const resp = await fetch(SHEET_URL);
  if (!resp.ok) throw new Error(`Sheet fetch failed: ${resp.status}`);
  const text = await resp.text();
  const rows = parseCSV(text);

  const missions: SheetMission[] = [];
  for (let i = 4; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 10) continue;
    const dateRaw = (r[2] || '').trim();
    if (!dateRaw) continue;
    const squad = (r[3] || '').trim();
    if (!squad) continue;
    const name = (r[7] || '').trim();
    if (!name) continue;

    const side = (r[9] || '').trim();
    const ourFaction = side === 'Красные' ? (r[12] || '').trim() : (r[10] || '').trim();
    const ourSlots = side === 'Красные' ? (r[13] || '').trim() : (r[11] || '').trim();
    const opponentFaction = side === 'Красные' ? (r[10] || '').trim() : (r[12] || '').trim();
    const opponentSlots = side === 'Красные' ? (r[11] || '').trim() : (r[13] || '').trim();

    missions.push({
      date: dateRaw,
      squad,
      name,
      status: (r[8] || '').trim(),
      side,
      ourFaction,
      ourSlots,
      opponentFaction,
      opponentSlots,
    });
  }
  return missions;
}

export function getUpcomingMissions(missions: SheetMission[]): SheetMission[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Find next Friday (5) and Saturday (6)
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;

  const targetDates: string[] = [];
  for (const d of [daysUntilFriday, daysUntilSaturday]) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = String(dt.getFullYear()).slice(-2);
    targetDates.push(`${day}.${month}.${year}`);
  }

  return missions.filter(m => {
    const md = parseDateRu(m.date);
    if (!md) return false;
    const mkey = `${String(md.getDate()).padStart(2, '0')}.${String(md.getMonth() + 1).padStart(2, '0')}.${String(md.getFullYear()).slice(-2)}`;
    return targetDates.includes(mkey);
  });
}

export function sheetMissionToAppMission(m: SheetMission) {
  const now = Date.now();
  const parsedDate = parseDateRu(m.date);
  const dateStr = parsedDate
    ? `${parsedDate.getDate().toString().padStart(2, '0')}.${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}.${parsedDate.getFullYear()}`
    : m.date;

  return {
    name: m.name,
    date: dateStr,
    map: m.name,
    faction: m.squad,
    factionType: (m.side === 'Красные' ? 'red' : 'blue') as 'red' | 'blue',
    server: 1,
    slotGroups: [],
    syncRoomKey: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
  };
}
