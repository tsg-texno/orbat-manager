import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const KV_KEY = 'orbat_state';

function getRedis(): Redis | null {
  // 1) Standard Vercel KV env vars
  const restUrl = process.env.KV_REST_API_URL;
  const restToken = process.env.KV_REST_API_TOKEN;
  if (restUrl && restToken) {
    return new Redis({ url: restUrl, token: restToken });
  }

  // 2) REDIS_URL from Vercel Redis/KV (redis://default:TOKEN@HOST:PORT)
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl) return null;

  try {
    const parsed = new URL(redisUrl);
    const host = parsed.hostname;
    const token = parsed.password;
    // KV_URL uses port 32768 for Redis protocol; REST API is on port 443 (default)
    const restHost = host.includes('.upstash.io') ? `https://${host}` : `https://${host}`;
    if (!host || !token) return null;
    return new Redis({ url: restHost, token });
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
    console.error('/api/state GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json({ ok: false, error: 'Redis not configured' }, { status: 500 });
    const body = await request.json();
    await redis.set(KV_KEY, JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('/api/state POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
