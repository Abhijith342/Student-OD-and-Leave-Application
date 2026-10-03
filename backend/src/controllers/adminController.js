const adminService = require('../services/adminService');

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
    const student = await adminService.createStudent(req.user, req.body);
    res.status(201).json({ status: 'success', message: 'Student created successfully.', data: { student } });
  } catch (error) {
    next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const student = await adminService.updateStudent(req.user, req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Student updated successfully.', data: { student } });
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
    const staff = await adminService.createStaff(req.user, req.body);
    res.status(201).json({ status: 'success', message: 'Staff created successfully.', data: { staff } });
  } catch (error) {
    next(error);
  }
}

async function updateStaff(req, res, next) {
  try {
    const staff = await adminService.updateStaff(req.user, req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Staff updated successfully.', data: { staff } });
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
    const preview = await adminService.processExcelPreview(req.file);
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
  uploadExcelPreview,
  confirmExcelImport,
  getAllApplications,
  getApplicationById,
  getReportsData,
  getAuditLogs,
  deleteApplication,
  deleteAllApplications
};
