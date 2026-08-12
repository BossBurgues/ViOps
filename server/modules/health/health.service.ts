import { prisma } from '../../infra/prisma.js';

export const healthService = {
  getHealth() {
    return {
      status: 'ok',
      service: 'viops-api',
    };
  },

  async getDbHealth() {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      service: 'viops-api',
      database: 'ok',
    };
  },
};
