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

// Helper to format department with database-driven 4-year study structure, sections & students
function formatDepartmentWithYears(dept) {
  const hod = dept.staff?.find(s => s.role === 'HOD') || null;
  const displayCode = dept.code === 'AI_DS' ? 'AI & DS' : dept.code;

  const yearNames = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };

  // 1. Build database study years structure
  let studyYears = [];
  if (dept.years && dept.years.length > 0) {
    studyYears = dept.years.map(ay => {
      const yearSections = (ay.sections || []).map(sec => {
        let secStudentCount = 0;
        const tutorsMap = new Map();
        if (sec.tutor?.name) {
          tutorsMap.set(sec.tutor.id, { id: sec.tutor.id, name: sec.tutor.name, employeeId: sec.tutor.employeeId, studentCount: 0 });
        }
        if (sec.tutor2?.name && !tutorsMap.has(sec.tutor2.id)) {
          tutorsMap.set(sec.tutor2.id, { id: sec.tutor2.id, name: sec.tutor2.name, employeeId: sec.tutor2.employeeId, studentCount: 0 });
        }

        if (dept.students) {
          const secStudents = dept.students.filter(st => st.year === ay.year && st.section === sec.name);
          secStudentCount = secStudents.length;
          secStudents.forEach(st => {
            if (st.tutor?.name) {
              if (!tutorsMap.has(st.tutor.id)) {
                tutorsMap.set(st.tutor.id, { id: st.tutor.id, name: st.tutor.name, employeeId: st.tutor.employeeId, studentCount: 0 });
              }
              const item = tutorsMap.get(st.tutor.id);
              item.studentCount = (item.studentCount || 0) + 1;
            }
          });
        } else if (sec._count && typeof sec._count.students === 'number') {
          secStudentCount = sec._count.students;
        }

        const tutorsList = Array.from(tutorsMap.values());
        const t1 = sec.tutor ? { id: sec.tutor.id, name: sec.tutor.name, employeeId: sec.tutor.employeeId } : (tutorsList[0] || null);
        const t2 = sec.tutor2 ? { id: sec.tutor2.id, name: sec.tutor2.name, employeeId: sec.tutor2.employeeId } : (tutorsList[1] || null);

        return {
          id: sec.id,
          name: sec.name,
          active: sec.active,
          studentCount: secStudentCount,
          tutor: t1,
          tutor2: t2,
          tutors: tutorsList,
          classAdvisor: sec.classAdvisor ? { id: sec.classAdvisor.id, name: sec.classAdvisor.name, employeeId: sec.classAdvisor.employeeId } : null
        };
      });

      const yearStudentCount = yearSections.reduce((sum, s) => sum + s.studentCount, 0);

      return {
        id: ay.id,
        year: ay.year,
        yearName: ay.name || yearNames[ay.year] || `${ay.year}th Year`,
        active: ay.active,
        studentCount: yearStudentCount,
        sections: yearSections
      };
    });
  } else {
    // Fallback if department has no AcademicYear records yet
    const standardYears = [1, 2, 3, 4];
    studyYears = standardYears.map(yr => {
      const studentsInYear = dept.students ? dept.students.filter(st => st.year === yr) : [];
      const sectionsMap = {};
      studentsInYear.forEach(st => {
        const sec = st.section || 'A';
        sectionsMap[sec] = (sectionsMap[sec] || 0) + 1;
      });

      const sections = Object.keys(sectionsMap).length > 0
        ? Object.entries(sectionsMap).map(([sec, count]) => ({ id: `sec-${yr}-${sec}`, name: sec, active: true, studentCount: count }))
        : ['A', 'B'].map(sec => ({ id: `sec-${yr}-${sec}`, name: sec, active: true, studentCount: 0 }));

      return {
        id: `year-${dept.id}-${yr}`,
        year: yr,
        yearName: yearNames[yr],
        active: true,
        studentCount: studentsInYear.length,
        sections
      };
    });
  }

  // Active / added years (with students)
  const addedYears = studyYears.filter(sy => sy.studentCount > 0);
  const unaddedYears = studyYears.filter(sy => sy.studentCount === 0).map(sy => sy.year);

  return {
    id: dept.id,
    name: dept.name,
    code: dept.code,
    displayCode,
    active: dept.active,
    createdAt: dept.createdAt,
    studentCount: dept._count ? dept._count.students : (dept.students ? dept.students.length : 0),
    staffCount: dept._count ? dept._count.staff : (dept.staff ? dept.staff.length : 0),
    hod: hod ? { id: hod.id, name: hod.name, employeeId: hod.employeeId } : null,
    totalProgramYears: studyYears.length || 4,
    programYearsList: studyYears.map(sy => sy.year),
    studyYears,
    addedYears,
    unaddedYears
  };
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
    pendingPasswordResets,
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
    prisma.passwordResetRequest.count({ where: { status: 'PENDING' } }),
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
        years: {
          orderBy: { year: 'asc' },
          include: {
            sections: {
              orderBy: { name: 'asc' },
              include: {
                tutor: { select: { id: true, name: true, employeeId: true } },
                classAdvisor: { select: { id: true, name: true, employeeId: true } },
                _count: { select: { students: true } }
              }
            }
          }
        },
        students: {
          select: {
            id: true,
            name: true,
            registerNumber: true,
            rollNumber: true,
            year: true,
            section: true,
            email: true,
            tutor: { select: { id: true, name: true, employeeId: true } },
            classAdvisor: { select: { id: true, name: true, employeeId: true } }
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            role: true
          }
        },
        _count: {
          select: { students: true, staff: true }
        }
      }
    })
  ]);

  const departmentStats = departments.map(formatDepartmentWithYears);

  return {
    overview: {
      totalStudents,
      totalStaff,
      totalDepartments,
      pendingOD,
      pendingLeave,
      approvedApplications,
      rejectedApplications,
      completedApplications,
      pendingPasswordResets
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
      user: { select: { id: true, username: true, email: true, active: true, role: true, profilePhoto: true } },
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
    residenceType,
    cutoff,
    profilePhoto,
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

  // Resolve sectionId if matching section exists
  let resolvedSectionId = data.sectionId || null;
  if (!resolvedSectionId && departmentId && year && section) {
    const secRecord = await prisma.section.findFirst({
      where: {
        departmentId,
        academicYear: { year: parseInt(year) },
        name: String(section).toUpperCase()
      }
    });
    if (secRecord) resolvedSectionId = secRecord.id;
  }

  const student = await prisma.student.create({
    data: {
      userId: user.id,
      name,
      registerNumber,
      rollNumber: rollNumber || null,
      email: email || null,
      studentPhone: studentPhone || null,
      parentPhone: parentPhone || null,
      residenceType: residenceType || 'DAYSCHOLAR',
      cutoff: cutoff !== undefined && cutoff !== '' && cutoff !== null ? parseFloat(cutoff) : null,
      profilePhoto: profilePhoto || null,
      departmentId,
      year: parseInt(year),
      section: String(section).toUpperCase(),
      sectionId: resolvedSectionId,
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
    residenceType,
    cutoff,
    profilePhoto,
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

  if (email !== undefined || profilePhoto !== undefined || registerNumber !== undefined) {
    const userUpdate = {};
    if (email !== undefined) userUpdate.email = email || null;
    if (registerNumber !== undefined) userUpdate.username = registerNumber;
    if (profilePhoto !== undefined) userUpdate.profilePhoto = profilePhoto || null;

    await prisma.user.update({
      where: { id: existing.userId },
      data: userUpdate
    });
  }

  let resolvedSectionId = data.sectionId !== undefined ? data.sectionId : undefined;
  if (resolvedSectionId === undefined && (departmentId || year || section)) {
    const targetDeptId = departmentId || existing.departmentId;
    const targetYear = year ? parseInt(year) : existing.year;
    const targetSec = section ? String(section).toUpperCase() : existing.section;
    const secRecord = await prisma.section.findFirst({
      where: {
        departmentId: targetDeptId,
        academicYear: { year: targetYear },
        name: targetSec
      }
    });
    if (secRecord) resolvedSectionId = secRecord.id;
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
      residenceType: residenceType !== undefined ? residenceType : existing.residenceType,
      cutoff: cutoff !== undefined ? (cutoff === '' || cutoff === null ? null : parseFloat(cutoff)) : existing.cutoff,
      profilePhoto: profilePhoto !== undefined ? profilePhoto : existing.profilePhoto,
      departmentId: departmentId || existing.departmentId,
      year: year ? parseInt(year) : existing.year,
      section: section ? String(section).toUpperCase() : existing.section,
      sectionId: resolvedSectionId !== undefined ? resolvedSectionId : existing.sectionId,
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

async function deleteStudent(adminUser, id) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new AppError('Student profile not found.', 404);

  await prisma.$transaction(async (tx) => {
    // 1. Delete associated password reset requests
    await tx.passwordResetRequest.deleteMany({
      where: {
        OR: [
          { userId: student.userId },
          { registerNumber: student.registerNumber }
        ]
      }
    });

    // 2. Delete applications and associated cascade data
    const apps = await tx.application.findMany({
      where: { studentId: id },
      select: { id: true }
    });
    const appIds = apps.map(a => a.id);
    if (appIds.length > 0) {
      await tx.document.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.approvalHistory.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.parentConfirmation.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.notification.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.application.deleteMany({ where: { id: { in: appIds } } });
    }

    // 3. Delete user notifications
    await tx.notification.deleteMany({ where: { userId: student.userId } });

    // 4. Delete Student
    await tx.student.delete({ where: { id } });

    // 5. Delete User account
    await tx.user.delete({ where: { id: student.userId } });
  });

  await logAdminAction(
    adminUser,
    'DELETE_STUDENT',
    'STUDENT',
    id,
    `Permanently deleted student ${student.name} (${student.registerNumber}) and their user account`
  );

  return { message: `Student ${student.name} (${student.registerNumber}) permanently deleted.` };
}

// 3. STAFF MANAGEMENT
async function getAllStaff(query = {}) {
  const { search, departmentId, role, active } = query;

  const andConditions = [];
  if (departmentId) andConditions.push({ departmentId });

  if (role) {
    const cleanRole = String(role).trim().toUpperCase();
    if (cleanRole === 'TUTOR') {
      andConditions.push({
        OR: [
          { role: 'TUTOR' },
          { tutoredStudents: { some: {} } },
          { tutoredSections: { some: {} } },
          { tutoredSections2: { some: {} } }
        ]
      });
    } else if (cleanRole === 'CLASS_ADVISOR') {
      andConditions.push({
        OR: [
          { role: 'CLASS_ADVISOR' },
          { advisedStudents: { some: {} } },
          { advisedSections: { some: {} } }
        ]
      });
    } else {
      andConditions.push({ role: cleanRole });
    }
  }

  if (active !== undefined && active !== '') {
    andConditions.push({ user: { active: active === 'true' || active === true } });
  }

  if (search) {
    const clean = String(search).trim();
    andConditions.push({
      OR: [
        { name: { contains: clean } },
        { employeeId: { contains: clean } },
        { user: { username: { contains: clean } } },
        { user: { email: { contains: clean } } }
      ]
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  return await prisma.staff.findMany({
    where,
    include: {
      user: { select: { id: true, username: true, email: true, active: true, role: true, profilePhoto: true } },
      department: true,
      _count: {
        select: { tutoredStudents: true, advisedStudents: true }
      }
    },
    orderBy: { name: 'asc' }
  });
}

async function createStaff(adminUser, data) {
  const { name, employeeId, username, email, departmentId, role, password, profilePhoto } = data;

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
      profilePhoto: profilePhoto || null,
      active: true
    }
  });

  const staff = await prisma.staff.create({
    data: {
      userId: user.id,
      name,
      employeeId,
      departmentId,
      role,
      profilePhoto: profilePhoto || null
    },
    include: {
      user: { select: { id: true, username: true, email: true, active: true, role: true, profilePhoto: true } },
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

  const { name, employeeId, email, departmentId, role, profilePhoto } = data;

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

  if (email !== undefined || role !== undefined || profilePhoto !== undefined) {
    const userUpdate = {};
    if (email !== undefined) userUpdate.email = email;
    if (role !== undefined) userUpdate.role = role || existing.role;
    if (profilePhoto !== undefined) userUpdate.profilePhoto = profilePhoto;

    await prisma.user.update({
      where: { id: existing.userId },
      data: userUpdate
    });
  }

  const updated = await prisma.staff.update({
    where: { id },
    data: {
      name: name || existing.name,
      employeeId: employeeId || existing.employeeId,
      departmentId: departmentId !== undefined ? departmentId : existing.departmentId,
      role: role || existing.role,
      profilePhoto: profilePhoto !== undefined ? profilePhoto : existing.profilePhoto
    },
    include: {
      user: { select: { id: true, username: true, email: true, active: true, role: true, profilePhoto: true } },
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

async function deleteStaff(adminUser, id) {
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) throw new AppError('Staff member not found.', 404);

  await prisma.$transaction(async (tx) => {
    // 1. Unlink from Sections
    await tx.section.updateMany({ where: { tutorId: id }, data: { tutorId: null } });
    await tx.section.updateMany({ where: { tutor2Id: id }, data: { tutor2Id: null } });
    await tx.section.updateMany({ where: { classAdvisorId: id }, data: { classAdvisorId: null } });

    // 2. Unlink from Students
    await tx.student.updateMany({ where: { tutorId: id }, data: { tutorId: null } });
    await tx.student.updateMany({ where: { classAdvisorId: id }, data: { classAdvisorId: null } });

    // 3. Remove approval histories and parent confirmations
    await tx.approvalHistory.deleteMany({ where: { staffId: id } });
    await tx.parentConfirmation.deleteMany({ where: { advisorId: id } });

    // 4. Delete user notifications
    await tx.notification.deleteMany({ where: { userId: staff.userId } });

    // 5. Delete Staff record
    await tx.staff.delete({ where: { id } });

    // 6. Delete User account
    await tx.user.delete({ where: { id: staff.userId } });
  });

  await logAdminAction(
    adminUser,
    'DELETE_STAFF',
    'STAFF',
    id,
    `Permanently deleted staff member ${staff.name} (${staff.employeeId}) and their user account`
  );

  return { message: `Staff member ${staff.name} (${staff.employeeId}) permanently deleted.` };
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
      years: {
        orderBy: { year: 'asc' },
        include: {
          sections: {
            orderBy: { name: 'asc' },
            include: {
              tutor: { select: { id: true, name: true, employeeId: true } },
              tutor2: { select: { id: true, name: true, employeeId: true } },
              classAdvisor: { select: { id: true, name: true, employeeId: true } },
              _count: { select: { students: true } }
            }
          }
        }
      },
      students: {
        select: {
          id: true,
          name: true,
          registerNumber: true,
          rollNumber: true,
          year: true,
          section: true,
          email: true,
          tutor: { select: { id: true, name: true, employeeId: true } },
          classAdvisor: { select: { id: true, name: true, employeeId: true } }
        }
      },
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

  return departments.map(formatDepartmentWithYears);
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

  if (data.hodStaffId) {
    const staff = await prisma.staff.findUnique({ where: { id: data.hodStaffId } });
    if (staff) {
      await prisma.staff.update({
        where: { id: data.hodStaffId },
        data: { role: 'HOD', departmentId: dept.id }
      });
      await prisma.user.update({
        where: { id: staff.userId },
        data: { role: 'HOD' }
      });
    }
  }

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


// --- HIERARCHY MANAGEMENT (Department -> Year of Study -> Section -> Student List) ---

async function getDepartmentById(id) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: {
      years: {
        orderBy: { year: 'asc' },
        include: {
          sections: {
            orderBy: { name: 'asc' },
            include: {
              tutor: { select: { id: true, name: true, employeeId: true } },
              tutor2: { select: { id: true, name: true, employeeId: true } },
              classAdvisor: { select: { id: true, name: true, employeeId: true } },
              _count: { select: { students: true } }
            }
          }
        }
      },
      staff: {
        include: {
          user: { select: { active: true } }
        }
      },
      students: {
        select: { id: true, year: true, section: true }
      },
      _count: {
        select: { students: true, staff: true }
      }
    }
  });

  if (!dept) throw new AppError('Department not found.', 404);
  return formatDepartmentWithYears(dept);
}

async function deleteDepartment(adminUser, id) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } }
  });

  if (!dept) throw new AppError('Department not found.', 404);
  if (dept._count.students > 0) {
    throw new AppError(`Cannot delete department ${dept.name} because it contains ${dept._count.students} enrolled students. You can deactivate it instead.`, 400);
  }

  await prisma.department.delete({ where: { id } });
  await logAdminAction(adminUser, 'DELETE_DEPARTMENT', 'DEPARTMENT', id, `Deleted department ${dept.name} (${dept.code})`);
  return { message: `Department ${dept.name} has been deleted successfully.` };
}

async function getDepartmentYears(departmentId) {
  const years = await prisma.academicYear.findMany({
    where: { departmentId },
    orderBy: { year: 'asc' },
    include: {
      sections: {
        orderBy: { name: 'asc' },
        include: {
          tutor: { select: { id: true, name: true, employeeId: true } },
          tutor2: { select: { id: true, name: true, employeeId: true } },
          classAdvisor: { select: { id: true, name: true, employeeId: true } },
          students: {
            select: {
              tutor: { select: { id: true, name: true, employeeId: true } }
            }
          },
          _count: { select: { students: true } }
        }
      }
    }
  });

  return years.map(ay => {
    const studentCount = ay.sections.reduce((acc, s) => acc + (s._count?.students || 0), 0);
    return {
      id: ay.id,
      year: ay.year,
      name: ay.name,
      active: ay.active,
      studentCount,
      sections: ay.sections.map(sec => {
        const tutorsMap = new Map();
        if (sec.tutor?.name) tutorsMap.set(sec.tutor.id, { ...sec.tutor, studentCount: 0 });
        if (sec.tutor2?.name && !tutorsMap.has(sec.tutor2.id)) tutorsMap.set(sec.tutor2.id, { ...sec.tutor2, studentCount: 0 });
        if (sec.students) {
          sec.students.forEach(st => {
            if (st.tutor?.name) {
              if (!tutorsMap.has(st.tutor.id)) {
                tutorsMap.set(st.tutor.id, { ...st.tutor, studentCount: 0 });
              }
              const item = tutorsMap.get(st.tutor.id);
              item.studentCount = (item.studentCount || 0) + 1;
            }
          });
        }
        const tutorsList = Array.from(tutorsMap.values());
        return {
          id: sec.id,
          name: sec.name,
          active: sec.active,
          studentCount: sec._count?.students || 0,
          tutor: sec.tutor || (tutorsList[0] || null),
          tutor2: sec.tutor2 || (tutorsList[1] || null),
          tutors: tutorsList,
          classAdvisor: sec.classAdvisor
        };
      })
    };
  });
}

async function createDepartmentYear(adminUser, departmentId, data) {
  const { year, name } = data;
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum) || yearNum < 1) throw new AppError('Valid study year number is required (e.g. 1, 2, 3, 4, 5).', 400);

  const existing = await prisma.academicYear.findUnique({
    where: {
      departmentId_year: { departmentId, year: yearNum }
    }
  });
  if (existing) throw new AppError(`Year ${yearNum} is already configured for this department.`, 400);

  const yearNames = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' };
  const created = await prisma.academicYear.create({
    data: {
      departmentId,
      year: yearNum,
      name: name || yearNames[yearNum] || `${yearNum}th Year`,
      active: true
    }
  });

  // Default section A
  await prisma.section.create({
    data: {
      academicYearId: created.id,
      departmentId,
      name: 'A',
      active: true
    }
  });

  await logAdminAction(adminUser, 'CREATE_STUDY_YEAR', 'ACADEMIC_YEAR', created.id, `Configured Year ${yearNum} for department`);
  return created;
}

async function updateDepartmentYear(adminUser, id, data) {
  const { name, active } = data;
  const updated = await prisma.academicYear.update({
    where: { id },
    data: {
      name: name !== undefined ? name : undefined,
      active: active !== undefined ? Boolean(active) : undefined
    }
  });
  return updated;
}

async function deleteDepartmentYear(adminUser, id) {
  const ay = await prisma.academicYear.findUnique({
    where: { id },
    include: {
      department: true,
      sections: { include: { _count: { select: { students: true } } } }
    }
  });
  if (!ay) throw new AppError('Study Year not found.', 404);

  const totalStudents = ay.sections.reduce((acc, s) => acc + (s._count?.students || 0), 0);
  if (totalStudents > 0) {
    throw new AppError(`Cannot delete ${ay.name} because it contains ${totalStudents} enrolled students. Deactivate it instead.`, 400);
  }

  await prisma.academicYear.delete({ where: { id } });
  await logAdminAction(adminUser, 'DELETE_STUDY_YEAR', 'ACADEMIC_YEAR', id, `Deleted ${ay.name} from ${ay.department.name}`);
  return { message: `${ay.name} deleted successfully.` };
}

async function getYearSections(academicYearId) {
  const sections = await prisma.section.findMany({
    where: { academicYearId },
    orderBy: { name: 'asc' },
    include: {
      tutor: { select: { id: true, name: true, employeeId: true } },
      tutor2: { select: { id: true, name: true, employeeId: true } },
      classAdvisor: { select: { id: true, name: true, employeeId: true } },
      students: {
        select: {
          tutor: { select: { id: true, name: true, employeeId: true } }
        }
      },
      _count: { select: { students: true } }
    }
  });

  return sections.map(sec => {
    const tutorsMap = new Map();
    if (sec.tutor?.name) tutorsMap.set(sec.tutor.id, { ...sec.tutor, studentCount: 0 });
    if (sec.tutor2?.name && !tutorsMap.has(sec.tutor2.id)) tutorsMap.set(sec.tutor2.id, { ...sec.tutor2, studentCount: 0 });
    if (sec.students) {
      sec.students.forEach(st => {
        if (st.tutor?.name) {
          if (!tutorsMap.has(st.tutor.id)) {
            tutorsMap.set(st.tutor.id, { ...st.tutor, studentCount: 0 });
          }
          const item = tutorsMap.get(st.tutor.id);
          item.studentCount = (item.studentCount || 0) + 1;
        }
      });
    }
    const tutorsList = Array.from(tutorsMap.values());
    return {
      id: sec.id,
      name: sec.name,
      active: sec.active,
      studentCount: sec._count?.students || 0,
      tutor: sec.tutor || (tutorsList[0] || null),
      tutor2: sec.tutor2 || (tutorsList[1] || null),
      tutors: tutorsList,
      classAdvisor: sec.classAdvisor
    };
  });
}

async function createYearSection(adminUser, academicYearId, data) {
  const { name, tutorId, tutor2Id, classAdvisorId } = data;
  if (!name || !name.trim()) throw new AppError('Section name is required (e.g. A, B, C).', 400);

  const cleanName = name.trim().toUpperCase();

  const ay = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
  if (!ay) throw new AppError('Academic Year not found.', 404);

  const existing = await prisma.section.findUnique({
    where: {
      academicYearId_name: { academicYearId, name: cleanName }
    }
  });
  if (existing) throw new AppError(`Section ${cleanName} already exists in this study year.`, 400);

  const section = await prisma.section.create({
    data: {
      academicYearId,
      departmentId: ay.departmentId,
      name: cleanName,
      tutorId: tutorId || null,
      tutor2Id: tutor2Id || null,
      classAdvisorId: classAdvisorId || null,
      active: true
    },
    include: {
      tutor: { select: { id: true, name: true } },
      tutor2: { select: { id: true, name: true } },
      classAdvisor: { select: { id: true, name: true } }
    }
  });

  await logAdminAction(adminUser, 'CREATE_SECTION', 'SECTION', section.id, `Added Section ${cleanName} to Year ${ay.year}`);
  return section;
}

async function updateSection(adminUser, id, data) {
  const { name, active, tutorId, tutor2Id, classAdvisorId } = data;

  const existing = await prisma.section.findUnique({
    where: { id },
    include: { academicYear: true, department: true }
  });
  if (!existing) throw new AppError('Section not found.', 404);

  const updateData = {};
  if (name && name.trim().toUpperCase() !== existing.name) {
    updateData.name = name.trim().toUpperCase();
  }
  if (active !== undefined) updateData.active = Boolean(active);
  if (tutorId !== undefined) updateData.tutorId = tutorId || null;
  if (tutor2Id !== undefined) updateData.tutor2Id = tutor2Id || null;
  if (classAdvisorId !== undefined) updateData.classAdvisorId = classAdvisorId || null;

  const updated = await prisma.section.update({
    where: { id },
    data: updateData,
    include: {
      tutor: { select: { id: true, name: true, employeeId: true } },
      classAdvisor: { select: { id: true, name: true, employeeId: true } }
    }
  });

  // If tutor or advisor was assigned to section, synchronize existing students in that section
  if (tutorId !== undefined || classAdvisorId !== undefined) {
    const studentSyncData = {};
    if (tutorId !== undefined) studentSyncData.tutorId = tutorId || null;
    if (classAdvisorId !== undefined) studentSyncData.classAdvisorId = classAdvisorId || null;

    await prisma.student.updateMany({
      where: {
        departmentId: existing.departmentId,
        year: existing.academicYear.year,
        section: existing.name
      },
      data: studentSyncData
    });
  }

  await logAdminAction(adminUser, 'UPDATE_SECTION', 'SECTION', id, `Updated Section ${updated.name}`);
  return updated;
}

async function deleteSection(adminUser, id) {
  const sec = await prisma.section.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } }
  });
  if (!sec) throw new AppError('Section not found.', 404);

  if (sec._count.students > 0) {
    throw new AppError(`Cannot delete Section ${sec.name} because it contains ${sec._count.students} students. Deactivate it instead.`, 400);
  }

  await prisma.section.delete({ where: { id } });
  await logAdminAction(adminUser, 'DELETE_SECTION', 'SECTION', id, `Deleted Section ${sec.name}`);
  return { message: `Section ${sec.name} deleted successfully.` };
}

