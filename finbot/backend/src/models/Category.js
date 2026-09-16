import prisma from '../database/connection.js';

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[ʼʻ'`’]/g, '')
    .trim();

export const CategoryModel = {
  listFor(userId, type) {
    return prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId: Number(userId) }],
        ...(type ? { type } : {})
      },
      orderBy: [{ type: 'asc' }, { sort: 'asc' }, { id: 'asc' }]
    });
  },

  listAll() {
    return prisma.category.findMany({ orderBy: [{ type: 'asc' }, { sort: 'asc' }] });
  },

  findById(id) {
    return prisma.category.findUnique({ where: { id: Number(id) } });
  },

  findByKey(key, userId = null) {
    return prisma.category.findFirst({
      where: { key, OR: [{ userId: null }, { userId: userId ? Number(userId) : undefined }] }
    });
  },

  create(data) {
    return prisma.category.create({ data });
  },

  update(id, data) {
    return prisma.category.update({ where: { id: Number(id) }, data });
  },

  remove(id) {
    return prisma.category.delete({ where: { id: Number(id) } });
  },

  /** Подбирает категорию по словам в описании операции. */
  async guess(userId, type, text) {
    const haystack = normalize(text);
    if (!haystack) return null;

    const categories = await CategoryModel.listFor(userId, type);
    let best = null;
    let bestLength = 0;

    for (const category of categories) {
      const words = String(category.keywords || '')
        .split(',')
        .map(normalize)
        .filter(Boolean);

      for (const word of words) {
        if (word.length >= 3 && haystack.includes(word) && word.length > bestLength) {
          best = category;
          bestLength = word.length;
        }
      }
    }

    return best;
  },

  async fallback(userId, type) {
    const key = type === 'INCOME' ? 'other_income' : 'other_expense';
    const found = await prisma.category.findFirst({ where: { key, userId: null } });
    if (found) return found;
    const list = await CategoryModel.listFor(userId, type);
    return list[0] || null;
  }
};

export default CategoryModel;
