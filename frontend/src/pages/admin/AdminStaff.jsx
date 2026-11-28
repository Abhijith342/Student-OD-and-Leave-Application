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
  AlertCircle,
  Camera,
  Trash2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  FileSignature
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

  // Quick Photo Upload Modal State
  const [photoModalStaff, setPhotoModalStaff] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [photoSuccess, setPhotoSuccess] = useState(null);

  // Quick Signature Upload Modal State
  const [signatureModalStaff, setSignatureModalStaff] = useState(null);
  const [selectedSignatureFile, setSelectedSignatureFile] = useState(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState(null);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureError, setSignatureError] = useState(null);
  const [signatureSuccess, setSignatureSuccess] = useState(null);

  // Edit/Create Modal Photo & Signature state
  const [formPhotoFile, setFormPhotoFile] = useState(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState(null);
  const [formSignatureFile, setFormSignatureFile] = useState(null);
  const [formSignaturePreview, setFormSignaturePreview] = useState(null);

  // Bulk Selection & Deletion State
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
    setFormPhotoFile(null);
    setFormPhotoPreview(null);
    setFormSignatureFile(null);
    setFormSignaturePreview(null);
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
    setFormPhotoFile(null);
    setFormPhotoPreview(s.profilePhoto || s.user?.profilePhoto || null);
    setFormSignatureFile(null);
    setFormSignaturePreview(s.signature || null);
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
      let body;
      if (formPhotoFile || formSignatureFile) {
        body = new FormData();
        Object.keys(formData).forEach(k => {
          if (formData[k] !== undefined && formData[k] !== null) {
            body.append(k, formData[k]);
          }
        });
        if (formPhotoFile) {
          body.append('profilePhoto', formPhotoFile);
        }
        if (formSignatureFile) {
          body.append('signature', formSignatureFile);
        }
      } else {
        body = JSON.stringify(formData);
      }

      if (editStaff) {
        await apiRequest(`/admin/staff/${editStaff.id}`, {
          method: 'PUT',
          body
        });
        setFormSuccess('Staff profile updated successfully!');
      } else {
        await apiRequest('/admin/staff', {
          method: 'POST',
          body
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

  // Quick Photo Modal Handlers
  const openPhotoUploadModal = (s) => {
    setPhotoModalStaff(s);
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl(s.profilePhoto || s.user?.profilePhoto || null);
    setPhotoError(null);
    setPhotoSuccess(null);
  };

  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
      setPhotoError(null);
    }
  };

  const handlePhotoUploadSubmit = async () => {
    if (!selectedPhotoFile || !photoModalStaff) {
      setPhotoError('Please choose an image file first.');
      return;
    }
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const fd = new FormData();
      fd.append('profilePhoto', selectedPhotoFile);
      const res = await apiRequest(`/admin/staff/${photoModalStaff.id}/photo`, {
        method: 'POST',
        body: fd
      });
      setPhotoSuccess('Profile photo updated successfully!');
      const updatedPath = res.data.profilePhoto;
      setStaffList(prev => prev.map(s => s.id === photoModalStaff.id ? { ...s, profilePhoto: updatedPath, user: { ...s.user, profilePhoto: updatedPath } } : s));
      setTimeout(() => {
        setPhotoModalStaff(null);
      }, 900);
    } catch (err) {
      setPhotoError(err.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoModalStaff) return;
    if (!window.confirm(`Remove profile photo for ${photoModalStaff.name}?`)) return;
    setPhotoUploading(true);
    try {
      await apiRequest(`/admin/staff/${photoModalStaff.id}/photo`, {
        method: 'DELETE'
      });
      setPhotoPreviewUrl(null);
      setSelectedPhotoFile(null);
      setPhotoSuccess('Profile photo removed.');
      setStaffList(prev => prev.map(s => s.id === photoModalStaff.id ? { ...s, profilePhoto: null, user: { ...s.user, profilePhoto: null } } : s));
      setTimeout(() => {
        setPhotoModalStaff(null);
      }, 700);
    } catch (err) {
      setPhotoError(err.message || 'Failed to remove photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Quick Signature Modal Handlers
  const openSignatureUploadModal = (s) => {
    setSignatureModalStaff(s);
    setSelectedSignatureFile(null);
    setSignaturePreviewUrl(s.signature || null);
    setSignatureError(null);
    setSignatureSuccess(null);
  };

  const handleSignatureSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedSignatureFile(file);
      setSignaturePreviewUrl(URL.createObjectURL(file));
      setSignatureError(null);
    }
  };

  const handleSignatureUploadSubmit = async () => {
    if (!selectedSignatureFile || !signatureModalStaff) {
      setSignatureError('Please select a signature image file first.');
      return;
    }
    setSignatureUploading(true);
    setSignatureError(null);
    try {
      const fd = new FormData();
      fd.append('signature', selectedSignatureFile);
      const res = await apiRequest(`/admin/staff/${signatureModalStaff.id}/signature`, {
        method: 'POST',
        body: fd
      });
      setSignatureSuccess('Staff signature uploaded successfully!');
      const updatedPath = res.data.signature;
      setStaffList(prev => prev.map(s => s.id === signatureModalStaff.id ? { ...s, signature: updatedPath } : s));
      setTimeout(() => {
        setSignatureModalStaff(null);
      }, 900);
    } catch (err) {
      setSignatureError(err.message || 'Failed to upload signature.');
    } finally {
      setSignatureUploading(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!signatureModalStaff) return;
    if (!window.confirm(`Are you sure you want to remove the certificate signature for ${signatureModalStaff.name}?`)) return;
    setSignatureUploading(true);
    try {
      await apiRequest(`/admin/staff/${signatureModalStaff.id}/signature`, {
        method: 'DELETE'
      });
      setSignaturePreviewUrl(null);
      setSelectedSignatureFile(null);
      setSignatureSuccess('Staff signature removed successfully.');
      setStaffList(prev => prev.map(s => s.id === signatureModalStaff.id ? { ...s, signature: null } : s));
      setTimeout(() => {
        setSignatureModalStaff(null);
      }, 700);
    } catch (err) {
      setSignatureError(err.message || 'Failed to remove signature.');
    } finally {
      setSignatureUploading(false);
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

  const handleDeleteStaff = async (s) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete staff member ${s.name} (${s.employeeId})? This will delete their profile and ID.`)) {
      return;
    }

    try {
      await apiRequest(`/admin/staff/${s.id}`, {
        method: 'DELETE'
      });
      setStaffList(prev => prev.filter(staff => staff.id !== s.id));
      setSelectedStaffIds(prev => prev.filter(id => id !== s.id));
    } catch (err) {
      alert(err.message || 'Failed to delete staff member.');
    }
  };

  const allStaffSelected = staffList.length > 0 && selectedStaffIds.length === staffList.length;
  const isPartiallyStaffSelected = selectedStaffIds.length > 0 && selectedStaffIds.length < staffList.length;

  const toggleSelectAllStaff = () => {
    if (allStaffSelected) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staffList.map(s => s.id));
    }
  };

  const toggleSelectStaff = (id) => {
    setSelectedStaffIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteStaffConfirm = async () => {
    if (selectedStaffIds.length === 0) return;
    setBulkDeleting(true);
    try {
      await apiRequest('/admin/staff/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedStaffIds })
      });
      setSelectedStaffIds([]);
      setShowBulkDeleteModal(false);
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to delete selected staff members.');
    } finally {
      setBulkDeleting(false);
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

      {/* Bulk Action Bar */}
      {selectedStaffIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center space-x-3 text-xs">
            <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              {selectedStaffIds.length}
            </span>
            <div>
              <p className="font-bold text-rose-900">
                {selectedStaffIds.length} Staff Member{selectedStaffIds.length > 1 ? 's' : ''} Selected
              </p>
              <p className="text-rose-600 text-[11px]">
                Deleting will remove their staff IDs, login accounts, and unassign them from tutored/advised students and sections.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedStaffIds([])}
              className="px-3.5 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedStaffIds.length})</span>
            </button>
          </div>
        </div>
      )}

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
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allStaffSelected}
                      ref={el => el && (el.indeterminate = isPartiallyStaffSelected)}
                      onChange={toggleSelectAllStaff}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Select all staff members"
                    />
                  </th>
                  <th className="p-3.5">Employee ID</th>
                  <th className="p-3.5">Staff Name</th>
                  <th className="p-3.5">Username / Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Assigned Students</th>
                  <th className="p-3.5">Signature</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s) => {
                  const isActive = s.user?.active;
                  const isSelected = selectedStaffIds.includes(s.id);
                  return (
                    <tr key={s.id} className={`transition-colors ${isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/80'}`}>
                      <td className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStaff(s.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-900">{s.employeeId}</td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="relative group shrink-0">
                            {s.profilePhoto || s.user?.profilePhoto ? (
                              <img
                                src={`http://localhost:5000${s.profilePhoto || s.user?.profilePhoto}`}
                                alt={s.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                                onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div 
                              className={`w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold items-center justify-center text-xs border border-blue-200 ${s.profilePhoto || s.user?.profilePhoto ? 'hidden' : 'flex'}`}
                            >
                              {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <button
                              type="button"
                              onClick={() => openPhotoUploadModal(s)}
                              title="Upload or Change Profile Photo"
                              className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-110"
                            >
                              <Camera className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">{s.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-600">
                        <span className="block font-mono text-slate-900">{s.user?.username}</span>
                        <span>{s.user?.email || 'No email provided'}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleColors[s.role] || 'bg-slate-100'}`}>
                            {s.role}
                          </span>
                          {s.role === 'CLASS_ADVISOR' && s._count?.tutoredStudents > 0 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-blue-100 text-blue-800 border-blue-200">
                              TUTOR
                            </span>
                          )}
                          {s.role === 'TUTOR' && s._count?.advisedStudents > 0 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-purple-100 text-purple-800 border-purple-200">
                              CLASS ADVISOR
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{s.department?.code}</td>
                      <td className="p-3.5 text-[11px]">
                        <span className="block">Tutored: <strong>{s._count?.tutoredStudents || 0}</strong></span>
                        <span className="block text-purple-700">Advised: <strong>{s._count?.advisedStudents || 0}</strong></span>
                      </td>
                      {/* Signature Column */}
                      <td className="p-3.5">
                        {s.signature ? (
                          <div className="flex items-center space-x-2">
                            <div 
                              onClick={() => openSignatureUploadModal(s)}
                              title="Click to view or replace certificate signature"
                              className="group relative cursor-pointer"
                            >
                              <div className="h-9 w-20 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden shadow-2xs group-hover:border-indigo-400 group-hover:shadow-xs transition-all">
                                <img
                                  src={`http://localhost:5000${s.signature}`}
                                  alt={`${s.name} signature`}
                                  className="h-full w-full object-contain"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => openSignatureUploadModal(s)}
                              title="Change Signature"
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openSignatureUploadModal(s)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold transition-all shadow-2xs"
                            title="Upload signature image to embed into approved certificates"
                          >
                            <FileSignature className="w-3 h-3 text-amber-600" />
                            <span>+ Signature</span>
                          </button>
                        )}
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
                        <button
                          onClick={() => handleDeleteStaff(s)}
                          title="Permanently Delete Staff ID"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

              {/* Profile Photo Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-4">
                <div className="relative w-16 h-16 shrink-0">
                  {formPhotoPreview ? (
                    <img
                      src={formPhotoPreview.startsWith('blob:') ? formPhotoPreview : `http://localhost:5000${formPhotoPreview}`}
                      alt="Staff Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-base border-2 border-slate-300">
                      <Camera className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block font-bold text-slate-800 mb-0.5">Staff Profile Photo</label>
                  <p className="text-[11px] text-slate-500 mb-2.5">Upload a clean ID photo for this staff member (JPG, PNG, max 5MB)</p>
                  <div className="flex items-center space-x-2">
                    <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer text-xs inline-flex items-center space-x-1.5 shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{formPhotoPreview ? 'Change Photo' : 'Select Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setFormPhotoFile(file);
                            setFormPhotoPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    {formPhotoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormPhotoFile(null);
                          setFormPhotoPreview(null);
                          setFormData({ ...formData, profilePhoto: null });
                        }}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg text-xs transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Staff Signature Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-4">
                <div className="relative w-24 h-14 shrink-0 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                  {formSignaturePreview ? (
                    <img
                      src={formSignaturePreview.startsWith('blob:') ? formSignaturePreview : `http://localhost:5000${formSignaturePreview}`}
                      alt="Signature Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <FileSignature className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block font-bold text-slate-800 mb-0.5">Staff Certificate Signature</label>
                  <p className="text-[11px] text-slate-500 mb-2">Upload official digital signature to embed in approved OD & Leave certificates (PNG/JPG)</p>
                  <div className="flex items-center space-x-2">
                    <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer text-xs inline-flex items-center space-x-1.5 shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{formSignaturePreview ? 'Change Signature' : 'Select Signature'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setFormSignatureFile(file);
                            setFormSignaturePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    {formSignaturePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormSignatureFile(null);
                          setFormSignaturePreview(null);
                          setFormData({ ...formData, signature: null });
                        }}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg text-xs transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

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

      {/* Quick Photo Upload Modal */}
      {photoModalStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Upload Staff Profile Photo</span>
              </h3>
              <button onClick={() => setPhotoModalStaff(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="relative mx-auto w-24 h-24">
                {photoPreviewUrl ? (
                  <img
                    src={photoPreviewUrl.startsWith('blob:') ? photoPreviewUrl : `http://localhost:5000${photoPreviewUrl}`}
                    alt={photoModalStaff.name}
                    className="w-24 h-24 rounded-full object-cover border-3 border-blue-500 shadow-md mx-auto"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-2xl border-3 border-blue-200 mx-auto">
                    {photoModalStaff.name ? photoModalStaff.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{photoModalStaff.name}</h4>
                <p className="text-slate-500 font-mono text-[11px]">{photoModalStaff.employeeId}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {photoModalStaff.role}
                </span>
              </div>

              {photoError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium text-[11px]">
                  {photoError}
                </div>
              )}
              {photoSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-[11px]">
                  {photoSuccess}
                </div>
              )}

              <div className="pt-2 flex flex-col items-center space-y-2">
                <label className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl cursor-pointer text-xs flex items-center justify-center space-x-2 transition-colors border border-blue-200">
                  <Upload className="w-4 h-4" />
                  <span>Select Image from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>

                {(photoModalStaff.profilePhoto || photoModalStaff.user?.profilePhoto || photoPreviewUrl) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={photoUploading}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Current Photo</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPhotoModalStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePhotoUploadSubmit}
                disabled={!selectedPhotoFile || photoUploading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs"
              >
                {photoUploading ? 'Saving...' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Signature Upload Modal */}
      {signatureModalStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FileSignature className="w-4 h-4 text-indigo-600" />
                <span>Upload Certificate Signature</span>
              </h3>
              <button onClick={() => setSignatureModalStaff(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                  {signatureModalStaff.name ? signatureModalStaff.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{signatureModalStaff.name}</h4>
                  <p className="text-slate-500 font-mono text-[11px]">{signatureModalStaff.employeeId} • {signatureModalStaff.role}</p>
                </div>
              </div>

              {/* Signature Preview Canvas Box */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Official Signature Preview (Embedded in Certificates)
                </label>
                <div className="w-full h-32 bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden group shadow-inner">
                  {signaturePreviewUrl ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={signaturePreviewUrl.startsWith('blob:') ? signaturePreviewUrl : `http://localhost:5000${signaturePreviewUrl}`}
                        alt="Signature Preview"
                        className="max-h-24 max-w-full object-contain filter drop-shadow-xs"
                      />
                      <span className="absolute bottom-2 right-2 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Active on Certificate</span>
                      </span>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <FileSignature className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-[11px] font-semibold text-slate-400">No signature uploaded yet</p>
                      <p className="text-[10px] text-slate-400">PNG with transparent background or high-contrast scan recommended</p>
                    </div>
                  )}
                </div>
              </div>

              {signatureError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium text-[11px]">
                  {signatureError}
                </div>
              )}
              {signatureSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-[11px]">
                  {signatureSuccess}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <label className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl cursor-pointer text-xs flex items-center justify-center space-x-2 transition-colors border border-indigo-200">
                  <Upload className="w-4 h-4" />
                  <span>{signaturePreviewUrl ? 'Choose Different Signature Image' : 'Select Signature Image'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleSignatureSelect}
                  />
                </label>

                {(signatureModalStaff.signature || signaturePreviewUrl) && (
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    disabled={signatureUploading}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Signature from Certificate</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSignatureModalStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignatureUploadSubmit}
                disabled={!selectedSignatureFile || signatureUploading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs"
              >
                {signatureUploading ? 'Saving Signature...' : 'Save Signature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Staff Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Confirm Bulk Staff Deletion</span>
              </h3>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                <p className="font-bold text-xs">
                  Are you sure you want to permanently delete {selectedStaffIds.length} staff member{selectedStaffIds.length > 1 ? 's' : ''}?
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  This will remove their staff profiles, user login accounts, and unassign them from any tutored or advised students and sections.
                </p>
              </div>

              {/* Sample list of staff being deleted */}
              <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
                {staffList
                  .filter(s => selectedStaffIds.includes(s.id))
                  .map(s => (
                    <div key={s.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{s.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{s.employeeId} • {s.user?.username}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                        {s.role}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteStaffConfirm}
                disabled={bulkDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{bulkDeleting ? 'Deleting Staff...' : `Confirm Delete (${selectedStaffIds.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
