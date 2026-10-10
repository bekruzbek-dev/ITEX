// Supabase Database Webhook (INSERT) -> Telegram xabari.
// Bot tokeni faqat Netlify environment'da saqlanadi, brauzerga chiqmaydi.
const esc = (s) =>
  String(s ?? '—').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (req.headers.get('x-webhook-secret') !== process.env.WEBHOOK_SECRET)
    return new Response('Unauthorized', { status: 401 });

 
export default async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const secret = process.env.WEBHOOK_SECRET;
  const suppliedSecret = req.headers.get("x-webhook-secret");

  if (!secret || suppliedSecret !== secret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return new Response(
      JSON.stringify({ error: "Telegram sozlamalari topilmadi" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();

    if (body.type !== "INSERT" || !body.record) {
      return new Response(
        JSON.stringify({ error: "Noto'g'ri so'rov" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const record = body.record;

    const escapeHtml = (value = "") =>
      String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]);

    const text =
      `<b>Yangi ITEX arizasi</b>\n\n` +
      `<b>Ism:</b> ${escapeHtml(record.full_name)}\n` +
      `<b>Sinf:</b> ${escapeHtml(record.grade)}\n` +
      `<b>Yo'nalish:</b> ${escapeHtml(record.direction)}\n` +
      `<b>Telefon:</b> ${escapeHtml(record.phone)}\n` +
      `<b>Telegram:</b> ${escapeHtml(record.telegram)}\n` +
      `<b>Ota-ona telefoni:</b> ${escapeHtml(record.parent_phone)}`;

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    const result = await res.json();

    if (!res.ok || !result.ok) {
      console.error("Telegram API xatosi:", result);

      return new Response(
        JSON.stringify({
          error: "Telegram xabar yubora olmadi",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Telegram xabari yuborildi" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Funksiya xatosi:", error);

    return new Response(
      JSON.stringify({ error: "So'rovni qayta ishlashda xato" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
