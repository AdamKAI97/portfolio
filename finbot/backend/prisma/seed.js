import { PrismaClient } from '@prisma/client';
import { seedCategories } from '../src/database/categories.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Заполняю базовые категории...');
  const { expense, income } = await seedCategories(prisma);
  console.log(`✅ Готово: ${expense} категорий расходов, ${income} категорий доходов.`);
}

main()
  .catch((error) => {
    console.error('❌ Ошибка seed-скрипта:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
