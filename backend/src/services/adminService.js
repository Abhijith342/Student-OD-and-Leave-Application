const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const AppError = require('../utils/appError');
const studentImportService = require('./studentImportService');

// Helper to record immutable audit log entries
async function logAdminAction(adminUser, action, targetType, targetId = null, details = '', previousValue = null, newValue = null) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: adminUser.id,
        adminUsername: adminUser.username,
        action,
        targetType,
        targetId: targetId ? String(targetId) : null,
        details,
        previousValue: previousValue ? (typeof previousValue === 'object' ? JSON.stringify(previousValue) : String(previousValue)) : null,
        newValue: newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null
      }
    });
  } catch (err) {
    console.error('Failed to create AuditLog entry:', err);
  }
}

// 1. DASHBOARD OVERVIEW
async function getDashboardStats() {
  const [
    totalStudents,
    totalStaff,
    totalDepartments,
    pendingOD,
    pendingLeave,
    approvedApplications,
    rejectedApplications,
    completedApplications,
    recentApplications,
    recentlyAddedStudents,
    recentlyAddedStaff,
    departments
  ] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.department.count(),
    prisma.application.count({ where: { type: 'OD', status: 'PENDING' } }),
    prisma.application.count({ where: { type: 'LEAVE', status: 'PENDING' } }),
    prisma.application.count({ where: { status: 'APPROVED' } }),
    prisma.application.count({ where: { status: 'REJECTED' } }),
    prisma.application.count({ where: { currentStage: 'COMPLETED' } }),
    prisma.application.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: { department: true }
        }
      }
    }),
    prisma.student.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      include: { department: true }
    }),
    prisma.staff.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      include: { department: true }
    }),
    prisma.department.findMany({
      include: {
        _count: {
          select: { students: true, staff: true }
        }
      }
    })
  ]);

  const departmentStats = departments.map(d => ({
    id: d.id,
    name: d.name,
    code: d.code,
    studentCount: d._count.students,
    staffCount: d._count.staff
  }));

  return {
    overview: {
      totalStudents,
      totalStaff,
      totalDepartments,
      pendingOD,
      pendingLeave,
      approvedApplications,
      rejectedApplications,
      completedApplications
    },
    recentApplications,
    recentlyAddedStudents,
    recentlyAddedStaff,
    departmentStats
  };
}

// 2. STUDENT MANAGEMENT
async function getAllStudents(query = {}) {
  const { search, departmentId, year, section, tutorId, classAdvisorId, active } = query;

  const where = {};

  if (departmentId) where.departmentId = departmentId;
  if (year) where.year = parseInt(year);
  if (section) where.section = String(section).toUpperCase();
  if (tutorId) where.tutorId = tutorId;
  if (classAdvisorId) where.classAdvisorId = classAdvisorId;

  if (active !== undefined && active !== '') {
    where.user = { active: active === 'true' || active === true };
  }

  if (search) {
    const clean = String(search).trim();
    where.OR = [
      { name: { contains: clean } },
      { registerNumber: { contains: clean } },
      { rollNumber: { contains: clean } },
      { email: { contains: clean } },
      { studentPhone: { contains: clean } },
      { parentPhone: { contains: clean } }
    ];
  }

  return await prisma.student.findMany({
    where,
    include: {
      user: {
        select: { id: true, username: true, active: true, role: true, createdAt: true }
      },
      department: true,
      tutor: { select: { id: true, name: true, employeeId: true } },
      classAdvisor: { select: { id: true, name: true, employeeId: true } }
    },
    orderBy: { registerNumber: 'asc' }
  });
}

async function getStudentById(id) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, email: true, active: true, role: true } },
      department: true,
      tutor: { select: { id: true, name: true, employeeId: true } },
      classAdvisor: { select: { id: true, name: true, employeeId: true } },
      applications: {
        orderBy: { createdAt: 'desc' },
        include: { approvalHistories: true, parentConfirmation: true }
      }
    }
  });

  if (!student) {
    throw new AppError('Student not found.', 404);
  }

  return student;
}

