import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { 
  UserCheck, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  CheckCircle, 
  XCircle, 
  X, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [resetStaffUser, setResetStaffUser] = useState(null);
  const [newPassword, setNewPassword] = useState('Password123!');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    username: '',
    email: '',
    departmentId: '',
    role: 'TUTOR',
    password: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [search, departmentId, role, active]);

  async function fetchDepartments() {
    try {
      const res = await apiRequest('/admin/departments');
      setDepartments(res.data.departments);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }

  async function fetchStaff() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (departmentId) params.append('departmentId', departmentId);
      if (role) params.append('role', role);
      if (active !== '') params.append('active', active);

      const res = await apiRequest(`/admin/staff?${params.toString()}`);
      setStaffList(res.data.staff);
    } catch (err) {
      setError(err.message || 'Failed to fetch staff records.');
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setEditStaff(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      name: '',
      employeeId: '',
      username: '',
      email: '',
      departmentId: departments[0]?.id || '',
      role: 'TUTOR',
      password: ''
    });
    setShowModal(true);
  };

  const openEditModal = (s) => {
    setEditStaff(s);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      name: s.name || '',
      employeeId: s.employeeId || '',
      username: s.user?.username || '',
      email: s.user?.email || '',
      departmentId: s.departmentId || '',
      role: s.role || 'TUTOR',
      password: ''
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (editStaff) {
        await apiRequest(`/admin/staff/${editStaff.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setFormSuccess('Staff profile updated successfully!');
      } else {
        await apiRequest('/admin/staff', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setFormSuccess('Staff created successfully!');
      }
      setTimeout(() => {
        setShowModal(false);
        fetchStaff();
      }, 1000);
    } catch (err) {
      setFormError(err.message || 'Failed to save staff record.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStaffStatus = async (s) => {
    const newStatus = !s.user?.active;
    if (!window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} staff account for ${s.name}?`)) {
      return;
    }

    try {
      await apiRequest(`/admin/staff/${s.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: newStatus })
      });
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to update staff status.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetStaffUser) return;

    try {
      const res = await apiRequest(`/admin/users/${resetStaffUser.userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword })
      });
      alert(res.message || 'Password reset successfully!');
      setResetStaffUser(null);
    } catch (err) {
      alert(err.message || 'Failed to reset password.');
    }
  };

  const roleColors = {
    TUTOR: 'bg-blue-100 text-blue-800 border-blue-200',
    CLASS_ADVISOR: 'bg-purple-100 text-purple-800 border-purple-200',
    HOD: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PRINCIPAL_OFFICE: 'bg-amber-100 text-amber-800 border-amber-200',
    ADMIN: 'bg-rose-100 text-rose-800 border-rose-200'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>Staff Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic staff, tutors, class advisors, HODs, Principal office staff, and administrative roles.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters & Search</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, Employee ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            <option value="">All Roles</option>
            <option value="TUTOR">Tutor</option>
            <option value="CLASS_ADVISOR">Class Advisor</option>
            <option value="HOD">Head of Department (HOD)</option>
            <option value="PRINCIPAL_OFFICE">Principal Office Staff</option>
            <option value="ADMIN">System Admin</option>
          </select>

          {/* Active Status Filter */}
          <select
            value={active}
            onChange={(e) => setActive(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            <option value="">All Account Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-semibold">Loading staff list...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 font-semibold">{error}</div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-semibold">
            No staff records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Employee ID</th>
                  <th className="p-3.5">Staff Name</th>
                  <th className="p-3.5">Username / Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Assigned Students</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s) => {
                  const isActive = s.user?.active;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-900">{s.employeeId}</td>
                      <td className="p-3.5 font-bold text-slate-800">{s.name}</td>
                      <td className="p-3.5 text-[11px] text-slate-600">
                        <span className="block font-mono text-slate-900">{s.user?.username}</span>
                        <span>{s.user?.email || 'No email provided'}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${roleColors[s.role] || 'bg-slate-100'}`}>
                          {s.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{s.department?.code}</td>
                      <td className="p-3.5 text-[11px]">
                        <span className="block">Tutored: <strong>{s._count?.tutoredStudents || 0}</strong></span>
                        <span className="block text-purple-700">Advised: <strong>{s._count?.advisedStudents || 0}</strong></span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 shrink-0">
                        <button
                          onClick={() => setResetStaffUser(s)}
                          title="Reset Password"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          title="Edit Staff Member"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStaffStatus(s)}
                          title={isActive ? 'Deactivate Account' : 'Activate Account'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">{editStaff ? 'Edit Staff Profile' : 'Add New Staff Member'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Defaults to Employee ID"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="TUTOR">TUTOR</option>
                    <option value="CLASS_ADVISOR">CLASS ADVISOR</option>
                    <option value="HOD">HEAD OF DEPARTMENT (HOD)</option>
                    <option value="PRINCIPAL_OFFICE">PRINCIPAL OFFICE STAFF</option>
                    <option value="ADMIN">SYSTEM ADMIN</option>
                  </select>
                </div>
              </div>

              {!editStaff && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Password (Optional - Defaults to Password123!)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password123!"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {submitting ? 'Saving...' : editStaff ? 'Update Staff Profile' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetStaffUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Reset User Password</span>
              </h3>
              <button onClick={() => setResetStaffUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Reset password for staff member <strong>{resetStaffUser.name}</strong> (Username: <code>{resetStaffUser.user?.username}</code>).
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetStaffUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                >
                  Confirm Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
