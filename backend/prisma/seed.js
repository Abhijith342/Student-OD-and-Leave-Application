const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const studentImportService = require('../src/services/studentImportService');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database from student_import_template.xlsx...');

  // 1. Create Department
  const dept = await prisma.department.upsert({
    where: { code: 'AI_DS' },
    update: { name: 'Artificial Intelligence and Data Science' },
    create: {
      name: 'Artificial Intelligence and Data Science',
      code: 'AI_DS',
      active: true,
    }
  });

  console.log(`✅ Department initialized: ${dept.name} (${dept.code})`);

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Tutor & Class Advisor 1: N PREMKUMAR (Usernames: premkumar, tutor_aids, advisor_aids)
  const tutor1User = await prisma.user.upsert({
    where: { username: 'premkumar' },
    update: {},
    create: {
      username: 'premkumar',
      passwordHash,
      role: 'CLASS_ADVISOR',
      active: true,
    }
  });

  const tutor1Staff = await prisma.staff.upsert({
    where: { userId: tutor1User.id },
    update: { name: 'N PREMKUMAR' },
    create: {
      userId: tutor1User.id,
      name: 'N PREMKUMAR',
      employeeId: 'EMP_PREMKUMAR',
      departmentId: dept.id,
      role: 'CLASS_ADVISOR',
    }
  });

  // Tutor 2: C DIVYA REVATHI (Usernames: divya, tutor_divya)
  const tutor2User = await prisma.user.upsert({
    where: { username: 'divya' },
    update: {},
    create: {
      username: 'divya',
      passwordHash,
      role: 'TUTOR',
      active: true,
    }
  });

  const tutor2Staff = await prisma.staff.upsert({
    where: { userId: tutor2User.id },
    update: { name: 'C DIVYA REVATHI' },
    create: {
      userId: tutor2User.id,
      name: 'C DIVYA REVATHI',
      employeeId: 'EMP_DIVYA',
      departmentId: dept.id,
      role: 'TUTOR',
    }
  });

  // HOD: PAVITHRA (Usernames: pavithra, hod_aids)
  const hodUser = await prisma.user.upsert({
    where: { username: 'pavithra' },
    update: {},
    create: {
      username: 'pavithra',
      passwordHash,
      role: 'HOD',
      active: true,
    }
  });

  const hodStaff = await prisma.staff.upsert({
    where: { userId: hodUser.id },
    update: { name: 'PAVITHRA' },
    create: {
      userId: hodUser.id,
      name: 'PAVITHRA',
      employeeId: 'EMP_HOD_PAVITHRA',
      departmentId: dept.id,
      role: 'HOD',
    }
  });

  // Also keep hod_aids alias for convenience
  await prisma.user.upsert({
    where: { username: 'hod_aids' },
    update: {},
    create: {
      username: 'hod_aids',
      passwordHash,
      role: 'HOD',
      active: true,
    }
  });

  // Principal Office Staff
  const principalUser = await prisma.user.upsert({
    where: { username: 'principal_office' },
    update: {},
    create: {
      username: 'principal_office',
      passwordHash,
      role: 'PRINCIPAL_OFFICE',
      active: true,
    }
  });

  await prisma.staff.upsert({
    where: { userId: principalUser.id },
    update: {},
    create: {
      userId: principalUser.id,
      name: 'Superintendent (Principal Office)',
      employeeId: 'EMP_PO_01',
      departmentId: dept.id,
      role: 'PRINCIPAL_OFFICE',
    }
  });

  // Admin User
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
      active: true,
    }
  });

  console.log('✅ Demo Staff accounts initialized.');

  // 3. Read Student Records directly from student_import_template.xlsx in workspace root
  const excelPath = path.resolve(__dirname, '../../student_import_template.xlsx');
  let excelRows = [];

  if (fs.existsSync(excelPath)) {
    console.log(`📖 Reading student dataset from: ${excelPath}`);
    excelRows = studentImportService.parseExcelFile(excelPath);
  } else {
    console.log('⚠️ student_import_template.xlsx not found in workspace root.');
  }

  if (excelRows.length > 0) {
    const previewResult = await studentImportService.validateStudentImportData(excelRows);
    console.log(`📊 Validating Excel data: ${previewResult.validCount} valid rows out of ${previewResult.totalRows} total rows.`);

    if (previewResult.validCount > 0) {
      const importResult = await studentImportService.executeStudentImport(previewResult.validRows);
      console.log(`🎉 Successfully imported ${importResult.importedCount} student records from student_import_template.xlsx into database!`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
