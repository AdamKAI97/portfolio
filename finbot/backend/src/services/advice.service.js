import TransactionModel from '../models/Transaction.js';
import GoalModel from '../models/Goal.js';
import DebtModel from '../models/Debt.js';
import * as A from './analytics.service.js';
import * as D from './date.service.js';
import { money, shortMoney, categoryName } from './format.service.js';

const NEEDS = ['food', 'home', 'connection', 'transport', 'health', 'education', 'family'];

const TEXT = {
  ru: {
    topCategory: (c, sum, p, year) =>
      `Больше всего уходит на «${c}» — ${sum} (${p}% расходов). Срежьте всего на 20% и за год останется ${year}.`,
    topCategoryTitle: 'Главная статья расходов',
    smallTitle: 'Эффект мелких трат',
    small: (count, sum, year) =>
      `${count} мелких покупок на ${sum} за месяц. Это ${year} в год. Откажитесь от половины — и цель станет ближе.`,
    growTitle: 'Расходы растут',
    grow: (p, sum) => `Вы тратите на ${p}% больше, чем в прошлом месяце (+${sum}). Проверьте, какая категория выросла.`,
    dropTitle: 'Отличная динамика',
    drop: (p, sum) => `Расходы на ${p}% меньше прошлого месяца — вы сберегли ${sum}. Переведите эту сумму в цель, пока не разошлась.`,
    forecastTitle: 'Прогноз на месяц',
    forecastBad: (f, over) => `При текущем темпе выйдет ${f} — это на ${over} больше вашего дохода. Нужен стоп-лист на неделю.`,
    forecastOk: (f, left) => `При текущем темпе потратите ${f} и останется ${left}. Отложите их сразу, а не «что останется».`,
    payYourselfTitle: 'Сначала заплати себе',
    payYourself: (amount, percent) =>
      `Ваша цель — откладывать ${percent}% дохода, это ${amount} в месяц. Переводите эту сумму в день зарплаты, а не в конце месяца.`,
    budgetOverTitle: 'Бюджет превышен',
    budgetOver: (c, over) => `Категория «${c}» вышла за лимит на ${over}. Поставьте паузу до конца месяца.`,
    noBudgetTitle: 'Поставьте первый лимит',
    noBudget: (c, amount) => `У вас нет ни одного бюджета. Начните с «${c}»: поставьте лимит ${amount} — это на 15% меньше текущих трат.`,
    cushionTitle: 'Подушка безопасности',
    cushion: (months, need) =>
      `Ваших накоплений хватит на ${months} мес. жизни. Цель — 3 месяца, то есть ${need}. Это защита от кредитов в трудный месяц.`,
    goalTitle: 'До цели рукой подать',
    goal: (title, left, months) =>
      `До цели «${title}» осталось ${left}. При текущем темпе — ${months} мес. Добавьте +10% к взносу и срок сократится.`,
    noSpendTitle: 'Дни без трат',
    noSpend: (days, saved) => `В этом месяце ${days} дней без трат. Каждый такой день экономит вам около ${saved}.`,
    debtTitle: 'Долговая нагрузка',
    debt: (sum) => `Открытых долгов на ${sum}. Гасите сначала самый маленький — метод «снежного кома» даёт быстрый результат.`,
    ruleTitle: 'Правило 50/30/20',
    rule: (needs, wants, save) =>
      `Ваш расклад: нужное ${needs}%, желания ${wants}%, накопления ${save}%. Ориентир — 50/30/20.`,
    weekendTitle: 'Выходные дороже будней',
    weekend: (x) => `По выходным вы тратите в ${x} раза больше, чем в будни. Планируйте пятницу заранее.`,
    startTitle: 'Начните с малого',
    start: 'Записывайте каждую трату 7 дней подряд. Обычно люди недооценивают свои расходы на 20-30%.'
  },
  uz: {
    topCategory: (c, sum, p, year) =>
      `Eng ko'p pul «${c}» ga ketmoqda — ${sum} (xarajatlarning ${p}%). Bor-yo'g'i 20% qisqartirsangiz, yiliga ${year} qoladi.`,
    topCategoryTitle: 'Asosiy xarajat moddasi',
    smallTitle: 'Mayda xarajatlar effekti',
    small: (count, sum, year) =>
      `Bir oyda ${count} ta mayda xarid, jami ${sum}. Bu yiliga ${year}. Yarmidan voz keching — maqsad yaqinlashadi.`,
    growTitle: 'Xarajatlar o‘smoqda',
    grow: (p, sum) => `O'tgan oyga nisbatan ${p}% ko'p sarflayapsiz (+${sum}). Qaysi kategoriya oshganini tekshiring.`,
    dropTitle: 'Ajoyib dinamika',
    drop: (p, sum) => `Xarajatlar o'tgan oydan ${p}% kam — siz ${sum} tejadingiz. Sarflanib ketmasdan maqsadga o'tkazing.`,
    forecastTitle: 'Oylik prognoz',
    forecastBad: (f, over) => `Shu sur'atda ${f} bo'ladi — bu daromadingizdan ${over} ko'p. Bir haftalik «stop-ro'yxat» kerak.`,
    forecastOk: (f, left) => `Shu sur'atda ${f} sarflaysiz va ${left} qoladi. Uni «qolganini» kutmasdan darhol jamg'aring.`,
    payYourselfTitle: 'Avval o‘zingizga to‘lang',
    payYourself: (amount, percent) =>
      `Maqsadingiz — daromadning ${percent}% ini jamg'arish, ya'ni oyiga ${amount}. Buni oylik kelgan kuni o'tkazing, oy oxirida emas.`,
    budgetOverTitle: 'Byudjet oshib ketdi',
    budgetOver: (c, over) => `«${c}» kategoriyasi limitdan ${over} ga oshdi. Oy oxirigacha pauza qiling.`,
    noBudgetTitle: 'Birinchi limitni qo‘ying',
    noBudget: (c, amount) => `Sizda hali byudjet yo'q. «${c}» dan boshlang: ${amount} limit qo'ying — bu hozirgidan 15% kam.`,
    cushionTitle: 'Xavfsizlik yostig‘i',
    cushion: (months, need) =>
      `Jamg'armangiz ${months} oylik hayotga yetadi. Maqsad — 3 oy, ya'ni ${need}. Bu qiyin oyda qarzdan himoya.`,
    goalTitle: 'Maqsad yaqin',
    goal: (title, left, months) =>
      `«${title}» maqsadiga ${left} qoldi. Hozirgi sur'atda — ${months} oy. Badalni 10% oshirsangiz, muddat qisqaradi.`,
    noSpendTitle: 'Xarajatsiz kunlar',
    noSpend: (days, saved) => `Bu oyda ${days} kun xarajatsiz o'tdi. Har bunday kun sizga taxminan ${saved} tejaydi.`,
    debtTitle: 'Qarz yuki',
    debt: (sum) => `Ochiq qarzlar ${sum}. Avval eng kichigini yoping — «qor to'pi» usuli tez natija beradi.`,
    ruleTitle: '50/30/20 qoidasi',
    rule: (needs, wants, save) =>
      `Sizning taqsimotingiz: zarur ${needs}%, istaklar ${wants}%, jamg'arma ${save}%. Me'yor — 50/30/20.`,
    weekendTitle: 'Dam olish kunlari qimmat',
    weekend: (x) => `Dam olish kunlari ish kunlariga qaraganda ${x} barobar ko'p sarflaysiz. Juma kunini oldindan rejalang.`,
    startTitle: 'Kichikdan boshlang',
    start: 'Ketma-ket 7 kun har bir xarajatni yozing. Odamlar odatda xarajatlarini 20-30% ga kam baholaydi.'
  }
};

