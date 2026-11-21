const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, upload.single('profilePhoto'), authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
