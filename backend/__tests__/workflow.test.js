const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

let studentToken, tutorToken, advisorToken, hodToken, principalToken;
let studentUser, tutorUser, advisorUser, hodUser, principalUser;
let createdODId, createdLeaveId;

beforeAll(async () => {
  let dept = await prisma.department.findFirst({ where: { code: 'AI_DS' } });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'Artificial Intelligence and Data Science',
        code: 'AI_DS',
        active: true
      }
    });
  }
  const tutorStaff = await prisma.staff.findFirst({ where: { role: 'TUTOR' }, include: { user: true } });
  const advisorStaff = await prisma.staff.findFirst({ where: { role: 'CLASS_ADVISOR' }, include: { user: true } });
  const hodStaff = await prisma.staff.findFirst({ where: { role: 'HOD' }, include: { user: true } });

  if (tutorStaff && !tutorStaff.departmentId) {
    await prisma.staff.update({ where: { id: tutorStaff.id }, data: { departmentId: dept.id } });
  }
  if (advisorStaff && !advisorStaff.departmentId) {
    await prisma.staff.update({ where: { id: advisorStaff.id }, data: { departmentId: dept.id } });
  }
  if (hodStaff && !hodStaff.departmentId) {
    await prisma.staff.update({ where: { id: hodStaff.id }, data: { departmentId: dept.id } });
  }
  
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Ensure test student 1 exists
  let testUser1 = await prisma.user.findUnique({ where: { username: '710724243001' } });
  if (!testUser1) {
    testUser1 = await prisma.user.create({
      data: {
        username: '710724243001',
        passwordHash,
        role: 'STUDENT',
        active: true,
        studentProfile: {
          create: {
            registerNumber: '710724243001',
            rollNumber: '22AD001',
            name: 'Abinaya N',
            email: '710724243001@drngpit.ac.in',
            departmentId: dept.id,
            year: 3,
            section: 'A',
            tutorId: tutorStaff ? tutorStaff.id : undefined,
            classAdvisorId: advisorStaff ? advisorStaff.id : undefined
          }
        }
      }
    });
  }

  // Ensure test student 2 exists
  let testUser2 = await prisma.user.findUnique({ where: { username: '710724243002' } });
  if (!testUser2) {
    testUser2 = await prisma.user.create({
      data: {
        username: '710724243002',
        passwordHash,
        role: 'STUDENT',
        active: true,
        studentProfile: {
          create: {
            registerNumber: '710724243002',
            rollNumber: '22AD002',
            name: 'Student Two',
            email: '710724243002@drngpit.ac.in',
            departmentId: dept.id,
            year: 3,
            section: 'A',
            tutorId: tutorStaff ? tutorStaff.id : undefined,
            classAdvisorId: advisorStaff ? advisorStaff.id : undefined
          }
        }
      }
    });
  }

  // Login as Student 1
  const studentRes = await request(app).post('/api/auth/login').send({
    username: '710724243001',
    password: 'Password123!'
  });
  studentToken = studentRes.body.token;
  studentUser = studentRes.body.data.user;

  // Login as Tutor
  const tutorUsername = tutorStaff?.user?.username || 'divya';
  const tutorRes = await request(app).post('/api/auth/login').send({
    username: tutorUsername,
    password: 'Password123!'
  });
  tutorToken = tutorRes.body.token;

  // Login as Advisor
  const advisorUsername = advisorStaff?.user?.username || 'premkumar';
  const advisorRes = await request(app).post('/api/auth/login').send({
    username: advisorUsername,
    password: 'Password123!'
  });
  advisorToken = advisorRes.body.token;

  // Login as HOD
  const hodUsername = hodStaff?.user?.username || 'pavithra';
  const hodRes = await request(app).post('/api/auth/login').send({
    username: hodUsername,
    password: 'Password123!'
  });
  hodToken = hodRes.body.token;

  // Login as Principal Office
  const principalRes = await request(app).post('/api/auth/login').send({
    username: 'principal_office',
    password: 'Password123!'
  });
  principalToken = principalRes.body.token;
});