/**
 * Готовит список персональных советов, отсортированный по важности.
 */
export async function buildAdvice(user, limit = 6) {
  const lang = user.language === 'uz' ? 'uz' : 'ru';
  const T = TEXT[lang];
  const cur = user.currency;
  const m = (v) => money(v, cur, lang);
  const s = (v) => shortMoney(v, lang);

  const tz = user.timezone;
  const monthKey = D.currentMonthKey(tz);
  const { from, to } = D.monthRange(tz, monthKey);

  const [overview, rows, goals, debts] = await Promise.all([
    A.monthOverview(user, monthKey),
    TransactionModel.raw(user.id, { from, to, type: 'EXPENSE' }),
    GoalModel.list(user.id, { onlyActive: true }),
    DebtModel.list(user.id, { onlyOpen: true })
  ]);

  const tips = [];
  const push = (weight, tone, emoji, title, text) => tips.push({ weight, tone, emoji, title, text });

  if (overview.count < 5) {
    push(100, 'info', '🚀', T.startTitle, T.start);
  }

  // Превышенные бюджеты
  for (const budget of overview.budgets.filter((b) => b.isOver)) {
    push(95, 'warning', '🔴', T.budgetOverTitle,
      T.budgetOver(categoryName(budget.category, lang), m(budget.spent - budget.amount)));
  }

  // Прогноз против дохода
  if (overview.isCurrentMonth && overview.expense > 0) {
    if (overview.income > 0 && overview.forecast > overview.income) {
      push(90, 'warning', '🔮', T.forecastTitle,
        T.forecastBad(m(overview.forecast), m(overview.forecast - overview.income)));
    } else if (overview.income > 0) {
      push(55, 'good', '🔮', T.forecastTitle,
        T.forecastOk(m(overview.forecast), m(overview.income - overview.forecast)));
    }
  }

  // Главная категория расходов
  const top = overview.breakdown[0];
  if (top && top.total > 0) {
    push(80, 'info', top.category?.emoji || '💸', T.topCategoryTitle,
      T.topCategory(categoryName(top.category, lang), m(top.total), top.percent, s(top.total * 0.2 * 12)));
  }

  // Мелкие траты
  const smallLimit = user.currency === 'UZS' ? 50000 : 10;
  const small = rows.filter((r) => r.amount <= smallLimit);
  if (small.length >= 5) {
    const sum = small.reduce((acc, r) => acc + r.amount, 0);
    push(75, 'info', '☕️', T.smallTitle, T.small(small.length, m(sum), s(sum * 12)));
  }

  // Сравнение с прошлым месяцем
  if (overview.previous.expense > 0 && Math.abs(overview.diffPercent) >= 10) {
    const diff = Math.abs(overview.expense - overview.previous.expense);
    if (overview.diffPercent > 0) {
      push(70, 'warning', '📈', T.growTitle, T.grow(overview.diffPercent, m(diff)));
    } else {
      push(60, 'good', '📉', T.dropTitle, T.drop(Math.abs(overview.diffPercent), m(diff)));
    }
  }

  // Правило 50/30/20
  if (overview.income > 0 && overview.expense > 0) {
    const needs = overview.breakdown
      .filter((b) => NEEDS.includes(b.category?.key))
      .reduce((acc, b) => acc + b.total, 0);
    const wants = overview.expense - needs;
    push(50, 'info', '⚖️', T.ruleTitle,
      T.rule(
        Math.round((needs / overview.income) * 100),
        Math.round((wants / overview.income) * 100),
        Math.max(0, overview.savedPercent)
      ));
  }

  // Сначала заплати себе
  if (overview.income > 0 && overview.savedPercent < user.savingsRate) {
    push(78, 'info', '🏦', T.payYourselfTitle,
      T.payYourself(m(Math.round((overview.income * user.savingsRate) / 100)), user.savingsRate));
  }

  // Нет бюджетов
  if (!overview.budgets.length && top) {
    push(65, 'info', '🎛', T.noBudgetTitle,
      T.noBudget(categoryName(top.category, lang), m(Math.round(top.total * 0.85))));
  }

  // Подушка безопасности
  const saved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  if (overview.expense > 0) {
    const months = (saved / overview.expense).toFixed(1);
    if (Number(months) < 3) {
      push(62, 'info', '🛡', T.cushionTitle, T.cushion(months, m(overview.expense * 3)));
    }
  }

  // Ближайшая цель
  const progress = await A.goalsProgress(user);
  const nearest = progress.filter((g) => !g.isDone).sort((a, b) => b.percent - a.percent)[0];
  if (nearest && nearest.monthsLeft) {
    push(58, 'good', nearest.emoji || '🎯', T.goalTitle,
      T.goal(nearest.title, m(nearest.left), nearest.monthsLeft));
  }

  // Дни без трат
  if (overview.noSpendDays >= 3) {
    push(45, 'good', '🟢', T.noSpendTitle, T.noSpend(overview.noSpendDays, m(overview.avgDay)));
  }

  // Выходные против будней
  if (rows.length >= 10) {
    let weekend = 0;
    let weekday = 0;
    let weekendDays = new Set();
    let weekdayDays = new Set();
    for (const row of rows) {
      const d = D.dayjs(row.date).tz(tz);
      const key = d.format('YYYY-MM-DD');
      if (d.isoWeekday() >= 6) {
        weekend += row.amount;
        weekendDays.add(key);
      } else {
        weekday += row.amount;
        weekdayDays.add(key);
      }
    }
    const avgWeekend = weekend / (weekendDays.size || 1);
    const avgWeekday = weekday / (weekdayDays.size || 1);
    if (avgWeekday > 0 && avgWeekend / avgWeekday >= 1.5) {
      push(40, 'info', '🎈', T.weekendTitle, T.weekend((avgWeekend / avgWeekday).toFixed(1)));
    }
  }

  // Долги
  const owed = debts.filter((d) => d.direction === 'I_OWE').reduce((acc, d) => acc + d.amount, 0);
  if (owed > 0) {
    push(72, 'warning', '🤝', T.debtTitle, T.debt(m(owed)));
  }

  return tips.sort((a, b) => b.weight - a.weight).slice(0, limit);
}

/** Карточки-«истории» для Mini App (кружочки сверху). */
export async function buildStories(user) {
  const lang = user.language === 'uz' ? 'uz' : 'ru';
  const tips = await buildAdvice(user, 6);
  const health = await A.healthScore(user);

  const healthTitle = lang === 'uz' ? 'Moliyaviy salomatlik' : 'Финансовое здоровье';
  const healthText = lang === 'uz'
    ? `Sizning ballingiz: ${health.score}/100. Jamg'arma, muntazamlik, yostiq, byudjet va qarzlar hisobga olindi.`
    : `Ваш балл: ${health.score}/100. Учтены сбережения, регулярность учёта, подушка, бюджеты и долги.`;

  return [
    { id: 'health', emoji: '❤️‍🔥', title: healthTitle, text: healthText, tone: health.level === 'weak' ? 'warning' : 'good', score: health.score },
    ...tips.map((tip, index) => ({ id: `tip-${index}`, ...tip }))
  ];
}

export default { buildAdvice, buildStories };
