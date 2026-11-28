import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Eye, 
  X, 
  UserCheck, 
  Building2,
  Phone,
  Mail,
  AlertCircle,
  Camera,
  Trash2,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [tutorId, setTutorId] = useState('');
  const [classAdvisorId, setClassAdvisorId] = useState('');
  const [active, setActive] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Quick Photo Upload Modal State
  const [photoModalStudent, setPhotoModalStudent] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [photoSuccess, setPhotoSuccess] = useState(null);

  // Edit/Create Modal Photo state
  const [formPhotoFile, setFormPhotoFile] = useState(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState(null);

  // Bulk Selection & Deletion State
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    rollNumber: '',
    departmentId: '',
    year: '1',
    section: 'A',
    email: '',
    studentPhone: '',
    parentPhone: '',
    residenceType: 'DAYSCHOLAR',
    cutoff: '',
    tutorId: '',
    classAdvisorId: '',
    password: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, departmentId, year, section, tutorId, classAdvisorId, active]);

  async function fetchMetadata() {
    try {
      const [deptRes, staffRes] = await Promise.all([
        apiRequest('/admin/departments'),
        apiRequest('/admin/staff')
      ]);
      setDepartments(deptRes.data.departments || []);
      setStaffList(staffRes.data.staff || []);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  }

  async function fetchStudents() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (departmentId) params.append('departmentId', departmentId);
      if (year) params.append('year', year);
      if (section) params.append('section', section);
      if (tutorId) params.append('tutorId', tutorId);
      if (classAdvisorId) params.append('classAdvisorId', classAdvisorId);
      if (active !== '') params.append('active', active);

      const res = await apiRequest(`/admin/students?${params.toString()}`);
      setStudents(res.data.students || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch student records.');
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setEditStudent(null);
    setFormError(null);
    setFormSuccess(null);
    setFormPhotoFile(null);
    setFormPhotoPreview(null);
    setFormData({
      name: '',
      registerNumber: '',
      rollNumber: '',
      departmentId: departments[0]?.id || '',
      year: '1',
      section: 'A',
      email: '',
      studentPhone: '',
      parentPhone: '',
      residenceType: 'DAYSCHOLAR',
      cutoff: '',
      tutorId: '',
      classAdvisorId: '',
      password: ''
    });
    setShowModal(true);
  };

  const openEditModal = (st) => {
    setEditStudent(st);
    setFormError(null);
    setFormSuccess(null);
    setFormPhotoFile(null);
    setFormPhotoPreview(st.profilePhoto || st.user?.profilePhoto || null);
    setFormData({
      name: st.name || '',
      registerNumber: st.registerNumber || '',
      rollNumber: st.rollNumber || '',
      departmentId: st.departmentId || '',
      year: String(st.year || '1'),
      section: st.section || 'A',
      email: st.email || st.user?.email || '',
      studentPhone: st.studentPhone || '',
      parentPhone: st.parentPhone || '',
      residenceType: st.residenceType || 'DAYSCHOLAR',
      cutoff: st.cutoff !== null && st.cutoff !== undefined ? String(st.cutoff) : '',
      tutorId: st.tutorId || '',
      classAdvisorId: st.classAdvisorId || '',
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
      if (formPhotoFile) {
        body = new FormData();
        Object.keys(formData).forEach(k => {
          if (formData[k] !== undefined && formData[k] !== null) {
            body.append(k, formData[k]);
          }
        });
        body.append('profilePhoto', formPhotoFile);
      } else {
        body = JSON.stringify(formData);
      }

      if (editStudent) {
        await apiRequest(`/admin/students/${editStudent.id}`, {
          method: 'PUT',
          body
        });
        setFormSuccess('Student profile updated successfully!');
      } else {
        await apiRequest('/admin/students', {
          method: 'POST',
          body
        });
        setFormSuccess('Student created successfully!');
      }
      setTimeout(() => {
        setShowModal(false);
        fetchStudents();
      }, 1000);
    } catch (err) {
      setFormError(err.message || 'Failed to save student record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Photo Modal Handlers
  const openPhotoUploadModal = (st) => {
    setPhotoModalStudent(st);
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl(st.profilePhoto || st.user?.profilePhoto || null);
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
    if (!selectedPhotoFile || !photoModalStudent) {
      setPhotoError('Please choose an image file first.');
      return;
    }
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const fd = new FormData();
      fd.append('profilePhoto', selectedPhotoFile);
      const res = await apiRequest(`/admin/students/${photoModalStudent.id}/photo`, {
        method: 'POST',
        body: fd
      });
      setPhotoSuccess('Profile photo updated successfully!');
      const updatedPath = res.data.profilePhoto;
      setStudents(prev => prev.map(s => s.id === photoModalStudent.id ? { ...s, profilePhoto: updatedPath } : s));
      if (selectedStudent?.id === photoModalStudent.id) {
        setSelectedStudent(prev => ({ ...prev, profilePhoto: updatedPath }));
      }
      setTimeout(() => {
        setPhotoModalStudent(null);
      }, 900);
    } catch (err) {
      setPhotoError(err.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoModalStudent) return;
    if (!window.confirm(`Remove profile photo for ${photoModalStudent.name}?`)) return;
    setPhotoUploading(true);
    try {
      await apiRequest(`/admin/students/${photoModalStudent.id}/photo`, {
        method: 'DELETE'
      });
      setPhotoPreviewUrl(null);
      setSelectedPhotoFile(null);
      setPhotoSuccess('Profile photo removed.');
      setStudents(prev => prev.map(s => s.id === photoModalStudent.id ? { ...s, profilePhoto: null } : s));
      if (selectedStudent?.id === photoModalStudent.id) {
        setSelectedStudent(prev => ({ ...prev, profilePhoto: null }));
      }
      setTimeout(() => {
        setPhotoModalStudent(null);
      }, 700);
    } catch (err) {
      setPhotoError(err.message || 'Failed to remove photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const toggleStudentStatus = async (st) => {
    const newStatus = !st.user?.active;
    if (!window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} student account for ${st.name}?`)) {
      return;
    }

    try {
      await apiRequest(`/admin/students/${st.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: newStatus })
      });
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to update student status.');
    }
  };

  const handleDeleteStudent = async (st) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete student ${st.name} (${st.registerNumber})? This will delete their profile and ID.`)) {
      return;
    }

    try {
      await apiRequest(`/admin/students/${st.id}`, {
        method: 'DELETE'
      });
      setStudents(prev => prev.filter(s => s.id !== st.id));
      if (selectedStudent?.id === st.id) setSelectedStudent(null);
      setSelectedStudentIds(prev => prev.filter(id => id !== st.id));
    } catch (err) {
      alert(err.message || 'Failed to delete student.');
    }
  };

  const allSelected = students.length > 0 && selectedStudentIds.length === students.length;
  const isPartiallySelected = selectedStudentIds.length > 0 && selectedStudentIds.length < students.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedStudentIds.length === 0) return;
    setBulkDeleting(true);
    try {
      await apiRequest('/admin/students/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedStudentIds })
      });
      setSelectedStudentIds([]);
      setShowBulkDeleteModal(false);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to delete selected students.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const tutors = staffList.filter(s => s.role === 'TUTOR' || s.role === 'CLASS_ADVISOR');
  const advisors = staffList.filter(s => s.role === 'CLASS_ADVISOR' || s.role === 'TUTOR');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Student Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage all enrolled students, section allocations, tutor/advisor assignments, and account statuses.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/import-students"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import Students from Excel</span>
          </Link>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Student</span>
          </button>
        </div>
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
              placeholder="Search name, Reg No, Roll No..."
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

          {/* Year Filter */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          {/* Section Filter */}
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          {/* Tutor Filter */}
          <select
            value={tutorId}
            onChange={(e) => setTutorId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            <option value="">All Tutors</option>
            {tutors.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Class Advisor Filter */}
          <select
            value={classAdvisorId}
            onChange={(e) => setClassAdvisorId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            <option value="">All Class Advisors</option>
            {advisors.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Active Status Filter */}
          <select
            value={active}
            onChange={(e) => setActive(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            <option value="">All Account Statuses</option>
            <option value="true font-bold text-emerald-600">Active Only</option>
            <option value="false font-bold text-rose-600">Inactive Only</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setDepartmentId('');
              setYear('');
              setSection('');
              setTutorId('');
              setClassAdvisorId('');
              setActive('');
            }}
            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center space-x-3 text-xs">
            <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              {selectedStudentIds.length}
            </span>
            <div>
              <p className="font-bold text-rose-900">
                {selectedStudentIds.length} Student{selectedStudentIds.length > 1 ? 's' : ''} Selected for Action
              </p>
              <p className="text-rose-600 text-[11px]">
                You can delete all selected student records permanently along with their logins and records.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedStudentIds([])}
              className="px-3.5 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedStudentIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-semibold">Loading student list...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 font-semibold">{error}</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-semibold">
            No students found matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => el && (el.indeterminate = isPartiallySelected)}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Select all visible students"
                    />
                  </th>
                  <th className="p-3.5">Reg Number</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Student Phone</th>
                  <th className="p-3.5">Parent Phone</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Yr & Sec</th>
                  <th className="p-3.5">Tutor / Advisor</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const isActive = st.user?.active;
                  const displayEmail = st.email || st.user?.email || 'N/A';
                  const isSelected = selectedStudentIds.includes(st.id);
                  return (
                    <tr key={st.id} className={`transition-colors ${isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/80'}`}>
                      <td className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(st.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-900">{st.registerNumber}</td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="relative group shrink-0">
                            {st.profilePhoto || st.user?.profilePhoto ? (
                              <img
                                src={`http://localhost:5000${st.profilePhoto || st.user?.profilePhoto}`}
                                alt={st.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                                onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div 
                              className={`w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold items-center justify-center text-xs border border-blue-200 ${st.profilePhoto || st.user?.profilePhoto ? 'hidden' : 'flex'}`}
                            >
                              {st.name ? st.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <button
                              type="button"
                              onClick={() => openPhotoUploadModal(st)}
                              title="Upload or Change Profile Photo"
                              className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-110"
                            >
                              <Camera className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{st.name}</span>
                            {st.rollNumber && <span className="text-[10px] text-blue-600 block font-mono">Roll: {st.rollNumber}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">{displayEmail}</td>
                      <td className="p-3.5 font-semibold text-blue-700 font-mono">{st.studentPhone || 'N/A'}</td>
                      <td className="p-3.5 font-semibold text-emerald-700 font-mono">{st.parentPhone || 'N/A'}</td>
                      <td className="p-3.5 font-semibold text-slate-700">{st.department?.code}</td>
                      <td className="p-3.5 font-semibold text-slate-700">Yr {st.year} - Sec {st.section}</td>
                      <td className="p-3.5 text-[11px]">
                        <span className="block text-slate-700">Tutor: <strong>{st.tutor?.name || 'N PREMKUMAR'}</strong></span>
                        <span className="block text-purple-700">Advisor: <strong>{st.classAdvisor?.name || 'N PREMKUMAR'}</strong></span>
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
                          onClick={() => setSelectedStudent(st)}
                          title="View Details"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(st)}
                          title="Edit Student"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStudentStatus(st)}
                          title={isActive ? 'Deactivate Account' : 'Activate Account'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st)}
                          title="Permanently Delete Student ID"
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

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">{editStudent ? 'Edit Student Record' : 'Add New Student'}</h3>
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

              {/* Student Profile Photo Upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-4">
                <div className="relative shrink-0">
                  {formPhotoPreview ? (
                    <img
                      src={formPhotoPreview.startsWith('blob:') ? formPhotoPreview : `http://localhost:5000${formPhotoPreview}`}
                      alt="Student Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-base border-2 border-slate-300">
                      <Camera className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block font-bold text-slate-800 mb-0.5">Student Profile Photo</label>
                  <p className="text-[11px] text-slate-500 mb-2.5">Upload a clean ID photo for this student (JPG, PNG, max 5MB)</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@institution.edu"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Register Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.registerNumber}
                    onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
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
                  <label className="block font-bold text-slate-700 mb-1">Year *</label>
                  <select
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section *</label>
                  <select
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Phone</label>
                  <input
                    type="text"
                    value={formData.studentPhone}
                    onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Phone</label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Residence Status</label>
                  <select
                    value={formData.residenceType}
                    onChange={(e) => setFormData({ ...formData, residenceType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="DAYSCHOLAR">Day Scholar</option>
                    <option value="HOSTEL">Hosteler</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cutoff Mark (Out of 200)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="200"
                    value={formData.cutoff}
                    onChange={(e) => setFormData({ ...formData, cutoff: e.target.value })}
                    placeholder="e.g. 194.50"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Tutor</label>
                  <select
                    value={formData.tutorId}
                    onChange={(e) => setFormData({ ...formData, tutorId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="">Unassigned</option>
                    {tutors.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.employeeId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Class Advisor</label>
                  <select
                    value={formData.classAdvisorId}
                    onChange={(e) => setFormData({ ...formData, classAdvisorId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="">Unassigned</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.employeeId})</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editStudent && (
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
                  {submitting ? 'Saving...' : editStudent ? 'Update Student' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Student Detailed Profile</h3>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Photo & Identity Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="relative shrink-0">
                  {selectedStudent.profilePhoto || selectedStudent.user?.profilePhoto ? (
                    <img
                      src={`http://localhost:5000${selectedStudent.profilePhoto || selectedStudent.user?.profilePhoto}`}
                      alt={selectedStudent.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                      onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className={`w-16 h-16 rounded-full bg-blue-600 text-white font-bold items-center justify-center text-xl shadow-md ${selectedStudent.profilePhoto || selectedStudent.user?.profilePhoto ? 'hidden' : 'flex'}`}>
                    {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">{selectedStudent.name}</h4>
                  <p className="text-slate-600 font-mono text-xs font-semibold">{selectedStudent.registerNumber}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedStudent.user?.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedStudent.user?.active ? 'Active Account' : 'Inactive Account'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openPhotoUploadModal(selectedStudent)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-colors shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Update Photo</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Name</span>
                <strong className="text-slate-800 text-sm">{selectedStudent.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Email</span>
                <strong className="text-slate-800">{selectedStudent.email || selectedStudent.user?.email || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Register Number</span>
                <strong className="text-slate-800 font-mono">{selectedStudent.registerNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Roll Number</span>
                <strong className="text-blue-700 font-mono">{selectedStudent.rollNumber || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Department</span>
                <strong className="text-slate-800">{selectedStudent.department?.name} ({selectedStudent.department?.code})</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Year & Section</span>
                <strong className="text-slate-800">Year {selectedStudent.year} - Sec {selectedStudent.section}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Student Phone</span>
                <strong className="text-blue-700 font-mono">{selectedStudent.studentPhone || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Parent Phone</span>
                <strong className="text-emerald-700 font-mono">{selectedStudent.parentPhone || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Residence Type</span>
                <strong className="text-slate-800">{selectedStudent.residenceType === 'HOSTEL' ? 'Hostel Resident' : 'Day Scholar'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Cutoff Mark</span>
                <strong className="text-purple-700">{selectedStudent.cutoff !== null && selectedStudent.cutoff !== undefined ? `${selectedStudent.cutoff} / 200` : 'N/A'}</strong>
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
              <span className="font-bold text-blue-900 block uppercase">Assigned Staff Hierarchy</span>
              <p className="text-slate-800"><strong>Tutor:</strong> {selectedStudent.tutor?.name || 'N PREMKUMAR'}</p>
              <p className="text-slate-800"><strong>Class Advisor:</strong> {selectedStudent.classAdvisor?.name || 'N PREMKUMAR'}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Photo Upload Modal */}
      {photoModalStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Upload Student Profile Photo</span>
              </h3>
              <button onClick={() => setPhotoModalStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="relative mx-auto w-24 h-24">
                {photoPreviewUrl ? (
                  <img
                    src={photoPreviewUrl.startsWith('blob:') ? photoPreviewUrl : `http://localhost:5000${photoPreviewUrl}`}
                    alt={photoModalStudent.name}
                    className="w-24 h-24 rounded-full object-cover border-3 border-blue-500 shadow-md mx-auto"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-2xl border-3 border-blue-200 mx-auto">
                    {photoModalStudent.name ? photoModalStudent.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{photoModalStudent.name}</h4>
                <p className="text-slate-500 font-mono text-[11px]">{photoModalStudent.registerNumber}</p>
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

                {(photoModalStudent.profilePhoto || photoPreviewUrl) && (
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
                onClick={() => setPhotoModalStudent(null)}
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

      {/* Bulk Delete Students Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Confirm Bulk Student Deletion</span>
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
                  Are you sure you want to permanently delete {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''}?
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  This action is irreversible. It will permanently remove their student records, portal user logins, applications, documents, and password reset requests.
                </p>
              </div>

              {/* Sample list of students being deleted */}
              <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
                {students
                  .filter(s => selectedStudentIds.includes(s.id))
                  .map(s => (
                    <div key={s.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{s.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{s.registerNumber} • Yr {s.year} - Sec {s.section}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-700">
                        {s.department?.code}
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
                onClick={handleBulkDeleteConfirm}
                disabled={bulkDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{bulkDeleting ? 'Deleting Students...' : `Confirm Delete (${selectedStudentIds.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
