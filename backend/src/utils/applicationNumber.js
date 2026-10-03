const prisma = require('../config/prisma');

async function generateApplicationNumber(type) {
  const prefix = type === 'OD' ? 'OD' : 'LV';
  const year = new Date().getFullYear();

  // Find the count of applications of this type created in the current year
  const count = await prisma.application.count({
    where: {
      type,
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      },
    },
  });

  const nextSequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}${year}${nextSequence}`;
}

module.exports = { generateApplicationNumber };