// 6. EXCEL IMPORT
async function processExcelPreview(file, options = {}) {
  if (!file) throw new AppError('Excel file is required.', 400);

  const rawRows = studentImportService.parseExcelFile(file.path);
  const result = await studentImportService.validateStudentImportData(rawRows, options);
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


async function getPasswordResetRequests(query = {}) {
  const { status, search } = query;
  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (search) {
    const cleanSearch = String(search).trim();
    where.OR = [
      { registerNumber: { contains: cleanSearch } },
      { studentName: { contains: cleanSearch } },
      { studentPhone: { contains: cleanSearch } },
      { email: { contains: cleanSearch } }
    ];
  }

  const requests = await prisma.passwordResetRequest.findMany({
    where,
    orderBy: { requestedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          studentProfile: {
            select: {
              id: true,
              name: true,
              registerNumber: true,
              rollNumber: true,
              year: true,
              section: true,
              department: { select: { name: true, code: true } }
            }
          }
        }
      }
    }
  });

  return requests;
}

async function resolvePasswordResetRequest(adminUser, requestId, action = 'RESET', remarks = '') {
  const request = await prisma.passwordResetRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        include: {
          studentProfile: true
        }
      }
    }
  });

  if (!request) {
    throw new AppError('Password reset request not found.', 404);
  }

  if (request.status !== 'PENDING') {
    throw new AppError(`This request has already been ${request.status.toLowerCase()}.`, 400);
  }

  const cleanAction = String(action).toUpperCase();
  if (cleanAction !== 'RESET' && cleanAction !== 'REJECT') {
    throw new AppError('Invalid action. Must be RESET or REJECT.', 400);
  }

  if (cleanAction === 'RESET') {
    let targetUserId = request.userId;
    if (!targetUserId) {
      const student = await prisma.student.findUnique({
        where: { registerNumber: request.registerNumber }
      });
      if (student) targetUserId = student.userId;
    }

    if (!targetUserId) {
      const user = await prisma.user.findFirst({
        where: { username: request.registerNumber }
      });
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
      throw new AppError(`Cannot locate student user account for register number ${request.registerNumber}.`, 404);
    }

    const passwordHash = await bcrypt.hash('Password123!', 10);
    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash }
    });

    const updated = await prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: 'RESET',
        resolvedAt: new Date(),
        resolvedBy: adminUser.username,
        adminRemarks: remarks || 'Password reset to default initial password (Password123!)'
      }
    });

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        message: 'Your account password has been reset to the default initial password ("Password123!"). You can log in and change it anytime from your profile.'
      }
    });

    await logAdminAction(
      adminUser,
      'RESET_STUDENT_PASSWORD',
      'PASSWORD_RESET_REQUEST',
      requestId,
      `Reset password for student ${request.studentName || request.registerNumber} to default initial password "Password123!"`,
      { status: 'PENDING' },
      { status: 'RESET', resolvedBy: adminUser.username }
    );

    return {
      message: `Password for ${request.studentName || request.registerNumber} successfully reset to initial password "Password123!".`,
      request: updated
    };
  } else {
    const updated = await prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        resolvedAt: new Date(),
        resolvedBy: adminUser.username,
        adminRemarks: remarks || 'Password reset request rejected by administrator'
      }
    });

    if (request.userId) {
      await prisma.notification.create({
        data: {
          userId: request.userId,
          message: `Your password reset request was declined by the administrator. Remarks: ${remarks || 'None provided'}`
        }
      });
    }

    await logAdminAction(
      adminUser,
      'REJECT_PASSWORD_RESET',
      'PASSWORD_RESET_REQUEST',
      requestId,
      `Rejected password reset request for student ${request.studentName || request.registerNumber}. Remarks: ${remarks}`,
      { status: 'PENDING' },
      { status: 'REJECTED', resolvedBy: adminUser.username }
    );

    return {
      message: `Password reset request for ${request.studentName || request.registerNumber} has been rejected.`,
      request: updated
    };
  }
}

module.exports = {
  getPasswordResetRequests,
  resolvePasswordResetRequest,
  getDashboardStats,
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleStudentStatus,
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  resetUserPassword,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  getDepartmentById,
  deleteDepartment,
  getDepartmentYears,
  createDepartmentYear,
  updateDepartmentYear,
  deleteDepartmentYear,
  getYearSections,
  createYearSection,
  updateSection,
  deleteSection,
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