async function createStudent(adminUser, data) {
  const {
    name,
    registerNumber,
    rollNumber,
    departmentId,
    year,
    section,
    email,
    studentPhone,
    parentPhone,
    tutorId,
    classAdvisorId,
    password
  } = data;

  if (!name || !registerNumber || !departmentId || !year || !section) {
    throw new AppError('Name, Register Number, Department, Year, and Section are required.', 400);
  }

  const existingReg = await prisma.student.findUnique({ where: { registerNumber } });
  if (existingReg) {
    throw new AppError(`Register number ${registerNumber} already exists in the system.`, 400);
  }

  if (rollNumber) {
    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) {
      throw new AppError(`Roll number ${rollNumber} already exists.`, 400);
    }
  }

  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new AppError(`Email ${email} is already associated with another user account.`, 400);
    }
  }

  const passwordHash = await bcrypt.hash(password || 'Password123!', 10);

  const user = await prisma.user.create({
    data: {
      username: registerNumber,
      email: email || null,
      passwordHash,
      role: 'STUDENT',
      active: true
    }
  });

  const student = await prisma.student.create({
    data: {
      userId: user.id,
      name,
      registerNumber,
      rollNumber: rollNumber || null,
      email: email || null,
      studentPhone: studentPhone || null,
      parentPhone: parentPhone || null,
      departmentId,
      year: parseInt(year),
      section: String(section).toUpperCase(),
      tutorId: tutorId || null,
      classAdvisorId: classAdvisorId || null
    },
    include: {
      user: { select: { id: true, username: true, active: true } },
      department: true,
      tutor: true,
      classAdvisor: true
    }
  });

  await logAdminAction(adminUser, 'CREATE_STUDENT', 'STUDENT', student.id, `Created student ${name} (${registerNumber})`, null, student);

  return student;
}

async function updateStudent(adminUser, id, data) {
  const existing = await prisma.student.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!existing) {
    throw new AppError('Student profile not found.', 404);
  }

  const {
    name,
    registerNumber,
    rollNumber,
    departmentId,
    year,
    section,
    email,
    studentPhone,
    parentPhone,
    tutorId,
    classAdvisorId
  } = data;

  if (registerNumber && registerNumber !== existing.registerNumber) {
    const duplicateReg = await prisma.student.findUnique({ where: { registerNumber } });
    if (duplicateReg) {
      throw new AppError(`Register number ${registerNumber} already exists.`, 400);
    }
  }

  if (rollNumber && rollNumber !== existing.rollNumber) {
    const duplicateRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (duplicateRoll) {
      throw new AppError(`Roll number ${rollNumber} already exists.`, 400);
    }
  }

  if (email && email !== existing.email) {
    const duplicateEmail = await prisma.user.findFirst({
      where: { email, NOT: { id: existing.userId } }
    });
    if (duplicateEmail) {
      throw new AppError(`Email ${email} is already registered to another user.`, 400);
    }
  }

  if (email !== undefined) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { email: email || null, username: registerNumber || existing.registerNumber }
    });
  }

  const updated = await prisma.student.update({
    where: { id },
    data: {
      name: name || existing.name,
      registerNumber: registerNumber || existing.registerNumber,
      rollNumber: rollNumber !== undefined ? rollNumber : existing.rollNumber,
      email: email !== undefined ? email : existing.email,
      studentPhone: studentPhone !== undefined ? studentPhone : existing.studentPhone,
      parentPhone: parentPhone !== undefined ? parentPhone : existing.parentPhone,
      departmentId: departmentId || existing.departmentId,
      year: year ? parseInt(year) : existing.year,
      section: section ? String(section).toUpperCase() : existing.section,
      tutorId: tutorId !== undefined ? tutorId : existing.tutorId,
      classAdvisorId: classAdvisorId !== undefined ? classAdvisorId : existing.classAdvisorId
    },
    include: {
      user: { select: { id: true, username: true, email: true, active: true } },
      department: true,
      tutor: true,
      classAdvisor: true
    }
  });

  await logAdminAction(adminUser, 'UPDATE_STUDENT', 'STUDENT', id, `Updated student profile ${updated.name}`, existing, updated);

  return updated;
}

async function toggleStudentStatus(adminUser, id, active) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new AppError('Student not found.', 404);

  const updatedUser = await prisma.user.update({
    where: { id: student.userId },
    data: { active: Boolean(active) }
  });

  await logAdminAction(
    adminUser,
    active ? 'ACTIVATE_STUDENT' : 'DEACTIVATE_STUDENT',
    'STUDENT',
    id,
    `${active ? 'Activated' : 'Deactivated'} student account ${student.name} (${student.registerNumber})`
  );

  return { studentId: id, active: updatedUser.active };
}

