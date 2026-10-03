const prisma = require('../config/prisma');
const AppError = require('../utils/appError');
const { generateApplicationNumber } = require('../utils/applicationNumber');
const storageService = require('./storageService');
const notificationService = require('./notificationService');

const includeFullDetails = {
  student: {
    include: {
      user: true,
      department: true,
      tutor: { include: { user: true } },
      classAdvisor: { include: { user: true } },
    }
  },
  approvalHistories: {
    include: {
      staff: true
    },
    orderBy: { timestamp: 'asc' }
  },
  parentConfirmation: {
    include: {
      advisor: true
    }
  },
  documents: true
};

async function attachHodToApplication(application) {
  if (!application || !application.student || !application.student.departmentId) return application;
  const hodStaff = await prisma.staff.findFirst({
    where: {
      departmentId: application.student.departmentId,
      role: 'HOD'
    },
    select: {
      id: true,
      name: true,
      employeeId: true,
      role: true
    }
  });

  return {
    ...application,
    student: {
      ...application.student,
      hod: hodStaff || null
    }
  };
}

async function createODApplication(studentId, data, file) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { tutor: { include: { user: true } } }
  });

  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  if (!data.fromDate || !data.toDate || !data.reason || !data.eventName || !data.venue) {
    throw new AppError('From Date, To Date, Reason, Event Name, and Venue are required for OD', 400);
  }

  const fromDate = new Date(data.fromDate);
  const toDate = new Date(data.toDate);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new AppError('Invalid date format provided', 400);
  }

  if (toDate < fromDate) {
    throw new AppError('To Date cannot be before From Date', 400);
  }

  const applicationNumber = await generateApplicationNumber('OD');

  const application = await prisma.application.create({
    data: {
      applicationNumber,
      type: 'OD',
      studentId,
      fromDate,
      toDate,
      reason: data.reason,
      eventName: data.eventName,
      venue: data.venue,
      description: data.description || '',
      status: 'PENDING',
      currentStage: 'TUTOR_PENDING'
    },
    include: includeFullDetails
  });

  if (file) {
    const savedDoc = await storageService.uploadFile(file);
    await prisma.document.create({
      data: {
        applicationId: application.id,
        fileName: savedDoc.fileName,
        filePath: savedDoc.filePath,
        fileType: file.mimetype,
        storageType: savedDoc.storageType
      }
    });
  }

  if (student.tutor && student.tutor.userId) {
    await notificationService.createNotification(
      student.tutor.userId,
      application.id,
      `New OD Application ${applicationNumber} submitted by ${student.name} requiring your review.`
    );
  }

  return await getApplicationById(application.id);
}

async function createLeaveApplication(studentId, data, file) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { tutor: { include: { user: true } } }
  });

  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  if (!data.fromDate || !data.toDate || !data.reason || !data.leaveType) {
    throw new AppError('Leave Type, From Date, To Date, and Reason are required for Leave', 400);
  }

  const fromDate = new Date(data.fromDate);
  const toDate = new Date(data.toDate);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new AppError('Invalid date format provided', 400);
  }

  if (toDate < fromDate) {
    throw new AppError('To Date cannot be before From Date', 400);
  }

  const applicationNumber = await generateApplicationNumber('LEAVE');

  const application = await prisma.application.create({
    data: {
      applicationNumber,
      type: 'LEAVE',
      studentId,
      leaveType: data.leaveType,
      fromDate,
      toDate,
      reason: data.reason,
      description: data.description || '',
      status: 'PENDING',
      currentStage: 'TUTOR_PENDING'
    },
    include: includeFullDetails
  });

  if (file) {
    const savedDoc = await storageService.uploadFile(file);
    await prisma.document.create({
      data: {
        applicationId: application.id,
        fileName: savedDoc.fileName,
        filePath: savedDoc.filePath,
        fileType: file.mimetype,
        storageType: savedDoc.storageType
      }
    });
  }

  if (student.tutor && student.tutor.userId) {
    await notificationService.createNotification(
      student.tutor.userId,
      application.id,
      `New Leave Application ${applicationNumber} submitted by ${student.name} requiring your review.`
    );
  }

  return await getApplicationById(application.id);
}

