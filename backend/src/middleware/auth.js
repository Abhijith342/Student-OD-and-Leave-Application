const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const config = require('../config');
const AppError = require('../utils/appError');

async function authenticate(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        studentProfile: {
          include: {
            department: true,
            tutor: true,
            classAdvisor: true,
          }
        },
        staffProfile: {
          include: {
            department: true,
          }
        }
      }
    });

    if (!user || !user.active) {
      return next(new AppError('The user belonging to this token no longer exists or is inactive.', 401));
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      studentProfile: user.studentProfile,
      staffProfile: user.staffProfile,
      studentId: user.studentProfile?.id || null,
      staffId: user.staffProfile?.id || null,
      departmentId: user.studentProfile?.departmentId || user.staffProfile?.departmentId || null
    };

    next();
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
}

function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Permission denied: You do not have authorization to perform this operation.', 403));
    }
    next();
  };
}

module.exports = {
  authenticate,
  restrictTo
};