// 3. STAFF MANAGEMENT
async function getAllStaff(query = {}) {
  const { search, departmentId, role, active } = query;

  const where = {};
  if (departmentId) where.departmentId = departmentId;
  if (role) where.role = role;

  if (active !== undefined && active !== '') {
    where.user = { active: active === 'true' || active === true };
  }

  if (search) {
    const clean = String(search).trim();
    where.OR = [
      { name: { contains: clean } },
      { employeeId: { contains: clean } },
      { user: { username: { contains: clean } } },
      { user: { email: { contains: clean } } }
    ];
  }

  return await prisma.staff.findMany({
    where,
    include: {
      user: { select: { id: true, username: true, email: true, active: true, role: true } },
      department: true,
      _count: {
        select: { tutoredStudents: true, advisedStudents: true }
      }
    },
    orderBy: { name: 'asc' }
  });
}

async function createStaff(adminUser, data) {
  const { name, employeeId, username, email, departmentId, role, password } = data;

  if (!name || !employeeId || !departmentId || !role) {
    throw new AppError('Name, Employee ID, Department, and Role are required.', 400);
  }

  const cleanUsername = username ? username.trim() : employeeId.trim();

  const existingEmp = await prisma.staff.findUnique({ where: { employeeId } });
  if (existingEmp) {
    throw new AppError(`Employee ID ${employeeId} already exists.`, 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { username: cleanUsername } });
  if (existingUser) {
    throw new AppError(`Username ${cleanUsername} already exists.`, 400);
  }

  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new AppError(`Email ${email} is already registered.`, 400);
    }
  }

  const passwordHash = await bcrypt.hash(password || 'Password123!', 10);

  const user = await prisma.user.create({
    data: {
      username: cleanUsername,
      email: email || null,
      passwordHash,
      role: role,
      active: true
    }
  });

  const staff = await prisma.staff.create({
    data: {
      userId: user.id,
      name,
      employeeId,
      departmentId,
      role
    },
    include: {
      user: { select: { id: true, username: true, email: true, active: true, role: true } },
      department: true
    }
  });

  await logAdminAction(adminUser, 'CREATE_STAFF', 'STAFF', staff.id, `Created staff ${name} (${role})`, null, staff);

  return staff;
}

async function updateStaff(adminUser, id, data) {
  const existing = await prisma.staff.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!existing) {
    throw new AppError('Staff profile not found.', 404);
  }

  const { name, employeeId, email, departmentId, role } = data;

  if (employeeId && employeeId !== existing.employeeId) {
    const duplicateEmp = await prisma.staff.findUnique({ where: { employeeId } });
    if (duplicateEmp) {
      throw new AppError(`Employee ID ${employeeId} already exists.`, 400);
    }
  }

  if (email && email !== existing.user.email) {
    const duplicateEmail = await prisma.user.findFirst({
      where: { email, NOT: { id: existing.userId } }
    });
    if (duplicateEmail) {
      throw new AppError(`Email ${email} is already registered.`, 400);
    }
  }

  if (email !== undefined || role !== undefined) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        email: email !== undefined ? email : existing.user.email,
        role: role || existing.role
      }
    });
  }

  const updated = await prisma.staff.update({
    where: { id },
    data: {
      name: name || existing.name,
      employeeId: employeeId || existing.employeeId,
      departmentId: departmentId || existing.departmentId,
      role: role || existing.role
    },
    include: {
      user: { select: { id: true, username: true, email: true, active: true, role: true } },
      department: true
    }
  });

  await logAdminAction(adminUser, 'UPDATE_STAFF', 'STAFF', id, `Updated staff profile ${updated.name}`, existing, updated);

  return updated;
}

async function toggleStaffStatus(adminUser, id, active) {
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) throw new AppError('Staff member not found.', 404);

  const updatedUser = await prisma.user.update({
    where: { id: staff.userId },
    data: { active: Boolean(active) }
  });

  await logAdminAction(
    adminUser,
    active ? 'ACTIVATE_STAFF' : 'DEACTIVATE_STAFF',
    'STAFF',
    id,
    `${active ? 'Activated' : 'Deactivated'} staff member ${staff.name} (${staff.employeeId})`
  );

  return { staffId: id, active: updatedUser.active };
}

