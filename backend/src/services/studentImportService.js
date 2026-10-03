const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const AppError = require('../utils/appError');

function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let targetSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('student')) || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return jsonRows;
}

function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  let targetSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('student')) || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return jsonRows;
}

async function validateStudentImportData(jsonRows) {
  if (!jsonRows || jsonRows.length === 0) {
    throw new AppError('The uploaded Excel file is empty.', 400);
  }

  // Required Column Headers Check
  const sampleRow = jsonRows[0];
  const requiredHeaders = [
    'Student Name',
    'Register Number',
    'Department',
    'Year of Study',
    'Section',
    'Email',
    'Student Phone',
    'Parent Phone',
    'Tutor',
    'Class Advisor',
    'HOD'
  ];

  for (const header of requiredHeaders) {
    if (!(header in sampleRow)) {
      throw new AppError(`Missing required column header in Excel: "${header}"`, 400);
    }
  }

  // Fetch existing database records to check against duplicates & relations
  const existingDepartments = await prisma.department.findMany();
  const existingStudents = await prisma.student.findMany({ select: { registerNumber: true, email: true } });
  const existingUsers = await prisma.user.findMany({ select: { username: true, email: true } });

  const existingRegNumbers = new Set([
    ...existingStudents.map(s => s.registerNumber.toUpperCase()),
    ...existingUsers.map(u => u.username.toUpperCase())
  ]);

  const existingEmails = new Set([
    ...existingStudents.filter(s => s.email).map(s => s.email.toLowerCase()),
    ...existingUsers.filter(u => u.email).map(u => u.email.toLowerCase())
  ]);

  const fileRegNumbers = new Set();
  const fileEmails = new Set();

  const validRows = [];
  const errors = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  jsonRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const studentName = String(row['Student Name'] || '').trim();
    const registerNumber = String(row['Register Number'] || '').trim().toUpperCase();
    const rollNumber = String(row['Roll Number'] || row['Register Number'] || '').trim().toUpperCase();
    const deptName = String(row['Department'] || '').trim();
    const yearStr = String(row['Year of Study'] || '').trim();
    const section = String(row['Section'] || '').trim().toUpperCase();
    const email = String(row['Email'] || '').trim().toLowerCase();
    const studentPhone = String(row['Student Phone'] || '').trim();
    const parentPhone = String(row['Parent Phone'] || '').trim();
    const tutorName = String(row['Tutor'] || '').trim();
    const advisorName = String(row['Class Advisor'] || '').trim();
    const hodName = String(row['HOD'] || '').trim();

    const rowErrors = [];

    if (!studentName) rowErrors.push('Student Name is required');
    if (!registerNumber) rowErrors.push('Register Number is required');
    if (!deptName) rowErrors.push('Department is required');
    if (!yearStr) rowErrors.push('Year of Study is required');
    if (!section) rowErrors.push('Section is required');
    if (!email) rowErrors.push('Email is required');
    if (!tutorName) rowErrors.push('Tutor is required');
    if (!advisorName) rowErrors.push('Class Advisor is required');

    if (email && !emailRegex.test(email)) {
      rowErrors.push(`Invalid email address: "${email}"`);
    }

    if (registerNumber) {
      if (fileRegNumbers.has(registerNumber)) {
        rowErrors.push(`Duplicate Register Number in file: "${registerNumber}"`);
      } else if (existingRegNumbers.has(registerNumber)) {
        rowErrors.push(`Register Number already exists in database: "${registerNumber}"`);
      } else {
        fileRegNumbers.add(registerNumber);
      }
    }

    if (email) {
      if (fileEmails.has(email)) {
        rowErrors.push(`Duplicate Email in file: "${email}"`);
      } else if (existingEmails.has(email)) {
        rowErrors.push(`Email already registered in database: "${email}"`);
      } else {
        fileEmails.add(email);
      }
    }

    const matchedDept = existingDepartments.find(
      d => d.name.toLowerCase() === deptName.toLowerCase() || d.code.toLowerCase() === deptName.toLowerCase() || d.code === 'AI_DS'
    );

    if (!matchedDept) {
      rowErrors.push(`Department "${deptName}" does not exist in database`);
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 1 || year > 4) {
      rowErrors.push(`Invalid Year of Study: "${yearStr}" (Must be 1, 2, 3, or 4)`);
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNum,
        studentName,
        registerNumber,
        email,
        error: rowErrors.join(' | ')
      });
    } else {
      validRows.push({
        row: rowNum,
        studentName,
        registerNumber,
        rollNumber,
        deptId: matchedDept ? matchedDept.id : null,
        deptCode: matchedDept ? matchedDept.code : 'AI_DS',
        year,
        section,
        email,
        studentPhone,
        parentPhone,
        tutorName,
        advisorName,
        hodName
      });
    }
  });

  return {
    totalRows: jsonRows.length,
    validCount: validRows.length,
    errorCount: errors.length,
    validRows,
    errors
  };
}

