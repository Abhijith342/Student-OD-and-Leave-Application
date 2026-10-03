const prisma = require('../config/prisma');
const AppError = require('../utils/appError');

async function getAllDepartments() {
  return await prisma.department.findMany({
    where: { active: true },
    include: {
      _count: {
        select: { students: true, staff: true }
      }
    }
  });
}

async function createDepartment(name, code) {
  const existing = await prisma.department.findUnique({ where: { code } });
  if (existing) {
    throw new AppError(`Department with code ${code} already exists`, 400);
  }

  return await prisma.department.create({
    data: { name, code }
  });
}

module.exports = {
  getAllDepartments,
  createDepartment
};