async function getApplicationById(applicationId, currentUser = null) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: includeFullDetails
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (currentUser) {
    const { role, studentId, staffId, departmentId } = currentUser;

    if (role === 'STUDENT' && application.studentId !== studentId) {
      throw new AppError('Access denied. You can only view your own applications.', 403);
    }

    if (role === 'TUTOR' || role === 'CLASS_ADVISOR') {
      if (application.student.tutorId !== staffId && application.student.classAdvisorId !== staffId) {
        throw new AppError('Access denied. Application does not belong to your assigned students.', 403);
      }
    }

    if (role === 'HOD') {
      if (application.student.departmentId !== departmentId) {
        throw new AppError('Access denied. Application does not belong to your department.', 403);
      }
    }

    if (role === 'PRINCIPAL_OFFICE') {
      if (application.type !== 'OD') {
        throw new AppError('Principal Office only processes OD applications.', 403);
      }
    }
  }

  return await attachHodToApplication(application);
}

async function getStudentApplications(studentId) {
  const apps = await prisma.application.findMany({
    where: { studentId },
    include: includeFullDetails,
    orderBy: { createdAt: 'desc' }
  });
  return await Promise.all(apps.map(a => attachHodToApplication(a)));
}

async function getTutorApplications(staffId) {
  const apps = await prisma.application.findMany({
    where: {
      student: { tutorId: staffId }
    },
    include: includeFullDetails,
    orderBy: { createdAt: 'desc' }
  });
  return await Promise.all(apps.map(a => attachHodToApplication(a)));
}

async function getAdvisorApplications(staffId) {
  const apps = await prisma.application.findMany({
    where: {
      student: { classAdvisorId: staffId },
      currentStage: { in: ['ADVISOR_PENDING', 'HOD_PENDING', 'PRINCIPAL_PENDING', 'COMPLETED', 'REJECTED'] }
    },
    include: includeFullDetails,
    orderBy: { createdAt: 'desc' }
  });
  return await Promise.all(apps.map(a => attachHodToApplication(a)));
}

async function getHodApplications(departmentId) {
  const apps = await prisma.application.findMany({
    where: {
      student: { departmentId }
    },
    include: includeFullDetails,
    orderBy: { createdAt: 'desc' }
  });
  return await Promise.all(apps.map(a => attachHodToApplication(a)));
}

async function getPrincipalOfficeApplications() {
  const apps = await prisma.application.findMany({
    where: {
      type: 'OD',
      currentStage: { in: ['PRINCIPAL_PENDING', 'COMPLETED'] }
    },
    include: includeFullDetails,
    orderBy: { createdAt: 'desc' }
  });
  return await Promise.all(apps.map(a => attachHodToApplication(a)));
}

// TUTOR REVIEW
async function tutorReview(applicationId, staffId, action, remarks = '') {
  const application = await getApplicationById(applicationId);

  if (application.currentStage !== 'TUTOR_PENDING') {
    throw new AppError(`Cannot review application at current stage: ${application.currentStage}`, 400);
  }

  if (application.student.tutorId !== staffId) {
    throw new AppError('Unauthorized: You are not assigned as the Tutor for this student.', 403);
  }

  const newStage = action === 'APPROVE' ? 'ADVISOR_PENDING' : 'REJECTED';
  const newStatus = action === 'APPROVE' ? 'PENDING' : 'REJECTED';
  const historyAction = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentStage: newStage,
      status: newStatus,
      approvalHistories: {
        create: {
          staffId,
          role: 'TUTOR',
          action: historyAction,
          remarks
        }
      }
    },
    include: includeFullDetails
  });

  if (updated.student && updated.student.user) {
    await notificationService.createNotification(
      updated.student.user.id,
      updated.id,
      `Your ${updated.type} application ${updated.applicationNumber} was ${historyAction.toLowerCase()} by your Tutor.`
    );
  }

  if (action === 'APPROVE' && updated.student.classAdvisor && updated.student.classAdvisor.userId) {
    await notificationService.createNotification(
      updated.student.classAdvisor.userId,
      updated.id,
      `New ${updated.type} application ${updated.applicationNumber} requires your Parent Confirmation.`
    );
  }

  return await attachHodToApplication(updated);
}