async function executeStudentImport(validRows) {
  if (!validRows || validRows.length === 0) {
    throw new AppError('No valid student records provided for import.', 400);
  }

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const result = await prisma.$transaction(async (tx) => {
    let importedCount = 0;

    for (const item of validRows) {
      // 1. Resolve or Create Staff records
      let tutorStaff = await tx.staff.findFirst({
        where: {
          name: { contains: item.tutorName },
          departmentId: item.deptId
        }
      });

      if (!tutorStaff) {
        const staffUsername = `tutor_${item.tutorName.replace(/\s+/g, '_').toLowerCase()}`;
        const tutorUser = await tx.user.upsert({
          where: { username: staffUsername },
          update: {},
          create: {
            username: staffUsername,
            passwordHash,
            role: 'TUTOR',
            active: true
          }
        });

        tutorStaff = await tx.staff.create({
          data: {
            userId: tutorUser.id,
            name: item.tutorName,
            employeeId: `EMP_TUTOR_${Math.round(Math.random() * 10000)}`,
            departmentId: item.deptId,
            role: 'TUTOR'
          }
        });
      }

      let advisorStaff = await tx.staff.findFirst({
        where: {
          name: { contains: item.advisorName },
          departmentId: item.deptId
        }
      });

      if (!advisorStaff) {
        const staffUsername = `advisor_${item.advisorName.replace(/\s+/g, '_').toLowerCase()}`;
        const advisorUser = await tx.user.upsert({
          where: { username: staffUsername },
          update: {},
          create: {
            username: staffUsername,
            passwordHash,
            role: 'CLASS_ADVISOR',
            active: true
          }
        });

        advisorStaff = await tx.staff.create({
          data: {
            userId: advisorUser.id,
            name: item.advisorName,
            employeeId: `EMP_ADVISOR_${Math.round(Math.random() * 10000)}`,
            departmentId: item.deptId,
            role: 'CLASS_ADVISOR'
          }
        });
      }

      // 2. Create User Record
      const user = await tx.user.upsert({
        where: { username: item.registerNumber },
        update: { email: item.email },
        create: {
          username: item.registerNumber,
          email: item.email,
          passwordHash,
          role: 'STUDENT',
          active: true
        }
      });

      // 3. Create Student Record
      await tx.student.upsert({
        where: { registerNumber: item.registerNumber },
        update: {
          name: item.studentName,
          rollNumber: item.rollNumber,
          email: item.email,
          studentPhone: item.studentPhone,
          parentPhone: item.parentPhone,
          departmentId: item.deptId,
          year: item.year,
          section: item.section,
          tutorId: tutorStaff.id,
          classAdvisorId: advisorStaff.id
        },
        create: {
          userId: user.id,
          registerNumber: item.registerNumber,
          rollNumber: item.rollNumber,
          name: item.studentName,
          email: item.email,
          studentPhone: item.studentPhone,
          parentPhone: item.parentPhone,
          departmentId: item.deptId,
          year: item.year,
          section: item.section,
          tutorId: tutorStaff.id,
          classAdvisorId: advisorStaff.id
        }
      });

      importedCount++;
    }

    return importedCount;
  });

  return { importedCount: result };
}

module.exports = {
  parseExcelBuffer,
  parseExcelFile,
  validateStudentImportData,
  executeStudentImport
};
