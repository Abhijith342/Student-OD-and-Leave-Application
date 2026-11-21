const adminService = require('../services/adminService');
const AppError = require('../utils/appError');

async function getDashboardStats(req, res, next) {
  try {
    const data = await adminService.getDashboardStats();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function getAllStudents(req, res, next) {
  try {
    const students = await adminService.getAllStudents(req.query);
    res.status(200).json({ status: 'success', results: students.length, data: { students } });
  } catch (error) {
    next(error);
  }
}

async function getStudentById(req, res, next) {
  try {
    const student = await adminService.getStudentById(req.params.id);
    res.status(200).json({ status: 'success', data: { student } });
  } catch (error) {
    next(error);
  }
}

async function createStudent(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.profilePhoto = `/uploads/${req.file.filename}`;
    }
    const student = await adminService.createStudent(req.user, payload);
    res.status(201).json({ status: 'success', message: 'Student created successfully.', data: { student } });
  } catch (error) {
    next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.profilePhoto = `/uploads/${req.file.filename}`;
    }
    const student = await adminService.updateStudent(req.user, req.params.id, payload);
    res.status(200).json({ status: 'success', message: 'Student updated successfully.', data: { student } });
  } catch (error) {
    next(error);
  }
}

async function uploadStudentPhoto(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Profile photo file is required.', 400);
    }
    const profilePhoto = `/uploads/${req.file.filename}`;
    const student = await adminService.updateStudent(req.user, req.params.id, { profilePhoto });
    res.status(200).json({
      status: 'success',
      message: 'Student profile photo uploaded successfully.',
      data: { student, profilePhoto }
    });
  } catch (error) {
    next(error);
  }
}

async function removeStudentPhoto(req, res, next) {
  try {
    const student = await adminService.updateStudent(req.user, req.params.id, { profilePhoto: null });
    res.status(200).json({
      status: 'success',
      message: 'Student profile photo removed successfully.',
      data: { student, profilePhoto: null }
    });
  } catch (error) {
    next(error);
  }
}

async function toggleStudentStatus(req, res, next) {
  try {
    const result = await adminService.toggleStudentStatus(req.user, req.params.id, req.body.active);
    res.status(200).json({ status: 'success', message: `Student status updated to ${req.body.active ? 'Active' : 'Inactive'}.`, data: result });
  } catch (error) {
    next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const result = await adminService.deleteStudent(req.user, req.params.id);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
}

async function getAllStaff(req, res, next) {
  try {
    const staff = await adminService.getAllStaff(req.query);
    res.status(200).json({ status: 'success', results: staff.length, data: { staff } });
  } catch (error) {
    next(error);
  }
}

async function createStaff(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.profilePhoto = `/uploads/${req.file.filename}`;
    }
    const staff = await adminService.createStaff(req.user, payload);
    res.status(201).json({ status: 'success', message: 'Staff created successfully.', data: { staff } });
  } catch (error) {
    next(error);
  }
}

async function updateStaff(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.profilePhoto = `/uploads/${req.file.filename}`;
    }
    const staff = await adminService.updateStaff(req.user, req.params.id, payload);
    res.status(200).json({ status: 'success', message: 'Staff updated successfully.', data: { staff } });
  } catch (error) {
    next(error);
  }
}

async function uploadStaffPhoto(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Profile photo file is required.', 400);
    }
    const profilePhoto = `/uploads/${req.file.filename}`;
    const staff = await adminService.updateStaff(req.user, req.params.id, { profilePhoto });
    res.status(200).json({
      status: 'success',
      message: 'Staff profile photo uploaded successfully.',
      data: { staff, profilePhoto }
    });
  } catch (error) {
    next(error);
  }
}

async function removeStaffPhoto(req, res, next) {
  try {
    const staff = await adminService.updateStaff(req.user, req.params.id, { profilePhoto: null });
    res.status(200).json({
      status: 'success',
      message: 'Staff profile photo removed successfully.',
      data: { staff, profilePhoto: null }
    });
  } catch (error) {
    next(error);
  }
}

async function toggleStaffStatus(req, res, next) {
  try {
    const result = await adminService.toggleStaffStatus(req.user, req.params.id, req.body.active);
    res.status(200).json({ status: 'success', message: `Staff status updated to ${req.body.active ? 'Active' : 'Inactive'}.`, data: result });
  } catch (error) {
    next(error);
  }
}

