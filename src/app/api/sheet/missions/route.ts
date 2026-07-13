import { NextResponse } from 'next/server';
import { fetchSheetMissions, getUpcomingMissions } from '@/lib/sheetParser';

export async function GET() {
  try {
    const all = await fetchSheetMissions();
    const upcoming = getUpcomingMissions(all);
    return NextResponse.json({ missions: upcoming });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
