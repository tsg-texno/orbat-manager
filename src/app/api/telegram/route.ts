import { NextRequest, NextResponse } from 'next/server';

const KV_REST_API_URL = process.env.KV_REST_API_URL || '';
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || '';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message;
    if (!message?.text || !message?.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id.toString();
    const text = message.text.trim();
    const userId = message.from?.id?.toString() || 'unknown';

    if (text.startsWith('/push ')) {
      const payload = text.slice(6).trim();
      const roomKey = `user:${userId}:deltas`;
      const existing = await kvGet(roomKey) || '[]';
      let deltas: unknown[];
      try {
        deltas = [...JSON.parse(existing), ...JSON.parse(payload)];
      } catch {
        deltas = [payload];
      }
      await kvSet(roomKey, JSON.stringify(deltas));
      await kvSet(`user:${userId}:lastSync`, Date.now().toString());

      const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Получено изменений: ${Array.isArray(JSON.parse(payload)) ? JSON.parse(payload).length : 1}`,
        }),
      });
    } else if (text.startsWith('/pull ')) {
      const userId = message.from?.id?.toString() || 'unknown';
      const deltas = await kvGet(`user:${userId}:deltas`);
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: deltas || '[]',
        }),
      });
    } else if (text.startsWith('/snapshot ')) {
      const userId = message.from?.id?.toString() || 'unknown';
      const payload = text.slice(10).trim();
      await kvSet(`user:${userId}:snapshot`, payload);
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '✅ Слепок сохранён' }),
      });
    } else if (text === '/start') {
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '👋 Добро пожаловать в ORBAT Manager Sync!\n\nИспользуйте команды:\n/push {json} — отправить изменения\n/pull {timestamp} — получить изменения\n/snapshot {json} — сохранить полный слепок',
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
