# ITEX 🚀 — IT to'garagi sayti va admin paneli

React + TypeScript + Vite + Supabase (baza, admin login, realtime) + Netlify (hosting, Telegram funksiyasi).

## 1. Supabase
1. supabase.com → **New project** yarating.
2. **SQL Editor** → `supabase/schema.sql` ichidagi kodni to'liq nusxalab **Run** bosing.
3. **Authentication → Users → Add user**: admin email va parol kiriting (Auto Confirm yoqilgan bo'lsin). Hosil bo'lgan foydalanuvchining **UUID** sini nusxalang.
4. Keyin `supabase/limits.sql` ni ham ishga tushiring (takroriy ariza va spamdan himoya).
5. SQL Editor'da: `insert into public.admins (user_id) values ('UUID');`
5. **Authentication → Sign In / Providers** (yoki Settings) bo'limida **Allow new users to sign up** ni o'chiring — begonalar hisob yarata olmasin.
6. **Project Settings → API**: `Project URL` va `anon public` kalitini oling.

## 2. Telegram bot
1. Telegram'da **@BotFather** → `/newbot` → bot **token**ini oling.
2. O'zingiz (yoki guruh) botga `/start` yozing (guruh bo'lsa botni guruhga qo'shing va xabar yozing).
3. Brauzerda `https://api.telegram.org/bot<TOKEN>/getUpdates` oching → `"chat":{"id": ...}` — bu **chat id**.

## 3. Lokal ishga tushirish
```bash
npm install
cp .env.example .env     # ichiga Supabase URL va anon kalitni yozing
npm run dev
```
Sayt: http://localhost:5173 · Admin: http://localhost:5173/admin

## 4. Netlify'ga joylashtirish
1. Loyihani GitHub'ga yuklang (`.env` yuklanmaydi — `.gitignore`da bor).
2. Netlify → **Add new site → Import an existing project** → repozitoriyni tanlang (build sozlamalari `netlify.toml`dan olinadi).
3. **Site configuration → Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `WEBHOOK_SECRET` — o'zingiz o'ylab topgan uzun tasodifiy matn
4. **Deploy** qiling (env o'zgargach qayta deploy kerak).

## 5. Telegram xabarini ulash
Supabase → **Database → Webhooks → Create a new hook**:
- Table: `applications`, Events: **Insert**
- Type: **HTTP Request**, Method: **POST**
- URL: `https://SIZNING-SAYT.netlify.app/.netlify/functions/telegram`
- HTTP Headers: `x-webhook-secret` = `WEBHOOK_SECRET` qiymati

## 6. Tekshirish
Saytdan test ariza yuboring → admin panelda darrov chiqadi (yuqorida xabar), Telegramga xabar keladi.

## Xavfsizlik
- Admin faqat `admins` jadvalidagi foydalanuvchi; ma'lumotlar Row Level Security bilan himoyalangan (anon faqat ariza yubora oladi, o'qiy olmaydi).
- Bot tokeni brauzerga chiqmaydi, funksiya maxfiy `x-webhook-secret` bilan himoyalangan.
- Formada spam tuzog'i (honeypot) va bazada qiymat tekshiruvlari bor.


.





