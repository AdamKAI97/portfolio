export const DICT = {
  ru: {
    common: {
      cancel: 'Отмена', save: 'Сохранить', add: 'Добавить', delete: 'Удалить', edit: 'Изменить',
      back: 'Назад', all: 'Все', loading: 'Загружаю…', error: 'Не удалось загрузить', retry: 'Повторить',
      expense: 'Расход', income: 'Доход', today: 'Сегодня', yesterday: 'Вчера', saved: 'Сохранено',
      month: 'месяц', day: 'день', of: 'из', left: 'осталось', done: 'Готово'
    },
    onboarding: {
      langTitle: 'Выберите язык',
      slides: [
        { emoji: '💸', title: 'Деньги под контролем', text: 'Записывайте доходы и расходы за пять секунд — и сразу видно, куда всё уходит.' },
        { emoji: '🧠', title: 'Считаю за вас', text: 'Покажу, сколько можно тратить сегодня, чтобы дожить до зарплаты и ещё отложить.' },
        { emoji: '🎯', title: 'Копите на цель', text: 'Ставьте цели, следите за прогрессом и получайте подсказки, где сэкономить.' }
      ],
      start: 'Начать', next: 'Далее'
    },
    nav: { home: 'Главная', stats: 'Отчёты', plan: 'План', profile: 'Профиль' },
    home: {
      hello: 'Привет', canSpend: 'Можно потратить сегодня', spentToday: 'Сегодня',
      perDay: 'в день до конца месяца', daysLeft: 'дн. до конца месяца',
      income: 'Доходы', expense: 'Расходы', balance: 'Остаток месяца',
      quickAdd: 'Быстрая запись', recent: 'Последние операции', seeAll: 'Все',
      empty: 'Пока ни одной операции. Нажмите ➕ и запишите первую.',
      overspent: 'Перерасход сегодня', streak: 'дн.', noPlan: 'Укажите план дохода в профиле — посчитаю дневной лимит'
    },
    add: {
      title: 'Новая операция', editTitle: 'Операция', amount: 'Сумма', category: 'Категория',
      note: 'Комментарий', submitExpense: 'Записать расход', submitIncome: 'Записать доход',
      saved: 'Записано', deleted: 'Удалено', presets: 'Часто'
    },
    stats: {
      title: 'Отчёты', byCategory: 'Куда ушли деньги', trend: 'Доходы и расходы по месяцам',
      history: 'История', empty: 'За этот период записей нет', avgDay: 'В среднем в день',
      noSpend: 'Дней без трат', forecast: 'Прогноз месяца', saved: 'Отложено', filterAll: 'Все'
    },
    plan: {
      title: 'План', goals: 'Цели', budgets: 'Бюджеты', subs: 'Подписки', debts: 'Долги',
      goalsEmpty: 'Целей пока нет. Добавьте первую — копить станет интереснее.',
      addGoal: 'Новая цель', goalName: 'На что копим', goalTarget: 'Сколько нужно',
      deposit: 'Пополнить', depositAmount: 'Сумма пополнения', reached: 'Цель достигнута',
      monthsLeft: 'мес. при текущем темпе',
      budgetsEmpty: 'Лимитов нет. Поставьте лимит — предупрежу, когда подойдёте к границе.',
      addBudget: 'Поставить лимит', limit: 'Лимит', spent: 'Потрачено', over: 'Превышен',
      subsEmpty: 'Подписок нет. Добавьте аренду, интернет или Netflix — напомню заранее.',
      addSub: 'Новая подписка', subName: 'Название', subDay: 'Число месяца', subTotal: 'Всего в месяц',
      subDayShort: 'числа', pause: 'Пауза', resume: 'Включить',
      debtsEmpty: 'Долгов нет. Отлично!', addDebt: 'Добавить долг', debtPerson: 'Имя человека',
      iOwe: 'Я должен', theyOwe: 'Мне должны', settle: 'Погасить',
      roundUp: 'Округлять сдачу в копилку', roundUpHint: 'Разница до 1000 при каждой трате уходит в первую цель'
    },
    profile: {
      title: 'Профиль', language: 'Язык', theme: 'Тёмная тема', currency: 'Валюта',
      reminder: 'Ежедневное напоминание', reminderTime: 'Время напоминания',
      savingsRate: 'Откладывать, % от дохода', incomePlan: 'План дохода в месяц',
      export: 'Скачать CSV', achievements: 'Достижения', history: 'Все операции',
      streak: 'Серия', best: 'Рекорд', days: 'дн.', unlocked: 'Открыто'
    }
  },

  uz: {
    common: {
      cancel: 'Bekor qilish', save: 'Saqlash', add: "Qo'shish", delete: "O'chirish", edit: "O'zgartirish",
      back: 'Orqaga', all: 'Barchasi', loading: 'Yuklanmoqda…', error: 'Yuklab bo‘lmadi', retry: 'Qayta urinish',
      expense: 'Xarajat', income: 'Daromad', today: 'Bugun', yesterday: 'Kecha', saved: 'Saqlandi',
      month: 'oy', day: 'kun', of: 'dan', left: 'qoldi', done: 'Tayyor'
    },
    onboarding: {
      langTitle: 'Tilni tanlang',
      slides: [
        { emoji: '💸', title: 'Pul nazorat ostida', text: "Daromad va xarajatlarni besh soniyada yozing — pul qayerga ketayotgani darhol ko'rinadi." },
        { emoji: '🧠', title: 'Men hisoblab beraman', text: "Oylikkacha yetkazib, ustiga jamg'arish uchun bugun qancha sarflash mumkinligini ko'rsataman." },
        { emoji: '🎯', title: "Maqsadga jamg'aring", text: "Maqsad qo'ying, progressni kuzating va qayerda tejash bo'yicha maslahat oling." }
      ],
      start: 'Boshlash', next: 'Keyingi'
    },
    nav: { home: 'Asosiy', stats: 'Hisobot', plan: 'Reja', profile: 'Profil' },
    home: {
      hello: 'Salom', canSpend: 'Bugun sarflash mumkin', spentToday: 'Bugun',
      perDay: 'oy oxirigacha kuniga', daysLeft: 'kun qoldi',
      income: 'Daromad', expense: 'Xarajat', balance: 'Oylik qoldiq',
      quickAdd: 'Tezkor yozuv', recent: "So'nggi amaliyotlar", seeAll: 'Hammasi',
      empty: 'Hozircha amaliyot yo‘q. ➕ tugmasini bosing.',
      overspent: 'Bugun ortiqcha sarflandi', streak: 'kun', noPlan: 'Profilda daromad rejasini kiriting — kunlik limitni hisoblayman'
    },
    add: {
      title: 'Yangi amaliyot', editTitle: 'Amaliyot', amount: 'Summa', category: 'Kategoriya',
      note: 'Izoh', submitExpense: 'Xarajatni yozish', submitIncome: 'Daromadni yozish',
      saved: 'Yozildi', deleted: "O'chirildi", presets: 'Tez-tez'
    },
    stats: {
      title: 'Hisobot', byCategory: 'Pul qayerga ketdi', trend: "Oylar bo'yicha daromad va xarajat",
      history: 'Tarix', empty: "Bu davr uchun yozuv yo'q", avgDay: "Kuniga o'rtacha",
      noSpend: 'Xarajatsiz kunlar', forecast: 'Oy prognozi', saved: "Jamg'arma", filterAll: 'Barchasi'
    },
    plan: {
      title: 'Reja', goals: 'Maqsadlar', budgets: 'Byudjet', subs: 'Obunalar', debts: 'Qarzlar',
      goalsEmpty: "Maqsadlar yo'q. Birinchisini qo'shing.",
      addGoal: 'Yangi maqsad', goalName: 'Nimaga jamg‘aramiz', goalTarget: 'Qancha kerak',
      deposit: "To'ldirish", depositAmount: "To'ldirish summasi", reached: 'Maqsadga erishildi',
      monthsLeft: "oy (hozirgi sur'atda)",
      budgetsEmpty: "Limitlar yo'q. Limit qo'ying — chegaraga yaqinlashganda ogohlantiraman.",
      addBudget: "Limit qo'yish", limit: 'Limit', spent: 'Sarflandi', over: 'Oshib ketdi',
      subsEmpty: "Obunalar yo'q. Ijara, internet yoki Netflix qo'shing — oldindan eslataman.",
      addSub: 'Yangi obuna', subName: 'Nomi', subDay: 'Oyning kuni', subTotal: 'Oyiga jami',
      subDayShort: '-sana', pause: 'Pauza', resume: 'Yoqish',
      debtsEmpty: "Qarzlar yo'q. Ajoyib!", addDebt: "Qarz qo'shish", debtPerson: 'Insonning ismi',
      iOwe: 'Men qarzdorman', theyOwe: 'Menga qarzdor', settle: 'Yopish',
      roundUp: "Qoldiqni jamg'armaga yaxlitlash", roundUpHint: "Har xarajatda 1000 gacha farq birinchi maqsadga tushadi"
    },
    profile: {
      title: 'Profil', language: 'Til', theme: 'Tungi rejim', currency: 'Valyuta',
      reminder: 'Kunlik eslatma', reminderTime: 'Eslatma vaqti',
      savingsRate: "Jamg'arma, daromadning %", incomePlan: 'Oylik daromad rejasi',
      export: 'CSV yuklab olish', achievements: 'Yutuqlar', history: 'Barcha amaliyotlar',
      streak: 'Seriya', best: 'Rekord', days: 'kun', unlocked: 'Ochilgan'
    }
  }
};

export function makeT(lang) {
  const dict = DICT[lang] || DICT.ru;
  return (path) => path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), dict) ?? path;
}
