const express = require('express');
const applicationController = require('../controllers/applicationController');
const { authenticate } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roles');
const upload = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all application routes
router.use(authenticate);

// Student endpoints
router.post('/od', restrictTo('STUDENT'), upload.single('document'), applicationController.createOD);
router.post('/leave', restrictTo('STUDENT'), upload.single('document'), applicationController.createLeave);
router.get('/my', restrictTo('STUDENT'), applicationController.getMyApplications);

// Role-based application queues
router.get('/tutor', restrictTo('TUTOR', 'CLASS_ADVISOR'), applicationController.getTutorApplications);
router.get('/advisor', restrictTo('TUTOR', 'CLASS_ADVISOR'), applicationController.getAdvisorApplications);
router.get('/hod', restrictTo('HOD'), applicationController.getHodApplications);
router.get('/principal-office', restrictTo('PRINCIPAL_OFFICE'), applicationController.getPrincipalOfficeApplications);

// Single Application details & PDF download
router.get('/:id', applicationController.getApplicationById);
router.get('/:id/pdf', applicationController.downloadPDF);

// Workflow transitions
router.post('/:id/tutor/review', restrictTo('TUTOR', 'CLASS_ADVISOR'), applicationController.tutorReview);
router.post('/:id/parent-confirmation', restrictTo('TUTOR', 'CLASS_ADVISOR'), applicationController.advisorConfirmParent);
router.post('/:id/hod/review', restrictTo('HOD'), applicationController.hodReview);
router.post('/:id/principal-office/complete', restrictTo('PRINCIPAL_OFFICE'), applicationController.principalOfficeComplete);

module.exports = router;
