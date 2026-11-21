const studentService = require('../services/studentService');

async function getMyStudents(req, res, next) {
  try {
    const result = await studentService.getMyStudents(req.user, req.query);
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
}


async function getStudentById(req, res, next) {
  try {
    const student = await studentService.getStudentById(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      data: { student }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyStudents,
  getStudentById
};
