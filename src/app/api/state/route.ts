import { NextRequest, NextResponse } from 'next/server';
import IORedis from 'ioredis';

const KV_KEY = 'orbat_state';

function createRedis(): IORedis | null {
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  try {
    return new IORedis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });
  } catch {
    return null;
  }
}

export async function GET() {
  let redis: IORedis | null = null;
  try {
    redis = createRedis();
    if (!redis) return NextResponse.json({});
    const raw = await redis.get(KV_KEY);
    const state = raw ? JSON.parse(raw) : {};
    return NextResponse.json(state);
  } catch (error) {
    console.error('/api/state GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    if (redis) redis.disconnect();
  }
}

export async function POST(request: NextRequest) {
  let redis: IORedis | null = null;
  try {
    redis = createRedis();
    if (!redis) return NextResponse.json({ ok: false, error: 'Redis not configured' }, { status: 500 });
    const body = await request.json();
    await redis.set(KV_KEY, JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('/api/state POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    if (redis) redis.disconnect();
  }
}
