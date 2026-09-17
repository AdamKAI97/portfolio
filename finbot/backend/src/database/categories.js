/**
 * Базовые категории: используются и seed-скриптом, и автоматическим
 * восстановлением при старте сервера (если таблица пустая).
 * Цвета взяты из проверенной палитры (контраст + дальтонизм).
 * userId = null -> категория доступна всем пользователям бота.
 */
export const DEFAULT_CATEGORIES = [
  // ---------- РАСХОДЫ ----------
  {
    key: 'food', type: 'EXPENSE', emoji: '🍔', color: '#2a78d6', sort: 1,
    nameRu: 'Еда и продукты', nameUz: 'Oziq-ovqat',
    keywords: 'еда,продукты,обед,ужин,завтрак,кафе,ресторан,кофе,чай,магазин,базар,хлеб,мясо,молоко,фрукты,ovqat,tushlik,nonushta,kechki,kafe,restoran,bozor,non,gosht,sut,meva,qahva'
  },
  {
    key: 'transport', type: 'EXPENSE', emoji: '🚕', color: '#eb6834', sort: 2,
    nameRu: 'Транспорт', nameUz: 'Transport',
    keywords: 'такси,метро,автобус,бензин,заправка,парковка,машина,ремонт авто,билет,yandex,taxi,avtobus,metro,benzin,yoqilgi,mashina,parkovka,chipta,yol'
  },
  {
    key: 'home', type: 'EXPENSE', emoji: '🏠', color: '#1baf7a', sort: 3,
    nameRu: 'Жильё и коммуналка', nameUz: 'Uy-joy va kommunal',
    keywords: 'аренда,квартира,коммуналка,свет,газ,вода,отопление,ремонт,мебель,ijara,uy,kvartira,kommunal,chiroq,suv,gaz,isitish,mebel,tamir'
  },
  {
    key: 'connection', type: 'EXPENSE', emoji: '📱', color: '#eda100', sort: 4,
    nameRu: 'Связь и подписки', nameUz: 'Aloqa va obunalar',
    keywords: 'интернет,связь,телефон,мобильный,подписка,тариф,netflix,spotify,youtube,internet,aloqa,telefon,obuna,tarif,uzmobile,ucell,beeline'
  },
  {
    key: 'health', type: 'EXPENSE', emoji: '💊', color: '#e87ba4', sort: 5,
    nameRu: 'Здоровье', nameUz: 'Sogliq',
    keywords: 'аптека,лекарство,врач,больница,анализ,стоматолог,спортзал,фитнес,dorixona,dori,shifokor,kasalxona,tahlil,tish,sport,fitnes'
  },
  {
    key: 'fun', type: 'EXPENSE', emoji: '🎉', color: '#008300', sort: 6,
    nameRu: 'Развлечения', nameUz: 'Kongilochar',
    keywords: 'кино,игра,концерт,отдых,кальян,бар,путешествие,туризм,kino,oyin,konsert,dam,sayohat,turizm,bar'
  },
  {
    key: 'clothes', type: 'EXPENSE', emoji: '👕', color: '#4a3aa7', sort: 7,
    nameRu: 'Одежда и красота', nameUz: 'Kiyim va gozallik',
    keywords: 'одежда,обувь,кроссовки,куртка,футболка,парикмахер,салон,косметика,kiyim,poyabzal,krossovka,kurtka,sartarosh,kosmetika'
  },
  {
    key: 'education', type: 'EXPENSE', emoji: '📚', color: '#256abf', sort: 8,
    nameRu: 'Образование', nameUz: 'Talim',
    keywords: 'курс,учеба,книга,университет,школа,репетитор,kurs,oqish,kitob,universitet,maktab,repetitor'
  },
  {
    key: 'family', type: 'EXPENSE', emoji: '👨‍👩‍👧', color: '#d95926', sort: 9,
    nameRu: 'Семья и дети', nameUz: 'Oila va bolalar',
    keywords: 'дети,ребенок,садик,игрушки,подарок,свадьба,той,bola,bolalar,bogcha,oyinchoq,sovga,toy,nikoh'
  },
  {
    key: 'other_expense', type: 'EXPENSE', emoji: '🧾', color: '#e34948', sort: 99,
    nameRu: 'Другое', nameUz: 'Boshqa',
    keywords: ''
  },

  // ---------- ДОХОДЫ ----------
  {
    key: 'salary', type: 'INCOME', emoji: '💼', color: '#2a78d6', sort: 1,
    nameRu: 'Зарплата', nameUz: 'Oylik maosh',
    keywords: 'зарплата,оклад,аванс,получка,oylik,maosh,ish haqi,avans'
  },
  {
    key: 'freelance', type: 'INCOME', emoji: '🧑‍💻', color: '#1baf7a', sort: 2,
    nameRu: 'Подработка', nameUz: 'Qoshimcha ish',
    keywords: 'подработка,фриланс,заказ,проект,freelance,buyurtma,loyiha,qoshimcha'
  },
  {
    key: 'business', type: 'INCOME', emoji: '🏪', color: '#eb6834', sort: 3,
    nameRu: 'Бизнес', nameUz: 'Biznes',
    keywords: 'бизнес,продажа,выручка,прибыль,biznes,savdo,daromad,foyda'
  },
  {
    key: 'gift_income', type: 'INCOME', emoji: '🎁', color: '#e87ba4', sort: 4,
    nameRu: 'Подарок и премия', nameUz: 'Sovga va mukofot',
    keywords: 'подарок,премия,бонус,sovga,mukofot,bonus'
  },
  {
    key: 'other_income', type: 'INCOME', emoji: '➕', color: '#4a3aa7', sort: 99,
    nameRu: 'Другое', nameUz: 'Boshqa',
    keywords: ''
  }
];

/**
 * Записывает базовые категории. Существующие обновляет, новые создаёт.
 */
export async function seedCategories(prisma) {
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { key: category.key, userId: null }
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { ...category, isDefault: true }
      });
    } else {
      await prisma.category.create({
        data: { ...category, isDefault: true, userId: null }
      });
    }
  }

  const [expense, income] = await Promise.all([
    prisma.category.count({ where: { userId: null, type: 'EXPENSE' } }),
    prisma.category.count({ where: { userId: null, type: 'INCOME' } })
  ]);

  return { expense, income };
}

/**
 * Страховка при запуске сервера: без категорий бот не сможет записать операцию,
 * поэтому если их нет — создаём молча.
 */
export async function ensureDefaultCategories(prisma) {
  const count = await prisma.category.count({ where: { userId: null } });
  if (count > 0) return { created: false, expense: 0, income: 0 };

  const result = await seedCategories(prisma);
  return { created: true, ...result };
}

export default { DEFAULT_CATEGORIES, seedCategories, ensureDefaultCategories };