async function resetUserPassword(adminUser, userId, newPassword = 'Password123!') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User account not found.', 404);

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });

  await logAdminAction(adminUser, 'RESET_PASSWORD', 'USER', userId, `Reset password for account username: ${user.username}`);

  return { message: `Password for user ${user.username} has been reset successfully.` };
}

// 4. DEPARTMENT MANAGEMENT
async function getAllDepartments() {
  const departments = await prisma.department.findMany({
    include: {
      staff: {
        include: {
          user: { select: { active: true } }
        }
      },
      _count: {
        select: { students: true, staff: true }
      }
    },
    orderBy: { code: 'asc' }
  });

  return departments.map(d => {
    const hod = d.staff.find(s => s.role === 'HOD');
    return {
      id: d.id,
      name: d.name,
      code: d.code,
      active: d.active,
      createdAt: d.createdAt,
      studentCount: d._count.students,
      staffCount: d._count.staff,
      hod: hod ? { id: hod.id, name: hod.name, employeeId: hod.employeeId } : null
    };
  });
}

async function createDepartment(adminUser, data) {
  const { name, code } = data;
  if (!name || !code) {
    throw new AppError('Department name and unique department code are required.', 400);
  }

  const cleanCode = code.trim().toUpperCase();

  const existingCode = await prisma.department.findUnique({ where: { code: cleanCode } });
  if (existingCode) {
    throw new AppError(`Department code ${cleanCode} already exists.`, 400);
  }

  const dept = await prisma.department.create({
    data: {
      name: name.trim(),
      code: cleanCode,
      active: true
    }
  });

  await logAdminAction(adminUser, 'CREATE_DEPARTMENT', 'DEPARTMENT', dept.id, `Created department ${dept.name} (${dept.code})`);

  return dept;
}

async function updateDepartment(adminUser, id, data) {
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw new AppError('Department not found.', 404);

  const { name, code, active, hodStaffId } = data;

  if (code && code.trim().toUpperCase() !== existing.code) {
    const cleanCode = code.trim().toUpperCase();
    const duplicate = await prisma.department.findUnique({ where: { code: cleanCode } });
    if (duplicate) {
      throw new AppError(`Department code ${cleanCode} already exists.`, 400);
    }
  }

  if (hodStaffId) {
    const staff = await prisma.staff.findUnique({ where: { id: hodStaffId } });
    if (!staff) throw new AppError('Selected HOD staff not found.', 404);

    // Update staff role to HOD and ensure department match
    await prisma.staff.update({
      where: { id: hodStaffId },
      data: { role: 'HOD', departmentId: id }
    });

    await prisma.user.update({
      where: { id: staff.userId },
      data: { role: 'HOD' }
    });
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      name: name ? name.trim() : existing.name,
      code: code ? code.trim().toUpperCase() : existing.code,
      active: active !== undefined ? Boolean(active) : existing.active
    }
  });

  await logAdminAction(adminUser, 'UPDATE_DEPARTMENT', 'DEPARTMENT', id, `Updated department ${updated.name}`, existing, updated);

  return updated;
}

// 5. ACADEMIC STRUCTURE & BULK ASSIGNMENTS
async function getAcademicStructure() {
  const departments = await prisma.department.findMany({
    include: {
      students: {
        include: {
          tutor: { select: { id: true, name: true, employeeId: true } },
          classAdvisor: { select: { id: true, name: true, employeeId: true } }
        }
      },
      staff: true
    }
  });

  return departments.map(d => {
    // Group students by year and section
    const structureMap = {};

    d.students.forEach(st => {
      const key = `Year ${st.year} - Sec ${st.section}`;
      if (!structureMap[key]) {
        structureMap[key] = {
          year: st.year,
          section: st.section,
          studentCount: 0,
          tutors: new Map(),
          classAdvisors: new Map()
        };
      }
      structureMap[key].studentCount += 1;
      if (st.tutor) structureMap[key].tutors.set(st.tutor.id, st.tutor.name);
      if (st.classAdvisor) structureMap[key].classAdvisors.set(st.classAdvisor.id, st.classAdvisor.name);
    });

    const yearSections = Object.values(structureMap).map(ys => ({
      year: ys.year,
      section: ys.section,
      studentCount: ys.studentCount,
      tutors: Array.from(ys.tutors.entries()).map(([id, name]) => ({ id, name })),
      classAdvisors: Array.from(ys.classAdvisors.entries()).map(([id, name]) => ({ id, name }))
    }));

    const hod = d.staff.find(s => s.role === 'HOD');

    return {
      departmentId: d.id,
      departmentName: d.name,
      departmentCode: d.code,
      totalStudents: d.students.length,
      totalStaff: d.staff.length,
      hod: hod ? { id: hod.id, name: hod.name } : null,
      yearSections
    };
  });
}

