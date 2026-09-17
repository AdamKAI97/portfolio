export default {
  code: 'uz',
  label: `🇺🇿 O'zbekcha`,

  common: {
    back: `⬅️ Orqaga`,
    cancel: `✖️ Bekor qilish`,
    skip: `O'tkazib yuborish`,
    canceled: `Bekor qilindi.`,
    yes: `Ha`,
    no: `Yo'q`,
    error: `Xatolik yuz berdi. Qaytadan urinib ko'ring.`,
    unknown: `Tushunmadim. Pastdagi menyudan foydalaning 👇`,
    currency: `so'm`
  },

  lang: {
    choose: `🌐 Tilni tanlang / Выберите язык`,
    saved: `Tayyor! Interfeys tili — o'zbekcha 🇺🇿`
  },

  start: {
    welcome: ({ name }) => `Salom, ${name}! 👋

Men sizning shaxsiy moliyaviy yordamchingizman.

Nima qila olaman:
• daromad va xarajatlarni 5 soniyada yozib olaman
• har kuni kechqurun hisobni eslatib turaman
• pulingiz qayerga ketayotganini ko'rsataman
• qayerda tejash va qanday jamg'arish kerakligini aytaman

⚡️ Eng tezkor usul — menga shunchaki yozing:
«45000 taksi» — bu xarajat
«+3000000 oylik» — bu daromad`,
    phoneAsk: `Telefon raqamingizni qoldirasizmi? U faqat kirishni tiklash uchun kerak.`,
    phoneButton: `📞 Raqamni yuborish`,
    phoneSaved: `Raqam saqlandi ✅`,
    menuHint: `Menyu tugmalaridan foydalaning 👇`
  },

  menu: {
    title: `Asosiy menyu`,
    expense: `➖ Xarajat`,
    income: `➕ Daromad`,
    report: `📊 Hisobot`,
    goals: `🎯 Maqsadlar`,
    advice: `💡 Maslahat`,
    achievements: `🏆 Yutuqlar`,
    app: `📱 Ilova`,
    settings: `⚙️ Sozlamalar`,
    debts: `🤝 Qarzlar`
  },

  tx: {
    askExpense: `Qancha sarfladingiz? Summani raqamda yozing, masalan: 45000

Izoh bilan ham bo'ladi: «45000 taksi»`,
    askIncome: `Qancha oldingiz? Summani raqamda yozing, masalan: 3000000

Izoh bilan ham bo'ladi: «3000000 oylik»`,
    invalidAmount: `Summani ko'rmadim 🤔 Raqamda yozing, masalan: 45000`,
    chooseCategory: ({ amount }) => `Summa: ${amount}
Kategoriyani tanlang:`,
    saved: ({ sign, amount, emoji, category, note }) =>
      `✅ Yozib oldim\n\n${sign}${amount}\n${emoji} ${category}${note ? `\n📝 ${note}` : ''}`,
    todayLine: ({ expense, income }) => `📅 Bugun: xarajat ${expense} · daromad ${income}`,
    monthLine: ({ balance }) => `📆 Oylik balans: ${balance}`,
    undo: `↩️ Yozuvni o'chirish`,
    undone: `Yozuv o'chirildi.`,
    quickHint: `💡 Maslahat: keyingi safar to'g'ridan-to'g'ri «45000 taksi» deb yozsangiz ham bo'ladi.`,
    noSpend: `🎉 Xarajatsiz kun! Zo'r natija.`,
    noSpendButton: `🎉 Bugun xarajatsiz`,
    fromApp: ({ sign, amount, emoji, category }) =>
      `✅ Ilovadan yozildi\n\n${sign}${amount}\n${emoji} ${category}`
  },

  report: {
    button7: `7 kun`,
    buttonMonth: `Shu oy`,
    buttonPrev: `O'tgan oy`,
    title: ({ period }) => `📊 Hisobot · ${period}`,
    income: ({ value }) => `Daromad: ${value}`,
    expense: ({ value }) => `Xarajat: ${value}`,
    balance: ({ value }) => `Balans: ${value}`,
    savedPct: ({ value }) => `Jamg'arma: daromadning ${value}%`,
    topTitle: `Pul qayerga ketdi:`,
    empty: `Bu davr uchun yozuvlar yo'q. Birinchisini qo'shing — «➖ Xarajat» tugmasini bosing.`,
    vsLast: ({ percent }) => `o'tgan oyga nisbatan: ${percent}%`,
    forecast: ({ value }) => `🔮 Shu sur'atda oy oxirigacha ≈ ${value}`,
    avgDay: ({ value }) => `Kunlik o'rtacha xarajat: ${value}`,
    noSpendDays: ({ count }) => `Xarajatsiz kunlar: ${count}`,
    streak: ({ days }) => `🔥 Hisob yuritish seriyasi: ${days} kun`
  },

  advice: {
    title: `💡 Shaxsiy maslahatlar`,
    empty: `Hozircha ma'lumot kam. Kamida 5 ta amaliyot yozing — hammasini hisoblab beraman.`
  },

  goals: {
    title: `🎯 Maqsadlaringiz`,
    empty: `Hozircha maqsad yo'q.

Maqsad — bu jamg'arish yoqimli bo'ladigan narsa: telefon, ta'til, xavfsizlik yostig'i.`,
    add: `➕ Yangi maqsad`,
    askTitle: `Nimaga jamg'aramiz? Nomini yozing, masalan: «Turkiyaga ta'til»`,
    askAmount: `Qancha jamg'arish kerak? Summani yozing, masalan: 12000000`,
    askDeadline: `Qaysi sanagacha jamg'armoqchisiz? Format: 31.12.2026

Yoki «O'tkazib yuborish» tugmasini bosing.`,
    created: ({ title }) => `«${title}» maqsadi yaratildi 🎯`,
    row: ({ emoji, title, current, target, percent, bar }) =>
      `${emoji} ${title}\n${bar} ${percent}%\n${target} dan ${current}`,
    eta: ({ date }) => `📅 Hozirgi sur'atda: ${date}`,
    etaNever: `📅 Hozircha jamg'armayapsiz — maqsad yaqinlashmayapti.`,
    deposit: `💰 Maqsadni to'ldirish`,
    chooseGoal: `Qaysi maqsadni to'ldiramiz?`,
    askDeposit: ({ title }) => `«${title}» uchun qancha qo'shamiz?`,
    deposited: ({ title, amount }) => `«${title}» maqsadiga ${amount} qo'shildi 💰`,
    reached: ({ title }) => `🏆 «${title}» maqsadiga erishdingiz! Tabriklayman!`,
    remove: `🗑 Maqsadni o'chirish`,
    removed: `Maqsad o'chirildi.`
  },

  debts: {
    title: `🤝 Qarzlar`,
    empty: `Qarzlar yo'q. Ajoyib!`,
    add: `➕ Qarz qo'shish`,
    iOwe: `Men qarzdorman`,
    theyOwe: `Menga qarzdor`,
    askDirection: `Kim kimga qarzdor?`,
    askPerson: `Insonning ismi?`,
    askAmount: `Qarz summasi?`,
    created: `Qarz yozildi ✅`,
    settle: `✅ Yopish`,
    settled: `Qarz yopildi. 🎉`
  },

  achievements: {
    title: `🏆 Yutuqlar`,
    progress: ({ unlocked, total }) => `${total} tadan ${unlocked} tasi ochilgan`,
    locked: `🔒`
  },

  settings: {
    title: `⚙️ Sozlamalar`,
    language: `🌐 Til`,
    reminder: ({ state }) => `🔔 Eslatmalar: ${state}`,
    on: `yoniq`,
    off: `o'chiq`,
    reminderTime: ({ time }) => `⏰ Eslatma vaqti: ${time}`,
    askTime: `Soat nechida eslatay? Format SS:DD, masalan 21:00`,
    invalidTime: `Format noto'g'ri. Masalan: 21:00`,
    timeSaved: ({ time }) => `Soat ${time} da eslataman ✅`,
    savingsRate: ({ percent }) => `🏦 Jamg'arma normasi: ${percent}%`,
    askSavingsRate: `Daromadning necha foizini jamg'armoqchisiz? 1 dan 90 gacha raqam yozing.`,
    savingsSaved: ({ percent }) => `Jamg'arma maqsadi: ${percent}% ✅`,
    incomePlan: ({ value }) => `📈 Oylik daromad rejasi: ${value}`,
    askIncomePlan: `Oyiga qancha daromad rejalashtiryapsiz? Summani yozing (0 — hisoblamaslik).`,
    export: `📤 CSV yuklab olish`,
    exportEmpty: `Hozircha yuklab olinadigan narsa yo'q.`,
    exportCaption: `Amaliyotlaringiz CSV formatida (Excel'da ochiladi).`,
    roundUp: ({ state }) => `🪙 Qoldiqni yaxlitlash: ${state}`,
    roundUpInfo: `Har bir xarajatda 1000 so'mgacha bo'lgan farq cho'ntak-jamg'armaga tushadi.`,
    wipe: `🗑 Barcha ma'lumotlarimni o'chirish`,
    wipeConfirm: `Barcha amaliyot, maqsad va sozlamalar o'chirilsinmi? Buni qaytarib bo'lmaydi.`,
    wiped: `Hamma ma'lumot o'chirildi. Toza varaqdan boshlaymiz.`,
    saved: `Saqlandi ✅`
  },

  reminder: {
    daily: ({ name }) => `Salom, ${name}! Kun qanday o'tdi? 🌙

Xarajat va daromadlarni yozing, shunda oy sezdirmay «oqib ketmaydi».`,
    dailyExpense: `➖ Xarajat yozish`,
    dailyIncome: `➕ Daromad yozish`,
    weekly: ({ period }) => `📊 Hafta yakunlari (${period})`,
    monthly: ({ period }) => `📊 Oy yakunlari (${period})`,
    budgetWarn: ({ category, percent, left }) =>
      `⚠️ «${category}» byudjeti ${percent}% sarflandi. ${left} qoldi.`,
    budgetOver: ({ category, over }) =>
      `🔴 «${category}» byudjeti ${over} ga oshib ketdi.`,
    recurring: ({ title, amount }) =>
      `🔁 Bugun muntazam to'lov: ${title} — ${amount}`,
    streakLost: `🔥 Seriya uzildi. Hechqisi yo'q — qaytadan boshlaymiz!`
  },

  app: {
    open: `📱 Ilovani ochish`,
    text: `Ilovada — grafiklar, tarix, maqsadlar va byudjetlar.`,
    localOnly: ({ url }) => `📱 Ilova ishlayapti, lekin hozircha faqat kompyuteringizdagi brauzerda:

${url}

To'g'ridan-to'g'ri Telegram ichida ochilishi uchun https manzil kerak — uni ngrok beradi.
Yo'riqnoma: START.md fayli, 6-qadam. Manzil avtomatik yoziladi, uni @BotFather ga kiritish qoladi.`
  }
};
