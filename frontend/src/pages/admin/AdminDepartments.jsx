import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { 
  Building2, 
  Plus, 
  Edit, 
  CheckCircle, 
  XCircle, 
  X, 
  Users, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editDepartment, setEditDepartment] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hodStaffId: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useEffect(() => {
    fetchDepartments();
    fetchStaff();
  }, []);

  async function fetchDepartments() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/admin/departments');
      setDepartments(res.data.departments);
    } catch (err) {
      setError(err.message || 'Failed to fetch department records.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStaff() {
    try {
      const res = await apiRequest('/admin/staff');
      setStaffList(res.data.staff);
    } catch (err) {
      console.error('Failed to load staff for HOD assignment:', err);
    }
  }

  const openCreateModal = () => {
    setEditDepartment(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      name: '',
      code: '',
      hodStaffId: ''
    });
    setShowModal(true);
  };

  const openEditModal = (d) => {
    setEditDepartment(d);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      name: d.name || '',
      code: d.code || '',
      hodStaffId: d.hod?.id || ''
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (editDepartment) {
        await apiRequest(`/admin/departments/${editDepartment.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setFormSuccess('Department updated successfully!');
      } else {
        await apiRequest('/admin/departments', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setFormSuccess('Department created successfully!');
      }
      setTimeout(() => {
        setShowModal(false);
        fetchDepartments();
      }, 1000);
    } catch (err) {
      setFormError(err.message || 'Failed to save department.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDeptStatus = async (d) => {
    const newStatus = !d.active;
    if (!window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} department ${d.name}?`)) {
      return;
    }

    try {
      await apiRequest(`/admin/departments/${d.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: newStatus })
      });
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Failed to update department status.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Department Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Database-driven department structure. Add new academic departments and assign Head of Department (HOD) roles without source code modifications.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-semibold">Loading departments...</div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-rose-600 font-semibold">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-mono text-xs font-bold rounded-md">
                      {d.code}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-2">{d.name}</h2>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    d.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {d.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span><strong>{d.studentCount}</strong> Students</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span><strong>{d.staffCount}</strong> Staff</span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Head of Department (HOD)</span>
                  <span className="font-bold text-slate-800 text-sm block">
                    {d.hod ? `${d.hod.name} (${d.hod.employeeId})` : 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => openEditModal(d)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit / Assign HOD</span>
                </button>

                <button
                  onClick={() => toggleDeptStatus(d)}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-colors flex items-center space-x-1 ${
                    d.active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {d.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  <span>{d.active ? 'Deactivate' : 'Activate'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">{editDepartment ? 'Edit Department' : 'Add New Department'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Computer Science and Engineering"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CSE"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Head of Department (HOD)</label>
                <select
                  value={formData.hodStaffId}
                  onChange={(e) => setFormData({ ...formData, hodStaffId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="">Select HOD Staff Member</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.employeeId} - {s.department?.code})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
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
                  {submitting ? 'Saving...' : editDepartment ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