async function bulkAssignStaff(adminUser, data) {
  const { studentIds, departmentId, year, section, tutorId, classAdvisorId } = data;

  let targetStudentIds = [];

  if (Array.isArray(studentIds) && studentIds.length > 0) {
    targetStudentIds = studentIds;
  } else if (departmentId && year && section) {
    const matchingStudents = await prisma.student.findMany({
      where: {
        departmentId,
        year: parseInt(year),
        section: String(section).toUpperCase()
      },
      select: { id: true }
    });
    targetStudentIds = matchingStudents.map(s => s.id);
  } else {
    throw new AppError('Provide studentIds array OR (departmentId, year, and section).', 400);
  }

  if (targetStudentIds.length === 0) {
    throw new AppError('No matching students found for assignment.', 404);
  }

  const updateData = {};
  if (tutorId !== undefined) updateData.tutorId = tutorId || null;
  if (classAdvisorId !== undefined) updateData.classAdvisorId = classAdvisorId || null;

  await prisma.student.updateMany({
    where: { id: { in: targetStudentIds } },
    data: updateData
  });

  await logAdminAction(
    adminUser,
    'BULK_ASSIGN_STAFF',
    'ASSIGNMENT',
    null,
    `Assigned staff to ${targetStudentIds.length} students (Tutor: ${tutorId || 'N/A'}, Advisor: ${classAdvisorId || 'N/A'})`
  );

  return { message: `Successfully updated staff assignments for ${targetStudentIds.length} students.` };
}

// 6. EXCEL IMPORT
async function processExcelPreview(file) {
  if (!file) throw new AppError('Excel file is required.', 400);

  const rawRows = studentImportService.parseExcelFile(file.path);
  const result = await studentImportService.validateStudentImportData(rawRows);
  return result;
}

async function confirmExcelImport(adminUser, validRows) {
  if (!Array.isArray(validRows) || validRows.length === 0) {
    throw new AppError('No valid student rows provided for import confirmation.', 400);
  }

  const result = await studentImportService.executeStudentImport(validRows);

  await logAdminAction(adminUser, 'IMPORT_STUDENTS', 'IMPORT', null, `Bulk imported ${result.importedCount} student records from Excel.`);

  return result;
}

