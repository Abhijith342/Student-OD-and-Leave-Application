const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const AppError = require('../utils/appError');

function normalizeRowKeys(row) {
  const normalized = {};
  for (const [key, val] of Object.entries(row)) {
    const cleanKey = String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    normalized[cleanKey] = typeof val === 'string' ? val.trim() : val;
  }
  return normalized;
}

function getStudentName(norm = {}, rawRow = {}) {
  // Direct common keys
  if (norm.studentname) return String(norm.studentname).trim();
  if (norm.name) return String(norm.name).trim();
  if (norm.student) return String(norm.student).trim();
  if (norm.fullname) return String(norm.fullname).trim();
  if (norm.nameofthestudent) return String(norm.nameofthestudent).trim();
  if (norm.nameofstudent) return String(norm.nameofstudent).trim();
  if (norm.studentsname) return String(norm.studentsname).trim();
  if (norm.candidatename) return String(norm.candidatename).trim();

  // Normalized key scan
  for (const [k, v] of Object.entries(norm)) {
    if ((k.includes('student') && k.includes('name')) || k === 'name' || k.includes('fullname')) {
      if (v && String(v).trim()) return String(v).trim();
    }
  }

  // Raw row scan
  for (const [k, v] of Object.entries(rawRow)) {
    const lk = k.toLowerCase();
    if (lk.includes('name') && !lk.includes('father') && !lk.includes('mother') && !lk.includes('parent') && !lk.includes('tutor') && !lk.includes('advisor') && !lk.includes('hod') && !lk.includes('user')) {
      if (v && String(v).trim()) return String(v).trim();
    }
  }

  return '';
}

function getRegisterNumber(norm = {}, rawRow = {}) {
  if (norm.registernumber) return String(norm.registernumber).trim();
  if (norm.registerno) return String(norm.registerno).trim();
  if (norm.regno) return String(norm.regno).trim();
  if (norm.registrationnumber) return String(norm.registrationnumber).trim();
  if (norm.regnumber) return String(norm.regnumber).trim();
  if (norm.register) return String(norm.register).trim();

  for (const [k, v] of Object.entries(norm)) {
    if (k.includes('register') || k.includes('regno') || k.includes('regnum')) {
      if (v && String(v).trim()) return String(v).trim();
    }
  }

  for (const [k, v] of Object.entries(rawRow)) {
    const lk = k.toLowerCase();
    if (lk.includes('register') || lk.includes('reg. no') || lk.includes('reg no')) {
      if (v && String(v).trim()) return String(v).trim();
    }
  }

  return '';
}

function isBoilerplateOrEmpty(norm, rawRow = {}) {
  const regNo = getRegisterNumber(norm, rawRow);
  const studentName = getStudentName(norm, rawRow);

  // If no register number AND no student name -> empty row
  if (!regNo && !studentName) return true;

  const boilerplateKeywords = [
    'student import excel template',
    'student import template',
    'purpose',
    'important rules',
    'required columns',
    'sample row',
    'use this template',
    'student name',
    'register number'
  ];

  // If no register number, check if studentName is boilerplate or header
  if (!regNo) {
    if (boilerplateKeywords.some(kw => studentName.toLowerCase().includes(kw))) return true;
    if (/^\d+\.\s+/.test(studentName)) return true;
    if (studentName.length > 40 && studentName.includes(',')) return true;
    return true; // Any row with missing register number cannot be imported as a student
  }

  // If register number itself is header
  if (['register number', 'registernumber', 'reg number', 'reg no', 'registration number'].includes(regNo.toLowerCase())) {
    return true;
  }

  return false;
}

