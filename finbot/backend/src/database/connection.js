import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn']
});

export async function connectDatabase() {
  await prisma.$connect();
  console.log('🗄  PostgreSQL (Prisma): подключено');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;