// 7. APPLICATION MONITORING (READ-ONLY)
async function getAllApplications(query = {}) {
  const { type, departmentId, year, section, status, currentStage, fromDate, toDate, search } = query;

  const where = {};

  if (type) where.type = type;
  if (status) where.status = status;
  if (currentStage) where.currentStage = currentStage;

  const studentFilter = {};
  if (departmentId) studentFilter.departmentId = departmentId;
  if (year) studentFilter.year = parseInt(year);
  if (section) studentFilter.section = String(section).toUpperCase();

  if (search) {
    const clean = String(search).trim();
    studentFilter.OR = [
      { name: { contains: clean } },
      { registerNumber: { contains: clean } },
      { rollNumber: { contains: clean } }
    ];
  }

  if (Object.keys(studentFilter).length > 0) {
    where.student = studentFilter;
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  return await prisma.application.findMany({
    where,
    include: {
      student: {
        include: {
          department: true,
          tutor: { select: { id: true, name: true } },
          classAdvisor: { select: { id: true, name: true } }
        }
      },
      approvalHistories: {
        include: { staff: true },
        orderBy: { timestamp: 'asc' }
      },
      parentConfirmation: {
        include: { advisor: true }
      },
      documents: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// 8. REPORTS DATA
async function getReportsData(query = {}) {
  const { departmentId, year, section, fromDate, toDate, type } = query;

  const whereApp = {};
  if (type) whereApp.type = type;

  if (fromDate || toDate) {
    whereApp.createdAt = {};
    if (fromDate) whereApp.createdAt.gte = new Date(fromDate);
    if (toDate) whereApp.createdAt.lte = new Date(toDate);
  }

  const studentFilter = {};
  if (departmentId) studentFilter.departmentId = departmentId;
  if (year) studentFilter.year = parseInt(year);
  if (section) studentFilter.section = String(section).toUpperCase();

  if (Object.keys(studentFilter).length > 0) {
    whereApp.student = studentFilter;
  }

  const [
    totalStudents,
    totalStaff,
    totalDepartments,
    applications,
    departments
  ] = await Promise.all([
    prisma.student.count({ where: studentFilter }),
    prisma.staff.count(departmentId ? { where: { departmentId } } : {}),
    prisma.department.count(),
    prisma.application.findMany({
      where: whereApp,
      include: {
        student: { include: { department: true } }
      }
    }),
    prisma.department.findMany({
      include: {
        _count: { select: { students: true, staff: true } }
      }
    })
  ]);

  const odApps = applications.filter(a => a.type === 'OD');
  const leaveApps = applications.filter(a => a.type === 'LEAVE');

  const pendingCount = applications.filter(a => a.status === 'PENDING').length;
  const approvedCount = applications.filter(a => a.status === 'APPROVED' || a.currentStage === 'COMPLETED').length;
  const rejectedCount = applications.filter(a => a.status === 'REJECTED').length;

  return {
    summary: {
      totalStudents,
      totalStaff,
      totalDepartments,
      totalApplications: applications.length,
      totalOD: odApps.length,
      totalLeave: leaveApps.length,
      pendingCount,
      approvedCount,
      rejectedCount
    },
    departmentsSummary: departments.map(d => ({
      code: d.code,
      name: d.name,
      students: d._count.students,
      staff: d._count.staff
    })),
    applications
  };
}

// 9. AUDIT LOGS
async function getAuditLogs(query = {}) {
  const { search, targetType, limit = 50 } = query;
  const where = {};

  if (targetType) where.targetType = targetType;
  if (search) {
    const clean = String(search).trim();
    where.OR = [
      { adminUsername: { contains: clean } },
      { action: { contains: clean } },
      { details: { contains: clean } }
    ];
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit)
  });
}

async function deleteApplication(adminUser, applicationId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { student: true }
  });

  if (!application) {
    throw new AppError('Application not found.', 404);
  }

  await prisma.application.delete({
    where: { id: applicationId }
  });

  await logAdminAction(
    adminUser,
    'DELETE_APPLICATION',
    'APPLICATION',
    applicationId,
    `Admin deleted ${application.type} application #${application.applicationNumber} for student ${application.student?.name || ''}`,
    { applicationNumber: application.applicationNumber, type: application.type },
    null
  );

  return { message: `Application #${application.applicationNumber} deleted successfully.` };
}

async function deleteAllApplications(adminUser, filterType = null) {
  const where = {};
  if (filterType && (filterType === 'OD' || filterType === 'LEAVE')) {
    where.type = filterType;
  }

  const countBefore = await prisma.application.count({ where });

  await prisma.application.deleteMany({ where });

  await logAdminAction(
    adminUser,
    'CLEAR_ALL_APPLICATIONS',
    'APPLICATION',
    null,
    `Admin cleared all ${filterType || 'OD & LEAVE'} applications (${countBefore} records deleted)`,
    { deletedCount: countBefore, type: filterType || 'ALL' },
    null
  );

  return { message: `Successfully deleted ${countBefore} application records.`, count: countBefore };
}

async function getApplicationById(applicationId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      student: {
        include: {
          department: true,
          tutor: { select: { id: true, name: true } },
          classAdvisor: { select: { id: true, name: true } }
        }
      },
      approvalHistories: {
        include: { staff: true },
        orderBy: { timestamp: 'asc' }
      },
      parentConfirmation: {
        include: { advisor: true }
      },
      documents: true
    }
  });

  if (!application) {
    throw new AppError('Application record not found.', 404);
  }

  return application;
}

module.exports = {
  getDashboardStats,
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  getAllStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  resetUserPassword,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  getAcademicStructure,
  bulkAssignStaff,
  processExcelPreview,
  confirmExcelImport,
  getAllApplications,
  getApplicationById,
  getReportsData,
  getAuditLogs,
  logAdminAction,
  deleteApplication,
  deleteAllApplications
};
