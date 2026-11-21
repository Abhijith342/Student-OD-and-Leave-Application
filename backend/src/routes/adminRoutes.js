const express = require('express');
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const { authenticate, restrictTo } = require('../middleware/auth');
const imageUpload = require('../middleware/upload');
const config = require('../config');

const router = express.Router();

// File upload setup for Excel imports
const upload = multer({
  dest: path.join(config.uploadDir, 'temp'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Protect ALL admin routes with Authentication & ADMIN Role Restriction
router.use(authenticate, restrictTo('ADMIN'));

// Dashboard Stats
router.get('/dashboard', adminController.getDashboardStats);

// Student Management
router.get('/students', adminController.getAllStudents);
router.get('/students/:id', adminController.getStudentById);
router.post('/students', imageUpload.single('profilePhoto'), adminController.createStudent);
router.put('/students/:id', imageUpload.single('profilePhoto'), adminController.updateStudent);
router.post('/students/:id/photo', imageUpload.single('profilePhoto'), adminController.uploadStudentPhoto);
router.delete('/students/:id/photo', adminController.removeStudentPhoto);
router.patch('/students/:id/status', adminController.toggleStudentStatus);
router.delete('/students/:id', adminController.deleteStudent);

// Staff Management
router.get('/staff', adminController.getAllStaff);
router.post('/staff', imageUpload.single('profilePhoto'), adminController.createStaff);
router.put('/staff/:id', imageUpload.single('profilePhoto'), adminController.updateStaff);
router.post('/staff/:id/photo', imageUpload.single('profilePhoto'), adminController.uploadStaffPhoto);
router.delete('/staff/:id/photo', adminController.removeStaffPhoto);
router.patch('/staff/:id/status', adminController.toggleStaffStatus);
router.delete('/staff/:id', adminController.deleteStaff);
router.post('/users/:userId/reset-password', adminController.resetUserPassword);

// Department Hierarchy Management (Department -> Study Year -> Section)
router.get('/departments', adminController.getAllDepartments);
router.get('/departments/:id', adminController.getDepartmentById);
router.post('/departments', adminController.createDepartment);
router.put('/departments/:id', adminController.updateDepartment);
router.delete('/departments/:id', adminController.deleteDepartment);

// Study Years Management
router.get('/departments/:departmentId/years', adminController.getDepartmentYears);
router.post('/departments/:departmentId/years', adminController.createDepartmentYear);
router.put('/years/:id', adminController.updateDepartmentYear);
router.delete('/years/:id', adminController.deleteDepartmentYear);

// Sections Management
router.get('/years/:yearId/sections', adminController.getYearSections);
router.post('/years/:yearId/sections', adminController.createYearSection);
router.get('/departments/:departmentId/years/:yearId/sections', adminController.getYearSections);
router.post('/departments/:departmentId/years/:yearId/sections', adminController.createYearSection);
router.put('/sections/:id', adminController.updateSection);
router.delete('/sections/:id', adminController.deleteSection);

// Academic Structure & Staff Assignments
router.get('/academic-structure', adminController.getAcademicStructure);
router.post('/assign-staff', adminController.bulkAssignStaff);

// Excel Student Import
router.post('/import-students/upload', upload.single('file'), adminController.uploadExcelPreview);
router.post('/import-students/confirm', adminController.confirmExcelImport);

// Application Monitoring & Management
router.get('/applications', adminController.getAllApplications);
router.get('/applications/:id', adminController.getApplicationById);
router.delete('/applications/clear-all', adminController.deleteAllApplications);
router.delete('/applications/:id', adminController.deleteApplication);

// Reports Data
router.get('/reports', adminController.getReportsData);


// Password Reset Requests
router.get('/password-resets', adminController.getPasswordResetRequests);
router.post('/password-resets/:id/resolve', adminController.resolvePasswordResetRequest);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
