const express = require('express');
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const { authenticate, restrictTo } = require('../middleware/auth');
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
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.patch('/students/:id/status', adminController.toggleStudentStatus);

// Staff Management
router.get('/staff', adminController.getAllStaff);
router.post('/staff', adminController.createStaff);
router.put('/staff/:id', adminController.updateStaff);
router.patch('/staff/:id/status', adminController.toggleStaffStatus);
router.post('/users/:userId/reset-password', adminController.resetUserPassword);

// Department Management
router.get('/departments', adminController.getAllDepartments);
router.post('/departments', adminController.createDepartment);
router.put('/departments/:id', adminController.updateDepartment);

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

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
