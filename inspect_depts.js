const prisma = require('./backend/src/config/prisma');

async function inspect() {
  const depts = await prisma.department.findMany({
    include: {
      years: { include: { sections: true } },
      staff: true,
      students: true
    }
  });
  console.log('Departments:', JSON.stringify(depts, null, 2));

  const staff = await prisma.staff.findMany({
    include: { user: true }
  });
  console.log('Staff:', staff.map(s => ({ name: s.name, role: s.role, deptId: s.departmentId })));

  const users = await prisma.user.findMany({
    select: { username: true, role: true }
  });
  console.log('Users:', users);

  await prisma.$disconnect();
}

inspect();