afterAll(async () => {
  await prisma.approvalHistory.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.student.deleteMany({ where: { registerNumber: { in: ['710724243001', '710724243002'] } } });
  await prisma.user.deleteMany({ where: { username: { in: ['710724243001', '710724243002'] } } });
  await prisma.$disconnect();
});

describe('Student OD & Leave Workflow Security Invariants', () => {

  test('1. Student can submit OD Application', async () => {
    const res = await request(app)
      .post('/api/applications/od')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('document', Buffer.from('PDF Brochure Proof Content'), 'brochure.pdf')
      .field('fromDate', '2026-11-01')
      .field('toDate', '2026-11-03')
      .field('reason', 'National Paper Presentation')
      .field('eventName', 'TechFest 2026')
      .field('venue', 'Chennai');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.application.type).toBe('OD');
    expect(res.body.data.application.currentStage).toBe('TUTOR_PENDING');
    createdODId = res.body.data.application.id;
  });

  test('2. Student can submit Leave Application', async () => {
    const res = await request(app)
      .post('/api/applications/leave')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        fromDate: '2026-11-05',
        toDate: '2026-11-06',
        reason: 'Viral Fever with Medical Certificate',
        leaveType: 'MEDICAL'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.application.type).toBe('LEAVE');
    expect(res.body.data.application.currentStage).toBe('TUTOR_PENDING');
    createdLeaveId = res.body.data.application.id;
  });

  test('3. Student CANNOT approve their own application', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/tutor/review`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ action: 'APPROVE', remarks: 'Self approval attempt' });

    expect(res.statusCode).toBe(403);
  });

  test('4. Student CANNOT skip Tutor (e.g. HOD approve attempt before Tutor)', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/hod/review`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ action: 'APPROVE', remarks: 'Trying to skip Tutor' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Cannot perform HOD review at current stage');
  });

  test('5. Tutor can approve OD Application (moves stage to ADVISOR_PENDING)', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/tutor/review`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ action: 'APPROVE', remarks: 'OD Approved by Tutor' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.application.currentStage).toBe('ADVISOR_PENDING');
  });

  test('6. Class Advisor can approve OD Application (moves stage to HOD_PENDING)', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/advisor/review`)
      .set('Authorization', `Bearer ${advisorToken}`)
      .send({ action: 'APPROVE', remarks: 'OD Approved by Class Advisor' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.application.currentStage).toBe('HOD_PENDING');
  });

  test('7. Student CANNOT review or approve at HOD stage', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/hod/review`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ action: 'APPROVE', remarks: 'Illegal attempt' });

    expect(res.statusCode).toBe(403);
  });

  test('8. HOD can approve OD Application (moves stage to PRINCIPAL_PENDING)', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/hod/review`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ action: 'APPROVE', remarks: 'Approved by HOD' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.application.currentStage).toBe('PRINCIPAL_PENDING');
  });

  test('9. Principal Office can complete OD application', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/principal-office/complete`)
      .set('Authorization', `Bearer ${principalToken}`)
      .send({ remarks: 'Principal Seal Applied' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.application.currentStage).toBe('COMPLETED');
    expect(res.body.data.application.status).toBe('APPROVED');
  });

  test('10. Principal Office CANNOT process Leave application', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdLeaveId}/principal-office/complete`)
      .set('Authorization', `Bearer ${principalToken}`)
      .send({ remarks: 'Principal should not touch Leave' });

    expect(res.statusCode).toBe(400);
  });

  test('11. Leave Application completes via Tutor -> Advisor -> HOD', async () => {
    // 1. Tutor Approve Leave -> moves stage to ADVISOR_PENDING
    const tutorRes = await request(app)
      .post(`/api/applications/${createdLeaveId}/tutor/review`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ action: 'APPROVE', remarks: 'Leave Approved by Tutor' });
    expect(tutorRes.statusCode).toBe(200);
    expect(tutorRes.body.data.application.currentStage).toBe('ADVISOR_PENDING');

    // 2. Advisor Parent Confirmation (moves stage to HOD_PENDING)
    const confRes = await request(app)
      .post(`/api/applications/${createdLeaveId}/parent-confirmation`)
      .set('Authorization', `Bearer ${advisorToken}`)
      .send({ isConfirmed: true });
    expect(confRes.statusCode).toBe(200);
    expect(confRes.body.data.application.currentStage).toBe('HOD_PENDING');

    // 3. HOD Approve Leave -> completes workflow directly (Leaves don't go to Principal)
    const hodRes = await request(app)
      .post(`/api/applications/${createdLeaveId}/hod/review`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ action: 'APPROVE', remarks: 'Leave Approved by HOD' });
    expect(hodRes.statusCode).toBe(200);
    expect(hodRes.body.data.application.currentStage).toBe('COMPLETED');
    expect(hodRes.body.data.application.status).toBe('APPROVED');
  });

  test('12. Unauthorized users CANNOT access another student application', async () => {
    // Login as Student 2
    const student2Res = await request(app).post('/api/auth/login').send({
      username: '710724243002',
      password: 'Password123!'
    });
    const student2Token = student2Res.body.token;

    // Student 2 tries to access Student 1's application
    const res = await request(app)
      .get(`/api/applications/${createdODId}`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(res.statusCode).toBe(403);
  });

  test('13. Change Password validation and successful update', async () => {
    // 1. Wrong current password -> 400
    const failRes1 = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ currentPassword: 'WrongPassword!', newPassword: 'NewSecurePassword123!' });
    expect(failRes1.statusCode).toBe(400);

    // 2. Short new password -> 400
    const failRes2 = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ currentPassword: 'Password123!', newPassword: 'short' });
    expect(failRes2.statusCode).toBe(400);

    // 3. Successful password change -> 200
    const successRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' });
    expect(successRes.statusCode).toBe(200);

    // 4. Change back to Password123! so suite teardown and subsequent logins remain valid
    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ currentPassword: 'NewPassword123!', newPassword: 'Password123!' });
  });

  test('14. Admin role access, dashboard, audit logs, and non-approval invariant', async () => {
    // Login as Admin
    const adminLogin = await request(app).post('/api/auth/login').send({
      username: 'admin',
      password: 'Password123!'
    });
    const adminToken = adminLogin.body.token;

    // 1. Admin accesses admin dashboard -> 200
    const dashRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(dashRes.statusCode).toBe(200);
    expect(dashRes.body.data.overview).toBeDefined();

    // 2. Non-admin (Student) tries to access admin endpoint -> 403
    const forbiddenRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(forbiddenRes.statusCode).toBe(403);

    // 3. Admin can view applications monitor -> 200
    const appsRes = await request(app)
      .get('/api/admin/applications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(appsRes.statusCode).toBe(200);

    // 4. Admin CANNOT approve an application (Tutor review endpoint -> 403 / failure)
    const approveAttempt = await request(app)
      .post(`/api/applications/${createdODId}/tutor/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE', remarks: 'Admin attempt to approve' });
    expect(approveAttempt.statusCode).toBe(403);

    // 5. Admin can fetch audit logs -> 200
    const auditRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(auditRes.statusCode).toBe(200);
  });

  afterAll(async () => {
    if (createdODId) await prisma.application.deleteMany({ where: { id: createdODId } });
    if (createdLeaveId) await prisma.application.deleteMany({ where: { id: createdLeaveId } });
    await prisma.application.deleteMany({
      where: { student: { registerNumber: { in: ['710724243001', '710724243002'] } } }
    });
    await prisma.student.deleteMany({
      where: { registerNumber: { in: ['710724243001', '710724243002'] } }
    });
    await prisma.user.deleteMany({
      where: { username: { in: ['710724243001', '710724243002'] } }
    });
    await prisma.staff.updateMany({ data: { departmentId: null } });
    await prisma.section.deleteMany({});
    await prisma.academicYear.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.$disconnect();
  });
});
