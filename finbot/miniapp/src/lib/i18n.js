export const DICT = {
  ru: {
    common: {
      cancel: 'Отмена', save: 'Сохранить', add: 'Добавить', delete: 'Удалить', back: 'Назад',
      all: 'Все', loading: 'Загружаю…', error: 'Ошибка загрузки', yes: 'Да', no: 'Нет',
      expense: 'Расход', income: 'Доход', month: 'Месяц', today: 'Сегодня', retry: 'Повторить'
    },
    onboarding: {
      langTitle: 'Выберите язык',
      slides: [
        { emoji: '💸', title: 'Деньги утекают незаметно?', text: 'Записывайте доходы и расходы за 5 секунд — и сразу видно, куда всё уходит.' },
        { emoji: '⚡️', title: 'Как это работает', text: 'Пишете сумму боту или в приложении → я раскладываю по категориям → показываю отчёт.' },
        { emoji: '🎯', title: 'Копите на цель', text: 'Ставьте цель, следите за прогрессом и получайте советы, где сэкономить.' }
      ],
      start: 'Начать',
      next: 'Далее'
    },
    nav: { home: 'Главная', stats: 'Статистика', goals: 'Цели', profile: 'Профиль' },
    home: {
      hello: 'Привет',
      subtitle: 'Держим бюджет под контролем',
      balance: 'Баланс месяца',
      income: 'Доходы',
      expense: 'Расходы',
      cta: 'Новая операция',
      ctaHint: 'Запишите трату или доход за 5 секунд',
      recent: 'Последние операции',
      empty: 'Пока нет ни одной операции',
      forecast: 'Прогноз на месяц',
      streak: 'дней подряд',
      seeAll: 'Все операции'
    },
    add: {
      title: 'Новая операция',
      amount: 'Сумма',
      category: 'Категория',
      note: 'Комментарий (необязательно)',
      submitExpense: 'Записать расход',
      submitIncome: 'Записать доход',
      saved: 'Записано!'
    },
    stats: {
      title: 'Статистика',
      byCategory: 'Куда ушли деньги',
      trend: 'Доходы и расходы по месяцам',
      history: 'История',
      empty: 'Нет данных за этот период',
      avgDay: 'В среднем в день',
      noSpend: 'Дней без трат',
      forecast: 'Прогноз месяца',
      health: 'Финансовое здоровье',
      filterAll: 'Все категории'
    },
    goals: {
      title: 'Цели и бюджеты',
      goals: 'Цели',
      empty: 'Целей пока нет. Добавьте первую — копить станет интереснее.',
      add: 'Новая цель',
      name: 'Название цели',
      target: 'Сколько нужно',
      create: 'Создать цель',
      deposit: 'Пополнить',
      depositAmount: 'Сумма пополнения',
      of: 'из',
      left: 'осталось',
      done: 'Цель достигнута',
      roundUp: 'Округлять сдачу в копилку',
      roundUpHint: 'При каждой трате разница до 1000 сум уйдёт в первую цель',
      budgets: 'Бюджеты по категориям',
      budgetsEmpty: 'Лимитов нет. Поставьте лимит — предупрежу, когда подойдёте к границе.',
      setLimit: 'Поставить лимит',
      limit: 'Лимит',
      spent: 'Потрачено',
      over: 'Превышен'
    },
    profile: {
      title: 'Профиль',
      language: 'Язык',
      reminder: 'Ежедневное напоминание',
      reminderTime: 'Время напоминания',
      savingsRate: 'Норма сбережений, %',
      incomePlan: 'План дохода в месяц',
      export: 'Скачать CSV',
      achievements: 'Достижения',
      history: 'Мои операции',
      streak: 'Серия учёта',
      best: 'Рекорд',
      days: 'дн.',
      saved: 'Сохранено',
      repeat: 'Повторить операцию',
      unlocked: 'Открыто'
    }
  },

  uz: {
    common: {
      cancel: 'Bekor qilish', save: 'Saqlash', add: "Qo'shish", delete: "O'chirish", back: 'Orqaga',
      all: 'Barchasi', loading: 'Yuklanmoqda…', error: 'Yuklashda xatolik', yes: 'Ha', no: "Yo'q",
      expense: 'Xarajat', income: 'Daromad', month: 'Oy', today: 'Bugun', retry: 'Qayta urinish'
    },
    onboarding: {
      langTitle: 'Tilni tanlang',
      slides: [
        { emoji: '💸', title: 'Pul sezdirmay ketyaptimi?', text: "Daromad va xarajatlarni 5 soniyada yozing — pul qayerga ketayotgani darhol ko'rinadi." },
        { emoji: '⚡️', title: 'Bu qanday ishlaydi', text: "Summani botga yoki ilovaga yozasiz → men kategoriyalarga ajrataman → hisobot ko'rsataman." },
        { emoji: '🎯', title: "Maqsadga jamg'aring", text: "Maqsad qo'ying, progressni kuzating va qayerda tejash bo'yicha maslahat oling." }
      ],
      start: 'Boshlash',
      next: 'Keyingi'
    },
    nav: { home: 'Asosiy', stats: 'Statistika', goals: 'Maqsadlar', profile: 'Profil' },
    home: {
      hello: 'Salom',
      subtitle: 'Byudjet nazorat ostida',
      balance: 'Oylik balans',
      income: 'Daromadlar',
      expense: 'Xarajatlar',
      cta: 'Yangi amaliyot',
      ctaHint: 'Xarajat yoki daromadni 5 soniyada yozing',
      recent: "So'nggi amaliyotlar",
      empty: 'Hozircha amaliyotlar yo‘q',
      forecast: 'Oylik prognoz',
      streak: 'kun ketma-ket',
      seeAll: 'Barcha amaliyotlar'
    },
    add: {
      title: 'Yangi amaliyot',
      amount: 'Summa',
      category: 'Kategoriya',
      note: 'Izoh (ixtiyoriy)',
      submitExpense: 'Xarajatni yozish',
      submitIncome: 'Daromadni yozish',
      saved: 'Yozildi!'
    },
    stats: {
      title: 'Statistika',
      byCategory: 'Pul qayerga ketdi',
      trend: 'Oylar bo‘yicha daromad va xarajat',
      history: 'Tarix',
      empty: "Bu davr uchun ma'lumot yo'q",
      avgDay: "Kuniga o'rtacha",
      noSpend: 'Xarajatsiz kunlar',
      forecast: 'Oy prognozi',
      health: 'Moliyaviy salomatlik',
      filterAll: 'Barcha kategoriyalar'
    },
    goals: {
      title: 'Maqsad va byudjetlar',
      goals: 'Maqsadlar',
      empty: "Maqsadlar yo'q. Birinchisini qo'shing — jamg'arish qiziqarli bo'ladi.",
      add: 'Yangi maqsad',
      name: 'Maqsad nomi',
      target: 'Qancha kerak',
      create: 'Maqsad yaratish',
      deposit: "To'ldirish",
      depositAmount: "To'ldirish summasi",
      of: 'dan',
      left: 'qoldi',
      done: 'Maqsadga erishildi',
      roundUp: "Qoldiqni jamg'armaga yaxlitlash",
      roundUpHint: "Har bir xarajatda 1000 so'mgacha farq birinchi maqsadga tushadi",
      budgets: "Kategoriyalar bo'yicha byudjet",
      budgetsEmpty: "Limitlar yo'q. Limit qo'ying — chegaraga yaqinlashganda ogohlantiraman.",
      setLimit: "Limit qo'yish",
      limit: 'Limit',
      spent: 'Sarflandi',
      over: 'Oshib ketdi'
    },
    profile: {
      title: 'Profil',
      language: 'Til',
      reminder: 'Kunlik eslatma',
      reminderTime: 'Eslatma vaqti',
      savingsRate: "Jamg'arma normasi, %",
      incomePlan: 'Oylik daromad rejasi',
      export: 'CSV yuklab olish',
      achievements: 'Yutuqlar',
      history: 'Mening amaliyotlarim',
      streak: 'Hisob seriyasi',
      best: 'Rekord',
      days: 'kun',
      saved: 'Saqlandi',
      repeat: 'Amaliyotni takrorlash',
      unlocked: 'Ochilgan'
    }
  }
};

export function makeT(lang) {
  const dict = DICT[lang] || DICT.ru;
  return (path) => path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), dict) ?? path;
}