// CLASS ADVISOR PARENT CONFIRMATION
async function advisorConfirmParent(applicationId, staffId, isConfirmed, remarks = '') {
  const application = await getApplicationById(applicationId);

  if (application.currentStage !== 'ADVISOR_PENDING') {
    throw new AppError(`Parent confirmation can only be performed when stage is ADVISOR_PENDING. Current stage: ${application.currentStage}`, 400);
  }

  if (application.student.classAdvisorId !== staffId) {
    throw new AppError('Unauthorized: You are not assigned as the Class Advisor for this student.', 403);
  }

  if (typeof isConfirmed !== 'boolean') {
    throw new AppError('Parent confirmation status (Confirmed / Not Confirmed) is required.', 400);
  }

  await prisma.parentConfirmation.upsert({
    where: { applicationId },
    create: {
      applicationId,
      isConfirmed,
      advisorId: staffId,
      remarks,
      confirmedAt: new Date()
    },
    update: {
      isConfirmed,
      advisorId: staffId,
      remarks,
      confirmedAt: new Date()
    }
  });

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentStage: 'HOD_PENDING',
      approvalHistories: {
        create: {
          staffId,
          role: 'CLASS_ADVISOR',
          action: 'CONFIRMED_FORWARDED',
          remarks: `Parent Confirmation: ${isConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}. ${remarks}`
        }
      }
    },
    include: includeFullDetails
  });

  const hodStaff = await prisma.staff.findFirst({
    where: {
      departmentId: updated.student.departmentId,
      role: 'HOD'
    },
    include: { user: true }
  });

  if (hodStaff && hodStaff.user) {
    await notificationService.createNotification(
      hodStaff.user.id,
      updated.id,
      `Application ${updated.applicationNumber} is waiting for HOD approval.`
    );
  }

  return await attachHodToApplication(updated);
}

// HOD REVIEW
async function hodReview(applicationId, staffId, action, remarks = '') {
  const application = await getApplicationById(applicationId);

  if (application.currentStage !== 'HOD_PENDING') {
    throw new AppError(`Cannot perform HOD review at current stage: ${application.currentStage}`, 400);
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || staff.departmentId !== application.student.departmentId || staff.role !== 'HOD') {
    throw new AppError('Unauthorized: Only HOD of the student department can perform this approval.', 403);
  }

  let newStage, newStatus, historyAction;

  if (action === 'APPROVE') {
    historyAction = 'APPROVED';
    if (application.type === 'OD') {
      newStage = 'PRINCIPAL_PENDING';
      newStatus = 'PENDING';
    } else {
      newStage = 'COMPLETED';
      newStatus = 'APPROVED';
    }
  } else {
    historyAction = 'REJECTED';
    newStage = 'REJECTED';
    newStatus = 'REJECTED';
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentStage: newStage,
      status: newStatus,
      approvalHistories: {
        create: {
          staffId,
          role: 'HOD',
          action: historyAction,
          remarks
        }
      }
    },
    include: includeFullDetails
  });

  if (updated.student && updated.student.user) {
    await notificationService.createNotification(
      updated.student.user.id,
      updated.id,
      `Your ${updated.type} application ${updated.applicationNumber} was ${historyAction.toLowerCase()} by HOD.`
    );
  }

  if (action === 'APPROVE' && updated.type === 'OD') {
    const principalStaffList = await prisma.staff.findMany({
      where: { role: 'PRINCIPAL_OFFICE' },
      include: { user: true }
    });

    for (const pStaff of principalStaffList) {
      if (pStaff.user) {
        await notificationService.createNotification(
          pStaff.user.id,
          updated.id,
          `OD Application ${updated.applicationNumber} is ready for final Principal Office processing.`
        );
      }
    }
  }

  return await attachHodToApplication(updated);
}

// PRINCIPAL OFFICE FINAL OD PROCESSING
async function principalOfficeComplete(applicationId, staffId, remarks = 'Final Principal Office Authorization Signature & Seal Applied.') {
  const application = await getApplicationById(applicationId);

  if (application.type !== 'OD') {
    throw new AppError('Principal Office handles OD applications only.', 400);
  }

  if (application.currentStage !== 'PRINCIPAL_PENDING') {
    throw new AppError(`Principal Office processing can only be performed when stage is PRINCIPAL_PENDING. Current stage: ${application.currentStage}`, 400);
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || staff.role !== 'PRINCIPAL_OFFICE') {
    throw new AppError('Unauthorized: Only Principal Office Staff can complete this step.', 403);
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      currentStage: 'COMPLETED',
      status: 'APPROVED',
      approvalHistories: {
        create: {
          staffId,
          role: 'PRINCIPAL_OFFICE',
          action: 'COMPLETED',
          remarks
        }
      }
    },
    include: includeFullDetails
  });

  if (updated.student && updated.student.user) {
    await notificationService.createNotification(
      updated.student.user.id,
      updated.id,
      `OD Application ${updated.applicationNumber} has been COMPLETED with Principal Office signature/seal!`
    );
  }

  return await attachHodToApplication(updated);
}

module.exports = {
  createODApplication,
  createLeaveApplication,
  getApplicationById,
  getStudentApplications,
  getTutorApplications,
  getAdvisorApplications,
  getHodApplications,
  getPrincipalOfficeApplications,
  tutorReview,
  advisorConfirmParent,
  hodReview,
  principalOfficeComplete
};
