# Dr. N.G.P. Institute of Technology - Student OD & Leave Management System

A modern, role-based, enterprise-grade **Student On-Duty (OD) and Leave Management System** built for **Dr. N.G.P. Institute of Technology, Coimbatore**, initially configured for the **Department of Artificial Intelligence & Data Science (AI & DS)** and engineered with scalable relational architecture for college-wide deployment.

---

## 🌟 Key Features & Administration Module

- **System Administration Module (`role = ADMIN`)**: Full institutional management over Students, Staff, Departments, Academic Structure, Staff Assignments, Excel Imports, Application Monitoring, Reports, and Audit Trails.
- **Strict Approval Separation**: Admin is a **system manager and observer ONLY** and is **NOT part of the OD/Leave approval chain**. Admin cannot approve or reject applications, maintaining complete audit integrity.
- **Direct Excel Data Import**: Bulk onboard student records directly from `student_import_template.xlsx` with row-specific validation report.
- **5-Step OD Approval Workflow**: Student submission → Tutor Review → Class Advisor Parent Telephonic Confirmation → HOD Approval → Principal Office Authorization & PDF Seal Stamp.
- **4-Step Leave Approval Workflow**: Student submission → Tutor Review → Class Advisor Parent Telephonic Confirmation → HOD Approval.
- **Strict PDF Certificate Download Security**: Only the respective student who submitted an approved application can download their official PDF certificate. Staff members and unauthorized users are blocked (HTTP 403).
- **Parent Contact & Telephonic Confirmation**: Parent phone numbers are prominently displayed across Class Advisor queues and application detail modals with direct phone call triggers.
- **Immutable Audit Logging (`AuditLog`)**: Records administrative actions (student/staff creation, edits, status toggling, staff reassignments, password resets, Excel imports) with before/after state capture.

---


## 📋 Approval Workflows (Untouched & Preserved)

### 1. On-Duty (OD) Workflow (5 Steps)
```
Student (Submits Application)
   ↓
Tutor (Reviews: Approve / Reject + Remarks)
   ↓
Class Advisor (Parent Telephonic Confirmation + Remarks → Forward to HOD)
   ↓
HOD (Reviews: Approve / Reject + Remarks)
   ↓
Principal Office Staff (Final Seal & Signature Authorization)
   ↓
OD Completed (Status: APPROVED / COMPLETED)
   ↳ PDF Certificate strictly downloadable ONLY by the respective student
```

### 2. Leave Workflow (4 Steps)
```
Student (Submits Application)
   ↓
Tutor (Reviews: Approve / Reject + Remarks)
   ↓
Class Advisor (Parent Telephonic Confirmation + Remarks → Forward to HOD)
   ↓
HOD (Final Approval / Reject)
   ↓
Leave Completed (Status: APPROVED / COMPLETED)
```

---

## 🏛️ Administration Module Breakdown

```text
                 ADMIN ROLE (admin / Password123!)
                               │
       ┌───────────────────────┼───────────────────────┐
       ↓                       ↓                       ↓
 Students Management     Staff Management     Department Management
 (Search, Filters,       (Roles: TUTOR,       (Database-driven,
  Assign Staff, Edit)     ADVISOR, HOD, PO)    Assign HOD, Active)
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ↓
                       Excel Student Import
                      (Upload → Validate →
                       Row Error Report → DB)
                               │
                               ↓
                      Application Monitoring
                       (Read-Only Observer)
```

---

## 🛠️ Admin Module Implementation Guide

### 1. Files Added & Modified
- **Prisma Schema**: Added `AuditLog` model in `backend/prisma/schema.prisma`.
- **Backend Services**: `backend/src/services/adminService.js` (Stats, Students, Staff, Departments, Structure, Imports, Monitoring, Reports, Audit Logs).
- **Backend Controllers**: `backend/src/controllers/adminController.js`.
- **Backend Routes**: `backend/src/routes/adminRoutes.js` (Protected by `authenticate` & `restrictTo('ADMIN')`).
- **Middleware**: Updated `backend/src/middleware/auth.js` with `restrictTo(...roles)`.
- **Frontend Admin Components**:
  - `frontend/src/pages/admin/AdminDashboard.jsx`
  - `frontend/src/pages/admin/AdminStudents.jsx`
  - `frontend/src/pages/admin/AdminStaff.jsx`
  - `frontend/src/pages/admin/AdminDepartments.jsx`
  - `frontend/src/pages/admin/AdminStructure.jsx`
  - `frontend/src/pages/admin/AdminImportStudents.jsx`
  - `frontend/src/pages/admin/AdminApplications.jsx`
  - `frontend/src/pages/admin/AdminReports.jsx`
  - `frontend/src/pages/admin/AdminAuditLogs.jsx`