function extractRowsFromWorkbook(workbook) {
  // Prefer sheet with 'student' in name BUT avoid sheets with 'template', 'instruction', 'readme', 'rule'
  let targetSheetName = workbook.SheetNames.find(name => {
    const l = name.toLowerCase();
    return l.includes('student') && !l.includes('template') && !l.includes('instruction') && !l.includes('rule');
  });

  if (!targetSheetName) {
    targetSheetName = workbook.SheetNames.find(name => {
      const l = name.toLowerCase();
      return !l.includes('template') && !l.includes('instruction') && !l.includes('rule') && !l.includes('readme');
    });
  }

  targetSheetName = targetSheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];

  // Raw conversion first
  let jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  // If jsonRows has keys that don't include student name or register number, look for header row
  if (jsonRows.length > 0) {
    const sampleKeys = Object.keys(jsonRows[0]).map(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const hasStudentNameKey = sampleKeys.some(k => k.includes('studentname') || k === 'name' || k.includes('registernumber') || k.includes('regno'));
    if (!hasStudentNameKey) {
      const data2D = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      const headerRowIndex = data2D.findIndex(row => {
        if (!Array.isArray(row)) return false;
        const joined = row.map(c => String(c).toLowerCase().replace(/[^a-z0-9]/g, '')).join(' ');
        return (joined.includes('studentname') || joined.includes('registernumber') || joined.includes('regno')) && joined.includes('department');
      });
      if (headerRowIndex >= 0) {
        jsonRows = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
      }
    }
  }

  return jsonRows;
}

function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return extractRowsFromWorkbook(workbook);
}

function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  return extractRowsFromWorkbook(workbook);
}

