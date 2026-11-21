const express = require('express');
const studentImportController = require('../controllers/studentImportController');
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roles');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

// Staff access to my students
router.get(
  '/my-students',
  restrictTo('TUTOR', 'CLASS_ADVISOR', 'HOD', 'ADMIN', 'PRINCIPAL_OFFICE'),
  studentController.getMyStudents
);

// Secure Import Endpoints (Restricted to ADMIN, HOD, and PRINCIPAL_OFFICE)
router.post(
  '/import-preview',
  restrictTo('ADMIN', 'HOD', 'PRINCIPAL_OFFICE'),
  upload.single('file'),
  studentImportController.importPreview
);

router.post(
  '/import-confirm',
  restrictTo('ADMIN', 'HOD', 'PRINCIPAL_OFFICE'),
  studentImportController.importConfirm
);

router.get(
  '/import-template',
  restrictTo('ADMIN', 'HOD', 'PRINCIPAL_OFFICE', 'STUDENT', 'TUTOR', 'CLASS_ADVISOR'),
  studentImportController.downloadTemplate
);

// Staff & Student access to specific student profile
router.get(
  '/profile/:id',
  restrictTo('STUDENT', 'TUTOR', 'CLASS_ADVISOR', 'HOD', 'ADMIN', 'PRINCIPAL_OFFICE'),
  studentController.getStudentById
);

router.get(
  '/:id',
  restrictTo('STUDENT', 'TUTOR', 'CLASS_ADVISOR', 'HOD', 'ADMIN', 'PRINCIPAL_OFFICE'),
  studentController.getStudentById
);

module.exports = router;
