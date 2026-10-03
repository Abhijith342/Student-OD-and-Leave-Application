import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Users, 
  UserCheck, 
  Building2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock 
} from 'lucide-react';

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [type, setType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [departmentId, year, section, type, fromDate, toDate]);

  async function fetchDepartments() {
    try {
      const res = await apiRequest('/admin/departments');
      setDepartments(res.data.departments);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }

  async function fetchReports() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      if (year) params.append('year', year);
      if (section) params.append('section', section);
      if (type) params.append('type', type);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const res = await apiRequest(`/admin/reports?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate system report.');
    } finally {
      setLoading(false);
    }
  }

  const handleExportCSV = () => {
    if (!data || !data.applications || data.applications.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['Application Number', 'Type', 'Student Name', 'Register Number', 'Department', 'From Date', 'To Date', 'Reason', 'Current Stage', 'Status', 'Submitted At'];
    const rows = data.applications.map(app => [
      app.applicationNumber,
      app.type,
      `"${app.student?.name || ''}"`,
      app.student?.registerNumber || '',
      app.student?.department?.code || '',
      new Date(app.fromDate).toLocaleDateString(),
      new Date(app.toDate).toLocaleDateString(),
      `"${(app.reason || '').replace(/"/g, '""')}"`,
      app.currentStage,
      app.status,
      new Date(app.createdAt).toLocaleString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `System_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 font-semibold">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Generating institutional analytics and reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-xs text-rose-600 font-semibold">{error}</div>
    );
  }

  const { summary, departmentsSummary, applications } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Institutional Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated system metrics, OD vs Leave statistics, workflow stage distribution, and Excel CSV export.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={applications.length === 0}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Spreadsheet</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Report Scope Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
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

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
          >
            <option value="">All Types (OD & Leave)</option>
            <option value="OD">OD Only</option>
            <option value="LEAVE">Leave Only</option>
          </select>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={() => {
                setDepartmentId('');
                setYear('');
                setSection('');
                setType('');
                setFromDate('');
                setToDate('');
              }}
              className="w-full p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Enrolled Students</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Applications</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalApplications}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">On-Duty (OD) Requests</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{summary.totalOD}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Leave Requests</span>
          <p className="text-2xl font-black text-purple-600 mt-1">{summary.totalLeave}</p>
        </div>
      </div>

      {/* Department Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Department Capacity Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {departmentsSummary.map(d => (
            <div key={d.code} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-800">{d.name} ({d.code})</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <span className="text-slate-600">Students: <strong>{d.students}</strong></span>
                <span className="text-slate-600">Staff: <strong>{d.staff}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
