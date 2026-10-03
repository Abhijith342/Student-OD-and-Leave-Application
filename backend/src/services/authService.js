const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const config = require('../config');
const AppError = require('../utils/appError');

function generateToken(userId) {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

async function attachDepartmentHod(studentProfile) {
  if (!studentProfile || !studentProfile.departmentId) return studentProfile;
  const hodStaff = await prisma.staff.findFirst({
    where: {
      departmentId: studentProfile.departmentId,
      role: 'HOD'
    },
    select: {
      id: true,
      name: true,
      employeeId: true,
      role: true
    }
  });

  return {
    ...studentProfile,
    hod: hodStaff || null
  };
}

async function login(loginInput, password) {
  if (!loginInput || !password) {
    throw new AppError('Please provide username and password', 400);
  }

  const cleanInput = loginInput.trim();

  // Search user by username, email, employeeId, or staff name
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: cleanInput } },
        { email: { equals: cleanInput } },
        { staffProfile: { employeeId: { equals: cleanInput } } },
        { staffProfile: { name: { contains: cleanInput } } }
      ]
    },
    include: {
      studentProfile: {
        include: {
          department: true,
          tutor: {
            select: { id: true, name: true, employeeId: true, role: true }
          },
          classAdvisor: {
            select: { id: true, name: true, employeeId: true, role: true }
          },
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
    throw new AppError('Invalid username or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid username or password', 401);
  }

  const token = generateToken(user.id);

  if (user.studentProfile) {
    user.studentProfile = await attachDepartmentHod(user.studentProfile);
  }

  const { passwordHash, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword
  };
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: {
        include: {
          department: true,
          tutor: {
            select: { id: true, name: true, employeeId: true, role: true }
          },
          classAdvisor: {
            select: { id: true, name: true, employeeId: true, role: true }
          },
        }
      },
      staffProfile: {
        include: {
          department: true,
        }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.studentProfile) {
    user.studentProfile = await attachDepartmentHod(user.studentProfile);
  }

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required.', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long.', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError('User account not found.', 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect.', 400);
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash }
  });

  return { message: 'Password updated successfully.' };
}

module.exports = {
  login,
  getProfile,
  changePassword,
  generateToken
};
