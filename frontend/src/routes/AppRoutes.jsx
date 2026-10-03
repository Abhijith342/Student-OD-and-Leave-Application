import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import StudentDashboard from '../pages/StudentDashboard';
import ApplyOD from '../pages/ApplyOD';
import ApplyLeave from '../pages/ApplyLeave';
import MyApplications from '../pages/MyApplications';
import TutorDashboard from '../pages/TutorDashboard';
import ClassAdvisorDashboard from '../pages/ClassAdvisorDashboard';
import HodDashboard from '../pages/HodDashboard';
import PrincipalOfficeDashboard from '../pages/PrincipalOfficeDashboard';
import NotificationsPage from '../pages/NotificationsPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import ApplicationDetailsPage from '../pages/ApplicationDetailsPage';

// Admin Module Imports
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminStudents from '../pages/admin/AdminStudents';
import AdminStaff from '../pages/admin/AdminStaff';
import AdminDepartments from '../pages/admin/AdminDepartments';
import AdminImportStudents from '../pages/admin/AdminImportStudents';
import AdminApplications from '../pages/admin/AdminApplications';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading session...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RoleBasedDashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'STUDENT':
      return <StudentDashboard />;
    case 'TUTOR':
      return <TutorDashboard />;
    case 'CLASS_ADVISOR':
      return <ClassAdvisorDashboard />;
    case 'HOD':
      return <HodDashboard />;
    case 'PRINCIPAL_OFFICE':
      return <PrincipalOfficeDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/apply-od"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ApplyOD />
          </ProtectedRoute>
        }
      />

      <Route
        path="/apply-leave"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ApplyLeave />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-applications"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <MyApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Module Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminStaff />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDepartments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/import-students"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminImportStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminAuditLogs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applications/:id"
        element={
          <ProtectedRoute>
            <ApplicationDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/application/:id"
        element={
          <ProtectedRoute>
            <ApplicationDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
