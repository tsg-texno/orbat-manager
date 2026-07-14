import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const REDIS_URL = process.env.REDIS_URL || '';
const KV_KEY = 'orbat_state';

function getRedis(): Redis | null {
  if (!REDIS_URL) return null;
  try {
    const parsed = new URL(REDIS_URL);
    const host = parsed.hostname;
    const token = parsed.password;
    if (!host || !token) return null;
    return new Redis({ url: `https://${host}`, token });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json({});
    const raw = await redis.get(KV_KEY);
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return NextResponse.json(state || {});
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json({ ok: false, error: 'REDIS_URL not configured' }, { status: 500 });
    const body = await request.json();
    await redis.set(KV_KEY, JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