async function validateStudentImportData(jsonRows, options = {}) {
  if (!jsonRows || jsonRows.length === 0) {
    throw new AppError('The uploaded Excel file is empty.', 400);
  }

  // Pre-filter rows to remove boilerplate / instruction lines
  const cleanRows = [];
  jsonRows.forEach((row, idx) => {
    const norm = normalizeRowKeys(row);
    if (!isBoilerplateOrEmpty(norm, row)) {
      cleanRows.push({ raw: row, norm, originalIndex: idx });
    }
  });

  if (cleanRows.length === 0) {
    throw new AppError('No student records found in the uploaded file.', 400);
  }

  // Fetch existing database records to check against duplicates & relations
  const existingDepartments = await prisma.department.findMany({
    include: { staff: true }
  });

  let targetDept = null;
  if (options.departmentId) {
    targetDept = existingDepartments.find(
      d => d.id === options.departmentId || d.code === options.departmentId || d.code.toLowerCase() === String(options.departmentId).toLowerCase()
    );
  }

  const targetYear = options.year ? parseInt(options.year, 10) : null;
  const targetSection = options.section ? String(options.section).trim().toUpperCase() : null;

  // Auto-create/resolve any missing departments directly from the Excel dataset
  for (const { norm } of cleanRows) {
    const rawDept = String(norm.department || norm.dept || norm.branch || (targetDept ? targetDept.name : '')).trim();
    if (rawDept) {
      let found = existingDepartments.find(
        d => d.name.toLowerCase() === rawDept.toLowerCase() ||
             d.code.toLowerCase() === rawDept.toLowerCase() ||
             (d.code === 'AI_DS' && (rawDept.toLowerCase().includes('ai') || rawDept.toLowerCase() === 'aids' || rawDept.toLowerCase().includes('data science')))
      );
      if (!found) {
        let code = rawDept.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10);
        if (rawDept.toLowerCase().includes('ai') || rawDept.toLowerCase().includes('data science') || rawDept.toLowerCase() === 'aids') {
          code = 'AI_DS';
        }
        const createdDept = await prisma.department.upsert({
          where: { code },
          update: { name: rawDept },
          create: {
            name: rawDept,
            code,
            active: true
          },
          include: { staff: true }
        });
        existingDepartments.push(createdDept);
      }
    }
  }

  // Verify that required column headers exist across sample row
  const firstSample = cleanRows[0];
  const hasStudentNameCol = Boolean(getStudentName(firstSample.norm, firstSample.raw));
  const hasRegisterCol = Boolean(getRegisterNumber(firstSample.norm, firstSample.raw));

  if (!hasStudentNameCol) {
    throw new AppError('Missing required column header in Excel: "Student Name"', 400);
  }
  if (!hasRegisterCol) {
    throw new AppError('Missing required column header in Excel: "Register Number"', 400);
  }

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

  cleanRows.forEach(({ raw, norm, originalIndex }) => {
    const rowNum = originalIndex + 2;

    const studentName = getStudentName(norm, raw);
    const registerNumber = getRegisterNumber(norm, raw).toUpperCase();
    const rollNumber = String(norm.rollnumber || norm.rollno || norm.roll || registerNumber).trim().toUpperCase();

    const deptName = String(norm.department || norm.dept || norm.branch || (targetDept ? targetDept.name : '')).trim();
    const yearStr = String(norm.yearofstudy || norm.year || norm.studyyear || (targetYear ? targetYear : '')).trim();
    const section = String(norm.section || norm.sec || (targetSection ? targetSection : 'A')).trim().toUpperCase();

    // Default faculty from department if blank in Excel
    const deptStaff = targetDept?.staff || [];
    const deptHod = deptStaff.find(s => s.role === 'HOD');
    const deptAdvisor = deptStaff.find(s => s.role === 'CLASS_ADVISOR') || deptStaff.find(s => s.role === 'TUTOR');
    const deptTutor = deptStaff.find(s => s.role === 'TUTOR') || deptStaff.find(s => s.role === 'CLASS_ADVISOR');

    let email = String(norm.email || norm.emailaddress || norm.studentemail || '').trim().toLowerCase();
    if (!email && registerNumber) {
      email = `${registerNumber.toLowerCase()}@drngpit.ac.in`;
    }

    const studentPhone = String(norm.studentphone || norm.studentmobile || norm.phonenumber || norm.phone || norm.mobile || '').trim();
    const parentPhone = String(norm.parentphone || norm.parentmobile || norm.parentsphone || norm.guardianphone || norm.fathermobile || '').trim();
    const tutorName = String(norm.tutor || norm.tutorname || (deptTutor ? deptTutor.name : 'N PREMKUMAR')).trim();
    const advisorName = String(norm.classadvisor || norm.advisor || norm.classadvisorname || (deptAdvisor ? deptAdvisor.name : 'N PREMKUMAR')).trim();
    const hodName = String(norm.hod || norm.hodname || norm.headofdepartment || (deptHod ? deptHod.name : 'PAVITHRA')).trim();

    const rawResidence = String(norm.hostellerdayscholar || norm.residencetype || norm.residence || norm.hostelordayscholar || norm.hosteldayscholar || '').trim().toUpperCase();
    const residenceType = rawResidence.includes('HOSTEL') ? 'HOSTEL' : 'DAYSCHOLAR';

    const rawCutoff = norm.cutoff !== undefined ? norm.cutoff : (norm.cutoffmark !== undefined ? norm.cutoffmark : norm.cutoffs);
    const cutoff = rawCutoff !== undefined && rawCutoff !== '' && !isNaN(parseFloat(rawCutoff)) ? parseFloat(rawCutoff) : null;

    const rowErrors = [];

    if (!studentName) rowErrors.push('Student Name is required');
    if (!registerNumber) rowErrors.push('Register Number is required');
    if (!deptName) rowErrors.push('Department is required');
    if (!yearStr) rowErrors.push('Year of Study is required');
    if (!section) rowErrors.push('Section is required');
    if (!email) rowErrors.push('Email is required');

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
        // Disambiguate duplicate in file by setting to student register number institutional email
        const fallbackEmail = `${registerNumber.toLowerCase()}@drngpit.ac.in`;
        if (!fileEmails.has(fallbackEmail) && !existingEmails.has(fallbackEmail)) {
          email = fallbackEmail;
          fileEmails.add(email);
        } else {
          email = `${registerNumber.toLowerCase()}_${rowNum}@drngpit.ac.in`;
          fileEmails.add(email);
        }
      } else if (existingEmails.has(email)) {
        rowErrors.push(`Email already registered in database: "${email}"`);
      } else {
        fileEmails.add(email);
      }
    }

    let matchedDept = null;
    if (targetDept) {
      if (deptName) {
        const rowDept = deptName.toLowerCase();
        const codeMatch = targetDept.code.toLowerCase() === rowDept;
        const nameMatch = targetDept.name.toLowerCase() === rowDept;
        const displayMatch = (targetDept.code === 'AI_DS' ? 'aids' : targetDept.code).toLowerCase() === rowDept;
        const aliasMatch = (targetDept.code === 'AI_DS' && (rowDept.includes('ai') || rowDept.includes('aids') || rowDept.includes('data science')));
        if (!codeMatch && !nameMatch && !displayMatch && !aliasMatch) {
          rowErrors.push(`Department in file ("${deptName}") does not match selected department "${targetDept.name}"`);
        }
      }
      matchedDept = targetDept;
    } else {
      matchedDept = existingDepartments.find(
        d => d.name.toLowerCase() === deptName.toLowerCase() ||
             d.code.toLowerCase() === deptName.toLowerCase() ||
             (d.code === 'AI_DS' && (deptName.toLowerCase().includes('ai') || deptName.toLowerCase() === 'aids' || deptName.toLowerCase().includes('data science')))
      );
      if (!matchedDept) {
        rowErrors.push(`Department "${deptName}" does not exist in database`);
      }
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 1 || year > 4) {
      rowErrors.push(`Invalid Year of Study: "${yearStr}" (Must be 1, 2, 3, or 4)`);
    } else if (targetYear && yearStr && year !== targetYear) {
      rowErrors.push(`Year of Study in file (${year}) does not match selected study Year ${targetYear}`);
    }

    if (targetSection && section) {
      const cleanSec = section.trim().toUpperCase();
      if (cleanSec !== targetSection) {
        rowErrors.push(`Section in file ("${cleanSec}") does not match selected Section "${targetSection}"`);
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNum,
        rowNumber: rowNum,
        studentName,
        name: studentName,
        registerNumber,
        email,
        error: rowErrors.join(' | '),
        errors: rowErrors
      });
    } else {
      validRows.push({
        row: rowNum,
        rowNumber: rowNum,
        studentName,
        name: studentName,
        registerNumber,
        rollNumber,
        deptId: matchedDept ? matchedDept.id : null,
        deptCode: matchedDept ? matchedDept.code : 'AI_DS',
        departmentCode: matchedDept ? matchedDept.code : 'AI_DS',
        departmentName: matchedDept ? matchedDept.name : (targetDept?.name || 'AI & DS'),
        year,
        section,
        email,
        studentPhone,
        parentPhone,
        residenceType,
        cutoff,
        tutorName,
        advisorName,
        hodName
      });
    }
  });

  return {
    totalRows: cleanRows.length,
    validCount: validRows.length,
    errorCount: errors.length,
    validRows,
    errors,
    errorRows: errors
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
      // 1. Resolve or Link Tutor
      let tutorStaff = await tx.staff.findFirst({
        where: {
          OR: [
            { name: { contains: item.tutorName } },
            { name: { equals: item.tutorName } },
            { user: { username: { equals: item.tutorName.toLowerCase().replace(/[^a-z0-9]/g, '') } } }
          ]
        }
      });

      if (tutorStaff) {
        if (!tutorStaff.departmentId || tutorStaff.departmentId !== item.deptId) {
          tutorStaff = await tx.staff.update({
            where: { id: tutorStaff.id },
            data: { departmentId: item.deptId }
          });
        }
      } else {
        const staffUsername = `tutor_${item.tutorName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
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

      // Resolve or Link HOD
      let hodStaff = null;
      if (item.hodName) {
        hodStaff = await tx.staff.findFirst({
          where: {
            OR: [
              { name: { contains: item.hodName } },
              { name: { equals: item.hodName } },
              { role: 'HOD' }
            ]
          }
        });

        if (hodStaff) {
          if (!hodStaff.departmentId || hodStaff.departmentId !== item.deptId) {
            hodStaff = await tx.staff.update({
              where: { id: hodStaff.id },
              data: { departmentId: item.deptId }
            });
          }
        } else {
          const staffUsername = `hod_${item.hodName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
          const hodUser = await tx.user.upsert({
            where: { username: staffUsername },
            update: {},
            create: {
              username: staffUsername,
              passwordHash,
              role: 'HOD',
              active: true
            }
          });

          hodStaff = await tx.staff.create({
            data: {
              userId: hodUser.id,
              name: item.hodName,
              employeeId: `EMP_HOD_${Math.round(Math.random() * 10000)}`,
              departmentId: item.deptId,
              role: 'HOD'
            }
          });
        }
      }

      // Resolve or Link Advisor
      let advisorStaff = await tx.staff.findFirst({
        where: {
          OR: [
            { name: { contains: item.advisorName } },
            { name: { equals: item.advisorName } },
            { user: { username: { equals: item.advisorName.toLowerCase().replace(/[^a-z0-9]/g, '') } } }
          ]
        }
      });

      if (advisorStaff) {
        if (!advisorStaff.departmentId || advisorStaff.departmentId !== item.deptId) {
          advisorStaff = await tx.staff.update({
            where: { id: advisorStaff.id },
            data: { departmentId: item.deptId }
          });
        }
      } else {
        const staffUsername = `advisor_${item.advisorName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
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

      // Ensure AcademicYear and Section exist in database
      const yearNames = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };
      const academicYear = await tx.academicYear.upsert({
        where: {
          departmentId_year: {
            departmentId: item.deptId,
            year: item.year
          }
        },
        update: {},
        create: {
          departmentId: item.deptId,
          year: item.year,
          name: yearNames[item.year] || `${item.year}th Year`,
          active: true
        }
      });

      const sectionRecord = await tx.section.upsert({
        where: {
          academicYearId_name: {
            academicYearId: academicYear.id,
            name: item.section
          }
        },
        update: {
          departmentId: item.deptId
        },
        create: {
          academicYearId: academicYear.id,
          departmentId: item.deptId,
          name: item.section,
          active: true,
          tutorId: tutorStaff?.id,
          classAdvisorId: advisorStaff?.id
        }
      });

      // If section already has a tutor and this student has a 2nd tutor, assign tutor2Id
      if (tutorStaff && sectionRecord.tutorId && sectionRecord.tutorId !== tutorStaff.id && !sectionRecord.tutor2Id) {
        await tx.section.update({
          where: { id: sectionRecord.id },
          data: { tutor2Id: tutorStaff.id }
        });
        sectionRecord.tutor2Id = tutorStaff.id;
      }

      // 3. Create Student Record
      await tx.student.upsert({
        where: { registerNumber: item.registerNumber },
        update: {
          name: item.studentName || item.name,
          rollNumber: item.rollNumber,
          email: item.email,
          studentPhone: item.studentPhone,
          parentPhone: item.parentPhone,
          residenceType: item.residenceType || 'DAYSCHOLAR',
          cutoff: item.cutoff || null,
          departmentId: item.deptId,
          year: item.year,
          section: item.section,
          sectionId: sectionRecord.id,
          tutorId: tutorStaff.id,
          classAdvisorId: advisorStaff.id
        },
        create: {
          userId: user.id,
          registerNumber: item.registerNumber,
          rollNumber: item.rollNumber,
          name: item.studentName || item.name,
          email: item.email,
          studentPhone: item.studentPhone,
          parentPhone: item.parentPhone,
          residenceType: item.residenceType || 'DAYSCHOLAR',
          cutoff: item.cutoff || null,
          departmentId: item.deptId,
          year: item.year,
          section: item.section,
          sectionId: sectionRecord.id,
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
