require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const prisma = require('../src/config/prisma');

async function clearApplications() {
  const targetType = process.argv[2] ? process.argv[2].toUpperCase() : null;

  console.log('----------------------------------------------------');
  console.log(`Starting OD & Leave Application cleanup process...`);
  if (targetType) {
    console.log(`Targeting Application Type: ${targetType}`);
  } else {
    console.log(`Targeting ALL OD and Leave Applications.`);
  }

  try {
    const where = {};
    if (targetType && (targetType === 'OD' || targetType === 'LEAVE')) {
      where.type = targetType;
    }

    const count = await prisma.application.count({ where });
    console.log(`Found ${count} matching application records in database.`);

    if (count === 0) {
      console.log('No applications to remove.');
      process.exit(0);
    }

    const deleteResult = await prisma.application.deleteMany({ where });
    console.log(`Successfully deleted ${deleteResult.count} application records!`);
    console.log('Associated approval histories, parent confirmations, and documents were cascaded.');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('Failed to clear application data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearApplications();
