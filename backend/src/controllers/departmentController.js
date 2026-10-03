const departmentService = require('../services/departmentService');

async function getDepartments(req, res, next) {
  try {
    const departments = await departmentService.getAllDepartments();
    res.status(200).json({
      status: 'success',
      data: { departments }
    });
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, code } = req.body;
    const department = await departmentService.createDepartment(name, code);
    res.status(201).json({
      status: 'success',
      data: { department }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDepartments,
  createDepartment
};
