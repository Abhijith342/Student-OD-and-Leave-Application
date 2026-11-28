require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function wipeData() {
  console.log('====================================================');
  console.log('🧹 STARTING SYSTEM DATA PURGE (Departments, Students, Staffs)');
  console.log('====================================================');

  try {
    // 1. Snapshot current count
    const initialCounts = {
      applications: await prisma.application.count(),
      approvalHistories: await prisma.approvalHistory.count(),
      parentConfirmations: await prisma.parentConfirmation.count(),
      documents: await prisma.document.count(),
      notifications: await prisma.notification.count(),
      passwordResetRequests: await prisma.passwordResetRequest.count(),
      students: await prisma.student.count(),
      sections: await prisma.section.count(),
      academicYears: await prisma.academicYear.count(),
      staff: await prisma.staff.count(),
      departments: await prisma.department.count(),
      users: await prisma.user.count(),
      adminUsers: await prisma.user.count({ where: { role: 'ADMIN' } }),
    };

    console.log('Current Database Counts:');
    console.table(initialCounts);

    // 2. Cascade delete applications & all child relations first
    console.log('\n🗑️ Deleting Applications, Documents, Approvals, Confirmations...');
    await prisma.document.deleteMany({});
    await prisma.approvalHistory.deleteMany({});
    await prisma.parentConfirmation.deleteMany({});
    await prisma.application.deleteMany({});

    // 3. Clear Notifications & Reset Requests
    console.log('🗑️ Deleting Notifications and Password Reset Requests...');
    await prisma.notification.deleteMany({});
    await prisma.passwordResetRequest.deleteMany({});

    // 4. Delete Students
    console.log('🗑️ Deleting Students...');
    await prisma.student.deleteMany({});

    // 5. Delete Sections & Academic Years
    console.log('🗑️ Deleting Sections and Academic Years...');
    await prisma.section.deleteMany({});
    await prisma.academicYear.deleteMany({});

    // 6. Delete Staff
    console.log('🗑️ Deleting Staff...');
    await prisma.staff.deleteMany({});

    // 7. Delete Departments
    console.log('🗑️ Deleting Departments...');
    await prisma.department.deleteMany({});

    // 8. Delete Users except ADMIN
    console.log('🗑️ Deleting Student & Staff User Accounts (retaining ADMIN)...');
    await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN',
        },
      },
    });

    // 9. Ensure at least one default Admin account exists
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount === 0) {
      console.log('👤 Creating default admin account (username: admin, password: Password123!)...');
      const passwordHash = await bcrypt.hash('Password123!', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          role: 'ADMIN',
          active: true,
        },
      });
    } else {
      console.log(`👤 Verified ${adminCount} existing Admin account(s) retained.`);
    }

    // 10. Clean uploaded files in backend/uploads
    const uploadsDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let removedFiles = 0;
      for (const file of files) {
        const fullPath = path.join(uploadsDir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          fs.unlinkSync(fullPath);
          removedFiles++;
        }
      }
      console.log(`🧹 Removed ${removedFiles} uploaded files from ${uploadsDir}.`);

      const tempDir = path.join(uploadsDir, 'temp');
      if (fs.existsSync(tempDir)) {
        const tempFiles = fs.readdirSync(tempDir);
        for (const file of tempFiles) {
          const tempPath = path.join(tempDir, file);
          if (fs.statSync(tempPath).isFile()) {
            fs.unlinkSync(tempPath);
          }
        }
      }
    }

    // 11. Final snapshot
    const finalCounts = {
      applications: await prisma.application.count(),
      students: await prisma.student.count(),
      staff: await prisma.staff.count(),
      departments: await prisma.department.count(),
      sections: await prisma.section.count(),
      academicYears: await prisma.academicYear.count(),
      users: await prisma.user.count(),
      adminUsers: await prisma.user.count({ where: { role: 'ADMIN' } }),
    };

    console.log('\n====================================================');
    console.log('✅ DATA PURGE COMPLETE! Final Database State:');
    console.table(finalCounts);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Error while wiping database data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeData();
