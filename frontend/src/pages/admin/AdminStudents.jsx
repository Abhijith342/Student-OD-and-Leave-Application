import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Link } from 'react-router-dom';
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
  AlertCircle
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
      setDepartments(deptRes.data.departments);
      setStaffList(staffRes.data.staff);
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
      setStudents(res.data.students);
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
      if (editStudent) {
        await apiRequest(`/admin/students/${editStudent.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setFormSuccess('Student profile updated successfully!');
      } else {
        await apiRequest('/admin/students', {
          method: 'POST',
          body: JSON.stringify(formData)
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
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-900">{st.registerNumber}</td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {st.name}
                        {st.rollNumber && <span className="text-[10px] text-blue-600 block">Roll: {st.rollNumber}</span>}
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
    </div>
  );
}
