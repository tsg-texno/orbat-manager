import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API = 'https://api.telegram.org/bot';
const SYNC_MARKER = 'ORBAT_SYNC_STATE:';

async function sendTelegram(text: string, chatId: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  try {
    const resp = await fetch(`${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return resp.ok;
  } catch { return false; }
}

async function getLastSyncMessage(chatId: string): Promise<string | null> {
  if (!TELEGRAM_BOT_TOKEN) return null;
  try {
    const resp = await fetch(`${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/getUpdates?timeout=5&limit=100`);
    const data = await resp.json();
    if (!data.ok || !data.result) return null;
    const messages = data.result
      .filter((u: any) => u.message?.chat?.id?.toString() === chatId && u.message?.text?.startsWith(SYNC_MARKER))
      .sort((a: any, b: any) => (b.message?.date || 0) - (a.message?.date || 0));
    if (messages.length === 0) return null;
    return messages[0].message.text.slice(SYNC_MARKER.length);
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state = body.state;
    const chatId = body.chatId;
    if (!state || !chatId) return NextResponse.json({ ok: false, error: 'missing state or chatId' }, { status: 400 });

    const ok = await sendTelegram(`${SYNC_MARKER}${JSON.stringify(state)}`, chatId);
    return NextResponse.json({ ok });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const chatId = request.nextUrl.searchParams.get('chatId');
    if (!chatId) return NextResponse.json({ state: null });
    const raw = await getLastSyncMessage(chatId);
    if (!raw) return NextResponse.json({ state: null });
    let state;
    try { state = JSON.parse(raw); } catch { state = null; }
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