- **Routing & Navigation**: Updated `AppRoutes.jsx` and `Sidebar.jsx` with Admin routes.

### 2. How to Create the First Admin Account
An admin account is automatically provisioned during database seeding (`node prisma/seed.js`).
Alternatively, create an admin via backend node script:
```js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  const hash = await bcrypt.hash('Password123!', 10);
  await prisma.user.create({
    data: { username: 'admin', passwordHash: hash, role: 'ADMIN', active: true }
  });
}
createAdmin();
```

### 3. How to Import Excel Student Data
1. Log in as `admin` (Password: `Password123!`).
2. Navigate to **Import Students** (`/admin/import-students`).
3. Upload `student_import_template.xlsx`.
4. The system validates rows, checks duplicate register numbers/emails, resolves department codes and staff assignments, and renders a row-by-row error report.
5. Click **Confirm & Import Students** to write records directly to the database via Prisma.

### 4. How to Test Admin Permissions
1. Attempting to access `/api/admin/*` endpoints without logging in returns HTTP 401 Unauthorized.
2. Attempting to access `/api/admin/*` endpoints as a Student or Tutor returns HTTP 403 Forbidden ("Permission denied: You do not have authorization").
3. Admin users can access all endpoints under `/api/admin/*`.

### 5. How to Verify Admin CANNOT Approve Applications
1. Log in as `admin`.
2. Navigate to **Applications** (`/admin/applications`).
3. Click **Inspect Application** on any application. Notice that NO "Approve", "Reject", "Confirm Parent", or "Complete" buttons exist.
4. Calling `/api/applications/:id/tutor/review` or `/api/applications/:id/hod/review` with an Admin token returns HTTP 403 Forbidden because Admin does not possess a Tutor or HOD staff profile assignment.

### 6. How to Run Database Migrations
```bash
cd backend
node node_modules/prisma/build/index.js db push
node node_modules/prisma/build/index.js generate
```

---

## 📡 Admin API Endpoints Reference

All endpoints below require `Authorization: Bearer <jwt-token>` from an `ADMIN` role account:

- `GET /api/admin/dashboard`: Overview stats, department breakdown, recent activity
- `GET /api/admin/students`: List/search/filter students
- `POST /api/admin/students`: Create student + user record
- `PUT /api/admin/students/:id`: Update student record
- `PATCH /api/admin/students/:id/status`: Toggle active/inactive
- `GET /api/admin/staff`: List/search/filter staff members
- `POST /api/admin/staff`: Create staff member
- `PUT /api/admin/staff/:id`: Update staff profile & role
- `PATCH /api/admin/staff/:id/status`: Toggle active/inactive
- `POST /api/admin/users/:userId/reset-password`: Reset user account password
- `GET /api/admin/departments`: List departments & assigned HOD
- `POST /api/admin/departments`: Add database-driven department
- `PUT /api/admin/departments/:id`: Update department / assign HOD
- `GET /api/admin/academic-structure`: Department → Year → Section breakdown
- `POST /api/admin/assign-staff`: Bulk assign Tutor / Class Advisor
- `POST /api/admin/import-students/upload`: Upload & validate Excel spreadsheet
- `POST /api/admin/import-students/confirm`: Confirm & write valid rows to DB
- `GET /api/admin/applications`: System-wide read-only application monitoring
- `GET /api/admin/reports`: Institutional metrics & analytics
- `GET /api/admin/audit-logs`: Immutable administrative audit logs

---

## 📄 System Requirements File

All required environment specs and package dependencies are cataloged in [`requirements.txt`](./requirements.txt).
