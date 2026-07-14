import { NextRequest, NextResponse } from 'next/server';

const KV_REST_API_URL = process.env.KV_REST_API_URL || '';
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || '';
const KV_KEY = 'orbat_state';

async function kvGet(key: string): Promise<string | null> {
  if (!KV_REST_API_URL) return null;
  try {
    const resp = await fetch(`${KV_REST_API_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
    });
    const data = await resp.json();
    return data.result || null;
  } catch { return null; }
}

async function kvSet(key: string, value: string) {
  if (!KV_REST_API_URL) return;
  try {
    await fetch(`${KV_REST_API_URL}/set/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
  } catch {}
}

async function readState(): Promise<object | null> {
  const raw = await kvGet(KV_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

async function writeState(state: object) {
  await kvSet(KV_KEY, JSON.stringify(state));
}

export async function GET() {
  try {
    const state = await readState();
    return NextResponse.json(state || {});
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await writeState(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
