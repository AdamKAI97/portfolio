# 💰 Moliyaviy bot — Telegram Mini App + Admin panel

Shaxsiy pul hisobi yordamchisi: daromad va xarajatlarni yozadi, har kuni eslatib turadi,
tahlil ko'rsatadi hamda qanday tejash va jamg'arish bo'yicha shaxsiy maslahat beradi.
Interfeys **rus va o'zbek** tillarida.

Loyiha uch qismdan iborat va to'liq kompyuteringizda (localhost) ishlaydi:

| Qism | Papka | Nima |
|---|---|---|
| Backend + bot | `backend/` | Node.js, Telegraf, Express API, Prisma, eslatmalar rejalashtiruvchisi |
| Mini App | `miniapp/` | Telegram ichidagi React ilova |
| Admin panel | `admin/` | Brauzerdagi React panel: amaliyotlar jadvali, kategoriyalar, foydalanuvchilar |

---

## 📋 Tayyorgarlik (15 daqiqa)

### 1-qadam. Neon'da PostgreSQL bazasi (bepul)

1. **https://neon.tech** ni oching → **Sign up** (Google yoki GitHub orqali).
2. **Create project** tugmasini bosing (nomi: `finance-bot`, region: eng yaqini).
3. **Connection string** oynasida **Prisma** yoki **Node.js** ni tanlab, nusxa oling.
4. Satr shunday ko'rinadi:
   ```
   postgresql://neondb_owner:AbCdEf123@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Bu sizning `DATABASE_URL` ingiz.

### 2-qadam. BotFather orqali bot ochish

1. Telegram'da **@BotFather** ni toping va **Start** bosing.
2. `/newbot` buyrug'ini yuboring.
3. Bot **nomini** yozing, masalan: `Mening moliyam`.
4. Bot **username** ini yozing — u noyob bo'lishi va **`bot`** bilan tugashi shart:
   `my_finance_2026_bot`.
5. Javobda kelgan satr — bu **BOT_TOKEN**:
   ```
   123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
   ```
   Uni hech kimga bermang.

---

## ⚙️ O'rnatish

```bash
cd finbot/backend && npm install && cp .env.example .env
cd ../miniapp && npm install
cd ../admin && npm install
```

## 🔑 .env sozlash

`finbot/backend/.env` faylini oching va to'ldiring:

```env
DATABASE_URL="Neon'dan olingan satr"
BOT_TOKEN="BotFather'dan olingan token"
WEBAPP_URL="http://localhost:5173"
PORT=4000
ADMIN_TOKEN="admin panel uchun parol"
DEFAULT_LANGUAGE="uz"
DEFAULT_CURRENCY="UZS"
DEFAULT_TIMEZONE="Asia/Tashkent"
ALLOW_DEV_AUTH="true"
```

## 🗄 Migratsiya va boshlang'ich ma'lumotlar

```bash
cd finbot/backend
npm run db:push        # jadvallarni yaratadi
npm run db:seed        # asosiy kategoriyalarni yozadi
```

## ▶️ Ishga tushirish (3 ta terminal)

```bash
# 1-terminal — backend va bot
cd finbot/backend && npm run dev

# 2-terminal — Mini App
cd finbot/miniapp && npm run dev      # http://localhost:5173

# 3-terminal — Admin panel
cd finbot/admin && npm run dev        # http://localhost:5174
```

Botni Telegram'da oching va `/start` yuboring — u tilni tanlashni so'raydi.

---

## 🌐 ngrok orqali Mini App'ni botga ulash

Telegram faqat **https** manzillarni qabul qiladi, `localhost` ni ko'rmaydi.
**Faqat bitta tunnel kerak — `5173` portga** (API so'rovlari `/api` orqali avtomatik `4000` portga uzatiladi).

```bash
# ngrok.com da ro'yxatdan o'ting va tokeningizni qo'shing
ngrok config add-authtoken SIZNING_TOKEN

# 4-terminal
ngrok http 5173
```

1. `https://abcd-12-34-56-78.ngrok-free.app` manzilini nusxa oling.
2. `backend/.env` da `WEBAPP_URL` ga qo'ying va 1-terminalni qayta ishga tushiring.
3. **@BotFather** → `/mybots` → botni tanlang → **Bot Settings** → **Menu Button** →
   **Configure menu button** → manzilni joylashtiring → tugma nomi: `Moliya`.

> Bepul ngrok har safar manzilni o'zgartiradi — qayta ishga tushirgach `WEBAPP_URL` va
> BotFather'dagi havolani yangilash kerak.

---

## 🤖 Botdan foydalanish

Eng tezkor usul — botga oddiy xabar yozish:

| Xabar | Natija |
|---|---|
| `45000 taksi` | 45 000 xarajat, «Transport» kategoriyasi avtomatik |
| `+3000000 oylik` | 3 000 000 daromad, «Oylik maosh» |
| `12k qahva` | 12 000 xarajat |
| `2,5 mln ijara` | 2 500 000 xarajat, «Uy-joy» |

Menyu tugmalari: `➖ Xarajat` · `➕ Daromad` · `📊 Hisobot` · `🎯 Maqsadlar` · `💡 Maslahat` ·
`🏆 Yutuqlar` · `📱 Ilova` · `⚙️ Sozlamalar`

---

## ✨ Imkoniyatlar

- Matn orqali tezkor yozuv, kategoriyani avtomatik aniqlash (o'zbek va rus so'zlari);
- kunlik eslatma (o'z vaqtingizda), haftalik va oylik yakunlar;
- kategoriya byudjeti 80% va 100% bo'lganda ogohlantirish;
- 7 kun / shu oy / o'tgan oy hisobotlari, oy oxirigacha prognoz;
- shaxsiy maslahatlar: asosiy xarajat moddasi, mayda xarajatlar effekti, 50/30/20 qoidasi,
  «avval o'zingizga to'lang», xavfsizlik yostig'i, qarzlarni «qor to'pi» usulida yopish;
- 🔥 kunlik seriya, 🏆 10 ta yutuq, ❤️‍🔥 moliyaviy salomatlik indeksi (0–100);
- 🪙 qoldiqni yaxlitlab jamg'armaga o'tkazish;
- maqsadlar (progress va prognoz sana), byudjetlar, qarzlar;
- CSV eksport;
- Mini App: onboarding, «hikoyalar», statistika, grafik, tarix, profil;
- Admin panel: umumiy ko'rsatkichlar, amaliyotlar jadvali, kategoriyalar CRUD,
  foydalanuvchilar, ommaviy xabar yuborish.

To'liq qo'llanma va muammolarni hal qilish bo'limi — [README.md](./README.md) faylida (rus tilida).
