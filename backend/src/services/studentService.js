const prisma = require('../config/prisma');
const AppError = require('../utils/appError');

async function getMyStudents(currentUser, query = {}) {
  const { role, staffId, departmentId } = currentUser;
  const roleFilter = query.role; // 'tutor' | 'advisor' | undefined
  const search = query.search?.trim();

  let where = {};

  if (role === 'TUTOR') {
    // Tutors manage strictly their assigned tutored students (e.g. 32 students)
    where = { tutorId: staffId };
  } else if (role === 'CLASS_ADVISOR') {
    const advisedSections = await prisma.section.findMany({
      where: { classAdvisorId: staffId },
      select: { id: true }
    });
    const sectionIds = advisedSections.map(s => s.id);

    if (roleFilter === 'tutor') {
      // Explicitly requested tutored batch
      where = { tutorId: staffId };
    } else {
      // By default or role=advisor: return advised class students
      where = {
        OR: [
          { classAdvisorId: staffId },
          ...(sectionIds.length ? [{ sectionId: { in: sectionIds } }] : [])
        ]
      };
    }
  } else if (role === 'HOD') {
    where = { departmentId };
  } else if (role === 'ADMIN' || role === 'PRINCIPAL_OFFICE') {
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.year) where.year = parseInt(query.year);
    if (query.section) where.section = String(query.section).toUpperCase();
  }

  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { name: { contains: search } },
          { registerNumber: { contains: search } },
          { rollNumber: { contains: search } },
          { email: { contains: search } }
        ]
      }
    ];
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          active: true,
          createdAt: true
        }
      },
      department: {
        select: { id: true, name: true, code: true }
      },
      tutor: {
        select: { id: true, name: true, employeeId: true }
      },
      classAdvisor: {
        select: { id: true, name: true, employeeId: true }
      },
      academicSection: {
        select: {
          id: true,
          name: true,
          academicYear: { select: { year: true, name: true } }
        }
      },
      applications: {
        select: {
          id: true,
          type: true,
          status: true,
          currentStage: true,
          fromDate: true,
          toDate: true,
          eventName: true,
          venue: true
        }
      }
    },
    orderBy: [
      { year: 'asc' },
      { section: 'asc' },
      { registerNumber: 'asc' }
    ]
  });

  const formatted = students.map(s => {
    const ods = s.applications.filter(a => a.type === 'OD');
    const leaves = s.applications.filter(a => a.type === 'LEAVE');
    const approvedOds = ods.filter(a => a.status === 'APPROVED' || a.currentStage === 'COMPLETED');
    const approvedLeaves = leaves.filter(a => a.status === 'APPROVED' || a.currentStage === 'COMPLETED');

    return {
      id: s.id,
      name: s.name,
      registerNumber: s.registerNumber,
      rollNumber: s.rollNumber,
      year: s.year,
      section: s.section,
      email: s.email,
      studentPhone: s.studentPhone,
      parentPhone: s.parentPhone,
      residenceType: s.residenceType || 'DAYSCHOLAR',
      cutoff: s.cutoff,
      profilePhoto: s.profilePhoto,
      active: s.user?.active ?? true,
      department: s.department,
      tutor: s.tutor,
      classAdvisor: s.classAdvisor,
      academicSection: s.academicSection,
      isTutoredByMe: staffId ? s.tutorId === staffId : false,
      isAdvisedByMe: staffId ? s.classAdvisorId === staffId : false,
      metrics: {
        totalODs: ods.length,
        approvedODs: approvedOds.length,
        totalLeaves: leaves.length,
        approvedLeaves: approvedLeaves.length
      }
    };
  });

  const totalTutored = formatted.filter(s => s.isTutoredByMe).length;
  const totalAdvised = formatted.filter(s => s.isAdvisedByMe).length;

  return {
    students: formatted,
    total: formatted.length,
    activeCount: formatted.filter(s => s.active).length,
    tutoredCount: totalTutored,
    advisedCount: totalAdvised
  };
}


async function getStudentById(studentId, currentUser) {
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { id: studentId },
        { registerNumber: studentId },
        { userId: studentId }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          active: true,
          createdAt: true
        }
      },
      department: true,
      tutor: {
        select: { id: true, name: true, employeeId: true, role: true }
      },
      classAdvisor: {
        select: { id: true, name: true, employeeId: true, role: true }
      },
      academicSection: {
        select: {
          id: true,
          name: true,
          academicYear: { select: { year: true, name: true } }
        }
      },
      applications: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          applicationNumber: true,
          type: true,
          status: true,
          currentStage: true,
          fromDate: true,
          toDate: true,
          reason: true,
          eventName: true,
          venue: true,
          leaveType: true,
          createdAt: true
        }
      }
    }
  });

  if (!student) {
    throw new AppError('Student profile not found.', 404);
  }

  // Fetch department HOD
  let hod = null;
  if (student.departmentId) {
    hod = await prisma.staff.findFirst({
      where: {
        departmentId: student.departmentId,
        role: 'HOD'
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
        role: true
      }
    });
  }

  const ods = student.applications.filter(a => a.type === 'OD');
  const leaves = student.applications.filter(a => a.type === 'LEAVE');
  const approvedOds = ods.filter(a => a.status === 'APPROVED' || a.currentStage === 'COMPLETED');
  const approvedLeaves = leaves.filter(a => a.status === 'APPROVED' || a.currentStage === 'COMPLETED');

  return {
    ...student,
    hod,
    metrics: {
      totalODs: ods.length,
      approvedODs: approvedOds.length,
      totalLeaves: leaves.length,
      approvedLeaves: approvedLeaves.length
    }
  };
}

module.exports = {
  getMyStudents,
  getStudentById
};
