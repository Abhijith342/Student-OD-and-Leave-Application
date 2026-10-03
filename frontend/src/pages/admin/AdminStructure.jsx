import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { 
  GitFork, 
  Building2, 
  Users, 
  UserCheck, 
  CheckCircle, 
  AlertCircle,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function AdminStructure() {
  const [structure, setStructure] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bulk assignment state
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedYear, setSelectedYear] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [structRes, deptRes, staffRes] = await Promise.all([
        apiRequest('/admin/academic-structure'),
        apiRequest('/admin/departments'),
        apiRequest('/admin/staff')
      ]);
      setStructure(structRes.data.structure);
      setDepartments(deptRes.data.departments);
      setStaffList(staffRes.data.staff);

      if (deptRes.data.departments.length > 0) {
        setSelectedDeptId(deptRes.data.departments[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch academic structure.');
    } finally {
      setLoading(false);
    }
  }

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedDeptId || !selectedYear || !selectedSection) {
      setMessage({ type: 'error', text: 'Please select Department, Year, and Section.' });
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiRequest('/admin/assign-staff', {
        method: 'POST',
        body: JSON.stringify({
          departmentId: selectedDeptId,
          year: selectedYear,
          section: selectedSection,
          tutorId: selectedTutorId || null,
          classAdvisorId: selectedAdvisorId || null
        })
      });

      setMessage({ type: 'success', text: res.message || 'Staff assignments updated successfully!' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update assignments.' });
    } finally {
      setSubmitting(false);
    }
  };

  const tutors = staffList.filter(s => s.role === 'TUTOR' || s.role === 'CLASS_ADVISOR');
  const advisors = staffList.filter(s => s.role === 'CLASS_ADVISOR' || s.role === 'TUTOR');

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <GitFork className="w-5 h-5 text-blue-600" />
            <span>Academic Structure & Staff Assignments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Database-driven hierarchy breakdown (Department → Year → Section) with bulk Tutor and Class Advisor allocation.
          </p>
        </div>
      </div>

      {/* Global Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center space-x-3 transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid Layout: Bulk Assignment Form & Live Structure Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Bulk Assignment Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 h-fit">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>Bulk Assign Tutor / Advisor</span>
          </div>

          <form onSubmit={handleBulkAssign} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Department *</label>
              <select
                required
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Year *</label>
                <select
                  required
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
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
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assign Tutor</label>
              <select
                value={selectedTutorId}
                onChange={(e) => setSelectedTutorId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              >
                <option value="">Do Not Change / Unassign</option>
                {tutors.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.employeeId})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assign Class Advisor</label>
              <select
                value={selectedAdvisorId}
                onChange={(e) => setSelectedAdvisorId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              >
                <option value="">Do Not Change / Unassign</option>
                {advisors.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.employeeId})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              {submitting ? 'Applying Assignments...' : 'Apply Assignments to Section'}
            </button>
          </form>
        </div>

        {/* Structure Tree View */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold">Loading structure tree...</div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-600 font-semibold">{error}</div>
          ) : (
            structure.map((dept) => (
              <div key={dept.departmentId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{dept.departmentName} ({dept.departmentCode})</h3>
                      <p className="text-xs text-slate-500">
                        {dept.totalStudents} Enrolled Students | Assigned HOD: <strong>{dept.hod?.name || 'Unassigned'}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {dept.yearSections.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                    No students currently allocated to sections in this department.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dept.yearSections.map((ys, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold border-b border-slate-200 pb-2">
                          <span className="text-blue-900 flex items-center space-x-1">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <span>Year {ys.year} - Section {ys.section}</span>
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px]">
                            {ys.studentCount} Students
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] pt-1">
                          <p className="text-slate-700">
                            <strong>Tutors:</strong> {ys.tutors.length > 0 ? ys.tutors.map(t => t.name).join(', ') : 'N PREMKUMAR'}
                          </p>
                          <p className="text-purple-800">
                            <strong>Class Advisor:</strong> {ys.classAdvisors.length > 0 ? ys.classAdvisors.map(a => a.name).join(', ') : 'N PREMKUMAR'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
