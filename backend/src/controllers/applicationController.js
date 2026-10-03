const applicationService = require('../services/applicationService');
const { generateApplicationPDF } = require('../utils/pdfGenerator');
const AppError = require('../utils/appError');

async function createOD(req, res, next) {
  try {
    if (!req.user.studentId) {
      return next(new AppError('Only registered students can submit OD applications.', 403));
    }
    const file = req.file || null;
    const application = await applicationService.createODApplication(req.user.studentId, req.body, file);

    res.status(201).json({
      status: 'success',
      message: 'OD Application submitted successfully.',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
}

async function createLeave(req, res, next) {
  try {
    if (!req.user.studentId) {
      return next(new AppError('Only registered students can submit Leave applications.', 403));
    }
    const file = req.file || null;
    const application = await applicationService.createLeaveApplication(req.user.studentId, req.body, file);

    res.status(201).json({
      status: 'success',
      message: 'Leave Application submitted successfully.',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyApplications(req, res, next) {
  try {
    if (!req.user.studentId) {
      return next(new AppError('Only students can access my-applications endpoint.', 403));
    }
    const applications = await applicationService.getStudentApplications(req.user.studentId);
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
}

async function getApplicationById(req, res, next) {
  try {
    const { id } = req.params;
    const application = await applicationService.getApplicationById(id, req.user);
    res.status(200).json({
      status: 'success',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
}

async function getTutorApplications(req, res, next) {
  try {
    if (!req.user.staffId) {
      return next(new AppError('Staff profile required.', 403));
    }
    const applications = await applicationService.getTutorApplications(req.user.staffId);
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
}

async function getAdvisorApplications(req, res, next) {
  try {
    if (!req.user.staffId) {
      return next(new AppError('Staff profile required.', 403));
    }
    const applications = await applicationService.getAdvisorApplications(req.user.staffId);
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
}

async function getHodApplications(req, res, next) {
  try {
    if (!req.user.departmentId) {
      return next(new AppError('Department staff profile required.', 403));
    }
    const applications = await applicationService.getHodApplications(req.user.departmentId);
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
}

async function getPrincipalOfficeApplications(req, res, next) {
  try {
    const applications = await applicationService.getPrincipalOfficeApplications();
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
}

async function tutorReview(req, res, next) {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    const updated = await applicationService.tutorReview(id, req.user.staffId, action, remarks);

    res.status(200).json({
      status: 'success',
      message: `Application ${action === 'APPROVE' ? 'approved' : 'rejected'} by Tutor.`,
      data: { application: updated }
    });
  } catch (error) {
    next(error);
  }
}

async function advisorConfirmParent(req, res, next) {
  try {
    const { id } = req.params;
    const { isConfirmed, remarks } = req.body;
    const updated = await applicationService.advisorConfirmParent(id, req.user.staffId, Boolean(isConfirmed), remarks);

    res.status(200).json({
      status: 'success',
      message: 'Parent confirmation recorded & application forwarded to HOD.',
      data: { application: updated }
    });
  } catch (error) {
    next(error);
  }
}

async function hodReview(req, res, next) {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    const updated = await applicationService.hodReview(id, req.user.staffId, action, remarks);

    res.status(200).json({
      status: 'success',
      message: `Application ${action === 'APPROVE' ? 'approved' : 'rejected'} by HOD.`,
      data: { application: updated }
    });
  } catch (error) {
    next(error);
  }
}

async function principalOfficeComplete(req, res, next) {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const updated = await applicationService.principalOfficeComplete(id, req.user.staffId, remarks);

    res.status(200).json({
      status: 'success',
      message: 'OD Application final Principal Office step completed.',
      data: { application: updated }
    });
  } catch (error) {
    next(error);
  }
}

async function downloadPDF(req, res, next) {
  try {
    const { id } = req.params;
    const application = await applicationService.getApplicationById(id, req.user);

    if (req.user.role !== 'STUDENT' || application.studentId !== req.user.studentId) {
      return next(new AppError('Unauthorized: Only the respective student can download their official approval certificate.', 403));
    }

    if (application.status !== 'APPROVED' && application.currentStage !== 'COMPLETED') {
      return next(new AppError('Official PDF Certificate can only be generated for approved applications.', 400));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${application.applicationNumber}_certificate.pdf"`);

    generateApplicationPDF(application, res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOD,
  createLeave,
  getMyApplications,
  getApplicationById,
  getTutorApplications,
  getAdvisorApplications,
  getHodApplications,
  getPrincipalOfficeApplications,
  tutorReview,
  advisorConfirmParent,
  hodReview,
  principalOfficeComplete,
  downloadPDF
};
