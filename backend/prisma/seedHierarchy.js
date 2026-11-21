const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedHierarchy() {
  console.log('🔄 Seeding academic departments, study years, and sections...');

  const departmentsData = [
    { code: 'AI_DS', name: 'Artificial Intelligence and Data Science' },
    { code: 'CSE', name: 'Computer Science and Engineering' },
    { code: 'ECE', name: 'Electronics and Communication Engineering' },
    { code: 'EEE', name: 'Electrical and Electronics Engineering' },
    { code: 'IT', name: 'Information Technology' }
  ];

  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, active: true },
      create: { code: d.code, name: d.name, active: true }
    });

    console.log(`✅ Department verified: ${dept.name} (${dept.code})`);

    // Create 4 study years: 1st, 2nd, 3rd, 4th Year
    const yearNames = {
      1: '1st Year',
      2: '2nd Year',
      3: '3rd Year',
      4: '4th Year'
    };

    for (let y = 1; y <= 4; y++) {
      const academicYear = await prisma.academicYear.upsert({
        where: {
          departmentId_year: {
            departmentId: dept.id,
            year: y
          }
        },
        update: {
          name: yearNames[y],
          active: true
        },
        create: {
          departmentId: dept.id,
          year: y,
          name: yearNames[y],
          active: true
        }
      });

      // Configure sections: A, B, C
      const sectionNames = ['A', 'B', 'C'];
      for (const secName of sectionNames) {
        await prisma.section.upsert({
          where: {
            academicYearId_name: {
              academicYearId: academicYear.id,
              name: secName
            }
          },
          update: {
            departmentId: dept.id,
            active: true
          },
          create: {
            academicYearId: academicYear.id,
            departmentId: dept.id,
            name: secName,
            active: true
          }
        });
      }
    }
  }

  // Assign HOD & Staff to AI & DS
  const aidsDept = await prisma.department.findUnique({ where: { code: 'AI_DS' } });
  if (aidsDept) {
    const premkumarStaff = await prisma.staff.findFirst({ where: { employeeId: 'EMP_PREMKUMAR' } });

    // Link Year 3 Section A
    const y3 = await prisma.academicYear.findUnique({
      where: {
        departmentId_year: {
          departmentId: aidsDept.id,
          year: 3
        }
      }
    });

    if (y3) {
      const secA = await prisma.section.findUnique({
        where: {
          academicYearId_name: {
            academicYearId: y3.id,
            name: 'A'
          }
        }
      });

      if (secA) {
        if (premkumarStaff) {
          await prisma.section.update({
            where: { id: secA.id },
            data: {
              classAdvisorId: premkumarStaff.id,
              tutorId: premkumarStaff.id
            }
          });
        }

        // Link existing students in AI_DS Year 3 Section A to this sectionId
        const updated = await prisma.student.updateMany({
          where: {
            departmentId: aidsDept.id,
            year: 3,
            section: 'A'
          },
          data: {
            sectionId: secA.id
          }
        });

        console.log(`🔗 Linked ${updated.count} students to AI & DS 3rd Year Section A`);
      }
    }
  }

  console.log('🎉 Academic hierarchy successfully seeded!');
}

seedHierarchy()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
