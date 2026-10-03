const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

let studentToken, tutorToken, advisorToken, hodToken, principalToken;
let studentUser, tutorUser, advisorUser, hodUser, principalUser;
let createdODId, createdLeaveId;

beforeAll(async () => {
  // Login as Student 1
  const studentRes = await request(app).post('/api/auth/login').send({
    username: '710724243001',
    password: 'Password123!'
  });
  studentToken = studentRes.body.token;
  studentUser = studentRes.body.data.user;

  // Login as Tutor (N PREMKUMAR)
  const tutorRes = await request(app).post('/api/auth/login').send({
    username: 'premkumar',
    password: 'Password123!'
  });
  tutorToken = tutorRes.body.token;

  // Login as Advisor (N PREMKUMAR)
  const advisorRes = await request(app).post('/api/auth/login').send({
    username: 'premkumar',
    password: 'Password123!'
  });
  advisorToken = advisorRes.body.token;

  // Login as HOD (PAVITHRA)
  const hodRes = await request(app).post('/api/auth/login').send({
    username: 'pavithra',
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
  await prisma.$disconnect();
});

describe('Student OD & Leave Workflow Security Invariants', () => {

  test('1. Student can submit OD Application', async () => {
    const res = await request(app)
      .post('/api/applications/od')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        fromDate: '2026-11-01',
        toDate: '2026-11-03',
        reason: 'National Paper Presentation',
        eventName: 'AI Expo 2026',
        venue: 'IIT Madras',
        description: 'Testing OD Submission flow'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.application).toHaveProperty('applicationNumber');
    expect(res.body.data.application.type).toBe('OD');
    expect(res.body.data.application.currentStage).toBe('TUTOR_PENDING');
    createdODId = res.body.data.application.id;
  });

  test('2. Student can submit Leave Application', async () => {
    const res = await request(app)
      .post('/api/applications/leave')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        leaveType: 'Medical',
        fromDate: '2026-11-05',
        toDate: '2026-11-06',
        reason: 'Severe Toothache',
        description: 'Dental appointment'
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
      .send({ action: 'APPROVE', remarks: 'Early HOD approval' });

    expect(res.statusCode).toBe(400); // Stage mismatch
  });

  test('5. Tutor can approve OD Application (moves stage to ADVISOR_PENDING)', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/tutor/review`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ action: 'APPROVE', remarks: 'OD Approved by Tutor' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.application.currentStage).toBe('ADVISOR_PENDING');
  });

  test('6. Tutor CANNOT directly complete HOD stage', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/hod/review`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ action: 'APPROVE', remarks: 'Tutor pretending to be HOD' });

    expect(res.statusCode).toBe(403);
  });

  test('7. Class Advisor can record parent confirmation & forward to HOD', async () => {
    const res = await request(app)
      .post(`/api/applications/${createdODId}/parent-confirmation`)
      .set('Authorization', `Bearer ${advisorToken}`)
      .send({ isConfirmed: true, remarks: 'Spoke with student mother.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.application.currentStage).toBe('HOD_PENDING');
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
      .send({ remarks: 'Leave Seal Attempt' });

    expect(res.statusCode).toBe(400); // Bad Request: Principal Office handles OD applications only
  });

  test('11. Leave Application completes at HOD Stage without Principal Office', async () => {
    // 1. Tutor Approve Leave
    await request(app)
      .post(`/api/applications/${createdLeaveId}/tutor/review`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ action: 'APPROVE' });

    // 2. Advisor Parent Confirmation
    await request(app)
      .post(`/api/applications/${createdLeaveId}/parent-confirmation`)
      .set('Authorization', `Bearer ${advisorToken}`)
      .send({ isConfirmed: true });

    // 3. HOD Approve Leave
    const res = await request(app)
      .post(`/api/applications/${createdLeaveId}/hod/review`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ action: 'APPROVE', remarks: 'Leave approved by HOD' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.application.currentStage).toBe('COMPLETED');
    expect(res.body.data.application.status).toBe('APPROVED');
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
      .send({ currentPassword: 'WrongPassword!', newPassword: 'NewPassword123!' });
    expect(failRes1.statusCode).toBe(400);

    // 2. Short new password -> 400
    const failRes2 = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ currentPassword: 'Password123!', newPassword: '123' });
    expect(failRes2.statusCode).toBe(400);

    // 3. Valid change password -> 200
    const successRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' });
    expect(successRes.statusCode).toBe(200);

    // Revert password back to original for database consistency
    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ currentPassword: 'NewPassword123!', newPassword: 'Password123!' });
  });

  test('14. Admin role access, dashboard, audit logs, and non-approval invariant', async () => {
    // Login as Admin
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      username: 'admin',
      password: 'Password123!'
    });
    expect(adminLoginRes.statusCode).toBe(200);
    const adminToken = adminLoginRes.body.token;

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
});
