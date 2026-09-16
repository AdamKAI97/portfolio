import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Базовые категории. Цвета взяты из проверенной палитры (контраст + дальтонизм).
 * userId = null -> категория доступна всем пользователям бота.
 */
const CATEGORIES = [
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

async function main() {
  console.log('🌱 Заполняю базовые категории...');

  for (const c of CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { key: c.key, userId: null }
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { ...c, isDefault: true }
      });
    } else {
      await prisma.category.create({
        data: { ...c, isDefault: true, userId: null }
      });
    }
  }

  const income = await prisma.category.count({ where: { userId: null, type: 'INCOME' } });
  const expense = await prisma.category.count({ where: { userId: null, type: 'EXPENSE' } });

  console.log(`✅ Готово: ${expense} категорий расходов, ${income} категорий доходов.`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка seed-скрипта:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
