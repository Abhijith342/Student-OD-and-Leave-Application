const express = require('express');
const studentImportController = require('../controllers/studentImportController');
const { authenticate } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roles');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

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

module.exports = router;
