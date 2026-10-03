import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { StatusBadge, StageBadge } from '../../components/StatusBadge';
import ApplicationDetailsModal from '../ApplicationDetailsModal';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  ShieldCheck, 
  Lock,
  Building2,
  Trash2
} from 'lucide-react';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [search, type, status, currentStage, departmentId, year, section, fromDate, toDate]);

  async function fetchDepartments() {
    try {
      const res = await apiRequest('/admin/departments');
      setDepartments(res.data.departments);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }

  async function fetchApplications() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (currentStage) params.append('currentStage', currentStage);
      if (departmentId) params.append('departmentId', departmentId);
      if (year) params.append('year', year);
      if (section) params.append('section', section);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const res = await apiRequest(`/admin/applications?${params.toString()}`);
      setApplications(res.data.applications);
    } catch (err) {
      setError(err.message || 'Failed to fetch application records.');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteApplication = async (app) => {
    if (!window.confirm(`Are you sure you want to permanently delete application #${app.applicationNumber} for ${app.student?.name}?`)) {
      return;
    }
    try {
      await apiRequest(`/admin/applications/${app.id}`, { method: 'DELETE' });
      fetchApplications();
    } catch (err) {
      alert(err.message || 'Failed to delete application.');
    }
  };

  const handleClearAllApplications = async () => {
    const filterText = type ? `${type} ` : '';
    if (!window.confirm(`CAUTION: Are you sure you want to permanently delete ALL ${filterText}OD and Leave application records from the database? This cannot be undone.`)) {
      return;
    }
    try {
      const url = type ? `/admin/applications/clear-all?type=${type}` : '/admin/applications/clear-all';
      const res = await apiRequest(url, { method: 'DELETE' });
      alert(res.message || 'Applications deleted successfully.');
      fetchApplications();
    } catch (err) {
      alert(err.message || 'Failed to clear application records.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>System-Wide Application Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor, inspect, or manage OD and Leave records across all college departments.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {applications.length > 0 && (
            <button
              onClick={handleClearAllApplications}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear {type ? `${type} ` : ''}Applications ({applications.length})</span>
            </button>
          )}

          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Observer Mode (Approvals Preserved)</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters & Range</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student name, Reg No..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Type Filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
          >
            <option value="">All Application Types (OD & Leave)</option>
            <option value="OD">On-Duty (OD)</option>
            <option value="LEAVE">Leave</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          {/* Stage Filter */}
          <select
            value={currentStage}
            onChange={(e) => setCurrentStage(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
          >
            <option value="">All Workflow Stages</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="TUTOR_PENDING">TUTOR_PENDING</option>
            <option value="ADVISOR_PENDING">ADVISOR_PENDING</option>
            <option value="HOD_PENDING">HOD_PENDING</option>
            <option value="PRINCIPAL_PENDING">PRINCIPAL_PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
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
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
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
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setType('');
              setStatus('');
              setCurrentStage('');
              setDepartmentId('');
              setYear('');
              setSection('');
              setFromDate('');
              setToDate('');
            }}
            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-semibold">Loading application feed...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 font-semibold">{error}</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-semibold">
            No application records found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">App ID</th>
                  <th className="p-3.5">Student Details</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5">Current Stage</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-slate-900">#{app.applicationNumber}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 block">{app.student?.name}</span>
                      <span className="text-[10px] text-slate-400">Reg: {app.student?.registerNumber} • {app.student?.department?.code} (Yr {app.student?.year}-{app.student?.section})</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.type === 'OD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {app.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {new Date(app.fromDate).toLocaleDateString()} to {new Date(app.toDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <StageBadge stage={app.currentStage} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => handleDeleteApplication(app)}
                        title="Delete application record"
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
