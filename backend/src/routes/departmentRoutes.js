const express = require('express');
const departmentController = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roles');

const router = express.Router();

router.use(authenticate);

router.get('/', departmentController.getDepartments);
router.post('/', restrictTo('ADMIN'), departmentController.createDepartment);

module.exports = router;