async function deleteStaff(req, res, next) {
  try {
    const result = await adminService.deleteStaff(req.user, req.params.id);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
}

async function resetUserPassword(req, res, next) {
  try {
    const result = await adminService.resetUserPassword(req.user, req.params.userId, req.body.newPassword);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
}

async function getAllDepartments(req, res, next) {
  try {
    const departments = await adminService.getAllDepartments();
    res.status(200).json({ status: 'success', results: departments.length, data: { departments } });
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const department = await adminService.createDepartment(req.user, req.body);
    res.status(201).json({ status: 'success', message: 'Department created successfully.', data: { department } });
  } catch (error) {
    next(error);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const department = await adminService.updateDepartment(req.user, req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Department updated successfully.', data: { department } });
  } catch (error) {
    next(error);
  }
}


async function getDepartmentById(req, res, next) {
  try {
    const department = await adminService.getDepartmentById(req.params.id);
    res.status(200).json({ status: 'success', data: { department } });
  } catch (error) {
    next(error);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    const result = await adminService.deleteDepartment(req.user, req.params.id);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
}

async function getDepartmentYears(req, res, next) {
  try {
    const years = await adminService.getDepartmentYears(req.params.departmentId);
    res.status(200).json({ status: 'success', results: years.length, data: { years } });
  } catch (error) {
    next(error);
  }
}

async function createDepartmentYear(req, res, next) {
  try {
    const year = await adminService.createDepartmentYear(req.user, req.params.departmentId, req.body);
    res.status(201).json({ status: 'success', message: 'Study year configured successfully.', data: { year } });
  } catch (error) {
    next(error);
  }
}

async function updateDepartmentYear(req, res, next) {
  try {
    const year = await adminService.updateDepartmentYear(req.user, req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Study year updated successfully.', data: { year } });
  } catch (error) {
    next(error);
  }
}

async function deleteDepartmentYear(req, res, next) {
  try {
    const result = await adminService.deleteDepartmentYear(req.user, req.params.id);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
}

async function getYearSections(req, res, next) {
  try {
    const sections = await adminService.getYearSections(req.params.yearId);
    res.status(200).json({ status: 'success', results: sections.length, data: { sections } });
  } catch (error) {
    next(error);
  }
}

async function createYearSection(req, res, next) {
  try {
    const section = await adminService.createYearSection(req.user, req.params.yearId, req.body);
    res.status(201).json({ status: 'success', message: 'Section added successfully.', data: { section } });
  } catch (error) {
    next(error);
  }
}

async function updateSection(req, res, next) {
  try {
    const section = await adminService.updateSection(req.user, req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Section updated successfully.', data: { section } });
  } catch (error) {
    next(error);
  }
}

async function deleteSection(req, res, next) {
  try {
    const result = await adminService.deleteSection(req.user, req.params.id);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
}

async function getAcademicStructure(req, res, next) {
  try {
    const structure = await adminService.getAcademicStructure();
    res.status(200).json({ status: 'success', data: { structure } });
  } catch (error) {
    next(error);
  }
}

async function bulkAssignStaff(req, res, next) {
  try {
    const result = await adminService.bulkAssignStaff(req.user, req.body);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
}

async function uploadExcelPreview(req, res, next) {
  try {
    const preview = await adminService.processExcelPreview(req.file, req.body);
    res.status(200).json({ status: 'success', data: { preview } });
  } catch (error) {
    next(error);
  }
}

async function confirmExcelImport(req, res, next) {
  try {
    const result = await adminService.confirmExcelImport(req.user, req.body.validRows);
    res.status(200).json({ status: 'success', message: `Import complete! ${result.importedCount} student records created.`, data: result });
  } catch (error) {
    next(error);
  }
}

async function getAllApplications(req, res, next) {
  try {
    const applications = await adminService.getAllApplications(req.query);
    res.status(200).json({ status: 'success', results: applications.length, data: { applications } });
  } catch (error) {
    next(error);
  }
}

async function getApplicationById(req, res, next) {
  try {
    const application = await adminService.getApplicationById(req.params.id);
    res.status(200).json({ status: 'success', data: { application } });
  } catch (error) {
    next(error);
  }
}

async function getReportsData(req, res, next) {
  try {
    const data = await adminService.getReportsData(req.query);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const auditLogs = await adminService.getAuditLogs(req.query);
    res.status(200).json({ status: 'success', results: auditLogs.length, data: { auditLogs } });
  } catch (error) {
    next(error);
  }
}

async function deleteApplication(req, res, next) {
  try {
    const result = await adminService.deleteApplication(req.user, req.params.id);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    next(error);
  }
}

async function deleteAllApplications(req, res, next) {
  try {
    const result = await adminService.deleteAllApplications(req.user, req.query.type);
    res.status(200).json({ status: 'success', message: result.message, data: result });
  } catch (error) {
    next(error);
  }
}


async function getPasswordResetRequests(req, res, next) {
  try {
    const requests = await adminService.getPasswordResetRequests(req.query);
    res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
  } catch (error) {
    next(error);
  }
}

async function resolvePasswordResetRequest(req, res, next) {
  try {
    const { action, remarks } = req.body;
    const result = await adminService.resolvePasswordResetRequest(req.user, req.params.id, action, remarks);
    res.status(200).json({ status: 'success', message: result.message, data: result });
  } catch (error) {
    next(error);
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
  uploadStudentPhoto,
  removeStudentPhoto,
  toggleStudentStatus,
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  uploadStaffPhoto,
  removeStaffPhoto,
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
  uploadExcelPreview,
  confirmExcelImport,
  getAllApplications,
  getApplicationById,
  getReportsData,
  getAuditLogs,
  deleteApplication,
  deleteAllApplications
};
