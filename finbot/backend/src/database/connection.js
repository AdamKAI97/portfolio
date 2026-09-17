import { PrismaClient } from '@prisma/client';
import config from '../config/default.js';

/**
 * В облаке функция может запускаться много раз подряд, поэтому клиент
 * кешируется в globalThis — иначе Prisma открывает лишние соединения.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__finbotPrisma ||
  new PrismaClient({
    log: config.env === 'production' ? ['error'] : ['error', 'warn'],
    datasources: config.databaseUrl ? { db: { url: config.databaseUrl } } : undefined
  });

if (!globalForPrisma.__finbotPrisma) globalForPrisma.__finbotPrisma = prisma;

export async function connectDatabase() {
  await prisma.$connect();
  console.log('🗄  PostgreSQL (Prisma): подключено');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;
