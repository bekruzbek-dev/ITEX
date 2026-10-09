// Supabase Database Webhook (INSERT) -> Telegram xabari.
// Bot tokeni faqat Netlify environment'da saqlanadi, brauzerga chiqmaydi.
const esc = (s) =>
  String(s ?? '—').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (req.headers.get('x-webhook-secret') !== process.env.WEBHOOK_SECRET)
    return new Response('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || body.type !== 'INSERT' || !body.record) return new Response('ignored');
  const r = body.record;

  const text =
    `🚀 <b>ITEX — yangi ariza</b>\n\n` +
    `👤 ${esc(r.full_name)}\n🏫 ${esc(r.grade)}-sinf\n🎯 ${esc(r.direction)}\n` +
    `📞 ${esc(r.phone)}\n✈️ ${esc(r.telegram)}\n👨‍👩‍👧 Ota-ona: ${esc(r.parent_phone)}`;

  // Ko'p ariza bir vaqtda kelsa, xabarlar bir yo'la ketmasligi uchun kichik tasodifiy kechikish
  await sleep(Math.random() * 1500);

  // Telegram "429 Too Many Requests" desa, aytilgan vaqtni kutib qayta uriniladi
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
    });
    if (res.ok) return new Response('ok');
    if (res.status !== 429) break;
    const j = await res.json().catch(() => ({}));
    await sleep(Math.min((j.parameters?.retry_after ?? 1) + 0.5, 3) * 1000);
  }
  return new Response('telegram error', { status: 502 });
};
