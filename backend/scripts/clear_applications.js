const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging all existing OD and Leave application data...');

  const confirmations = await prisma.parentConfirmation.deleteMany({});
  console.log(`- Deleted ${confirmations.count} ParentConfirmation records.`);

  const histories = await prisma.approvalHistory.deleteMany({});
  console.log(`- Deleted ${histories.count} ApprovalHistory records.`);

  const documents = await prisma.document.deleteMany({});
  console.log(`- Deleted ${documents.count} Document records.`);

  const notifications = await prisma.notification.deleteMany({});
  console.log(`- Deleted ${notifications.count} Notification records.`);

  const applications = await prisma.application.deleteMany({});
  console.log(`✅ Deleted ${applications.count} Application records (OD & Leave).`);
}

main()
  .catch((e) => {
    console.error('❌ Error clearing application data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
