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
  const cleanUpper = cleanInput.toUpperCase();

  // Search user by username, email, registerNumber, employeeId, or staff name
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: cleanInput } },
        { username: { equals: cleanUpper } },
        { email: { equals: cleanInput } },
        { studentProfile: { registerNumber: { equals: cleanUpper } } },
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

async function updateProfile(userId, data = {}, file = null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true, staffProfile: true }
  });

  if (!user) {
    throw new AppError('User account not found.', 404);
  }

  // Students are NOT allowed to edit their profile; only admin can edit student profiles
  if (user.role === 'STUDENT' || user.studentProfile) {
    throw new AppError('Students are not permitted to edit their profile. Please contact an administrator.', 403);
  }

  let profilePhotoPath = null;
  if (file && file.filename) {
    profilePhotoPath = `/uploads/${file.filename}`;
  } else if (data.profilePhoto) {
    profilePhotoPath = data.profilePhoto;
  }

  // If user is staff, update staff profile details
  if (user.staffProfile && profilePhotoPath) {
    await prisma.staff.update({
      where: { id: user.staffProfile.id },
      data: { profilePhoto: profilePhotoPath }
    });
  }

  // Also update User profilePhoto if available
  if (profilePhotoPath) {
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: profilePhotoPath }
    });
  }

  return await getProfile(userId);
}

async function requestPasswordReset({ registerNumber, reason, studentPhone, email }) {
  if (!registerNumber) {
    throw new AppError('Register number is required to request a password reset.', 400);
  }

  const cleanReg = registerNumber.trim().toUpperCase();

  // Find student by registerNumber or user username
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { registerNumber: { equals: cleanReg } },
        { user: { username: { equals: cleanReg } } }
      ]
    },
    include: {
      user: true,
      department: true
    }
  });

  if (!student) {
    throw new AppError(`No student account found for register number "${cleanReg}". Please verify your register number or contact the administration.`, 404);
  }

  // Check if an existing PENDING request already exists
  const existingPending = await prisma.passwordResetRequest.findFirst({
    where: {
      registerNumber: student.registerNumber,
      status: 'PENDING'
    }
  });

  if (existingPending) {
    return {
      status: 'pending_existing',
      message: `A password reset request for ${student.name} (${student.registerNumber}) is already pending admin review. Your administrator has been notified.`
    };
  }

  // Create password reset request
  const resetReq = await prisma.passwordResetRequest.create({
    data: {
      registerNumber: student.registerNumber,
      studentName: student.name,
      studentPhone: studentPhone || student.studentPhone || null,
      email: email || student.email || student.user?.email || null,
      reason: reason || 'Forgot password request submitted from login portal',
      status: 'PENDING',
      userId: student.userId
    }
  });

  // Notify admin users
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true }
  });

  for (const admin of adminUsers) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        message: `Password reset request: Student ${student.name} (${student.registerNumber}) requested a password reset.`
      }
    });
  }

  return {
    status: 'created',
    message: `Password reset request for ${student.name} (${student.registerNumber}) submitted successfully. Your institutional administrator will reset your password to the initial default password (Password123!).`
  };
}

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  generateToken
};
