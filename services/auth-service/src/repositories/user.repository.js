const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class UserRepository {
  async create(data) {
    return prisma.user.create({ data });
  }

  async findById(id) {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async findByEmail(email) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  async findByDID(did) {
    return prisma.user.findFirst({ where: { did, deletedAt: null } });
  }

  async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  }

  async softDelete(id) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async recordLogin(userId, ipAddress, userAgent, success) {
    return prisma.loginHistory.create({
      data: { userId, ipAddress, userAgent, success },
    });
  }
}

module.exports = new UserRepository();
