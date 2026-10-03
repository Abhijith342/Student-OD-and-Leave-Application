const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const XLSX = require('xlsx');

let adminToken, studentToken;

beforeAll(async () => {
  // Login as Admin
  const adminRes = await request(app).post('/api/auth/login').send({
    username: 'admin',
    password: 'Password123!'
  });
  adminToken = adminRes.body.token;

  // Login as Student 1
  const studentRes = await request(app).post('/api/auth/login').send({
    username: '710724243001',
    password: 'Password123!'
  });
  studentToken = studentRes.body.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Excel Student Data Import Security & Validation', () => {

  test('1. Student role CANNOT access import preview API (HTTP 403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/students/import-preview')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('2. Admin can preview Excel import validation', async () => {
    const res = await request(app)
      .post('/api/students/import-preview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalRows');
    expect(res.body.data).toHaveProperty('validCount');
    expect(res.body.data).toHaveProperty('errors');
  });

  test('3. Admin can confirm and execute bulk student import transaction', async () => {
    const sampleRows = [
      {
        row: 100,
        studentName: 'IMPORT TEST STUDENT',
        registerNumber: '710724249999',
        rollNumber: '24AD999',
        deptId: (await prisma.department.findFirst()).id,
        year: 3,
        section: 'A',
        email: 'test9999@drngpit.ac.in',
        studentPhone: '9876543210',
        parentPhone: '9876543210',
        tutorName: 'N PREMKUMAR',
        advisorName: 'N PREMKUMAR',
        hodName: 'PAVITHRA'
      }
    ];

    const res = await request(app)
      .post('/api/students/import-confirm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ validRows: sampleRows });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.importedCount).toBe(1);

    // Verify record in DB
    const createdStudent = await prisma.student.findUnique({
      where: { registerNumber: '710724249999' }
    });
    expect(createdStudent).not.toBeNull();
    expect(createdStudent.name).toBe('IMPORT TEST STUDENT');

    // Clean up test student
    await prisma.student.delete({ where: { registerNumber: '710724249999' } });
    await prisma.user.delete({ where: { username: '710724249999' } });
  });

  test('4. Duplicate register number check prevents duplicate import', async () => {
    const duplicateRow = [
      {
        row: 101,
        studentName: 'DUPLICATE STUDENT',
        registerNumber: '710724243001', // Already exists in seed
        rollNumber: '22AD001',
        deptId: (await prisma.department.findFirst()).id,
        year: 3,
        section: 'A',
        email: 'duplicate@drngpit.ac.in',
        studentPhone: '9876543210',
        parentPhone: '9876543210',
        tutorName: 'N PREMKUMAR',
        advisorName: 'N PREMKUMAR',
        hodName: 'PAVITHRA'
      }
    ];

    // Preview validation check
    const studentImportService = require('../src/services/studentImportService');
    const result = await studentImportService.validateStudentImportData([
      {
        'Student Name': 'DUPLICATE STUDENT',
        'Register Number': '710724243001',
        'Roll Number': '22AD001',
        'Department': 'AI & DS',
        'Year of Study': 3,
        'Section': 'A',
        'Email': 'duplicate@drngpit.ac.in',
        'Student Phone': '9876543210',
        'Parent Phone': '9876543210',
        'Tutor': 'N PREMKUMAR',
        'Class Advisor': 'N PREMKUMAR',
        'HOD': 'PAVITHRA'
      }
    ]);

    expect(result.errorCount).toBe(1);
    expect(result.errors[0].error).toContain('Register Number already exists');
  });
});
