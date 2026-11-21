const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all Student OD and Leave application data...');

  const appCount = await prisma.application.count();
  const historyCount = await prisma.approvalHistory.count();
  const docCount = await prisma.document.count();
  const parentConfCount = await prisma.parentConfirmation.count();

  // Clean up notifications related to applications
  await prisma.notification.deleteMany({
    where: {
      applicationId: { not: null }
    }
  });

  // Delete all applications (cascades to ApprovalHistory, Document, ParentConfirmation)
  const result = await prisma.application.deleteMany({});

  console.log(`Successfully deleted ${result.count} applications.`);
  console.log(`Cleaned up ${historyCount} approval histories, ${docCount} documents, and ${parentConfCount} confirmations.`);
  console.log('Students, staff, departments, and user accounts are kept intact.');
}

main()
  .catch((e) => {
    console.error('Error clearing applications:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
