import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Link } from 'react-router-dom';
import { StatusBadge, StageBadge } from '../../components/StatusBadge';
import { 
  Users, 
  UserCheck, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  ArrowUpRight, 
  PlusCircle, 
  Upload, 
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await apiRequest('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load admin dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs font-semibold text-slate-600">Loading system administration metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium text-center">
        {error}
      </div>
    );
  }

  const { overview, recentApplications, recentlyAddedStudents, recentlyAddedStaff, departmentStats } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Institutional Control Panel</span>
          </div>
          <h1 className="text-2xl font-black">System Administration</h1>
          <p className="text-xs text-slate-300 mt-1">
            Manage student records, staff accounts, academic departments, and monitor college-wide OD & Leave workflows.
          </p>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Link
            to="/admin/import-students"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </Link>
          <Link
            to="/admin/students"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Students</span>
          </Link>
          <Link
            to="/admin/staff"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Manage Staff</span>
          </Link>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{overview.totalStudents}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{overview.totalStaff}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departments</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{overview.totalDepartments}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Requests</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{overview.pendingOD + overview.pendingLeave}</p>
            <span className="text-[10px] text-slate-400">OD: {overview.pendingOD} | Leave: {overview.pendingLeave}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Workflow Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-semibold block">Approved Applications</span>
            <span className="text-xl font-black text-emerald-600">{overview.approvedApplications}</span>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-semibold block">Rejected Applications</span>
            <span className="text-xl font-black text-rose-600">{overview.rejectedApplications}</span>
          </div>
          <XCircle className="w-6 h-6 text-rose-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-semibold block">Completed OD Seals</span>
            <span className="text-xl font-black text-blue-600">{overview.completedApplications}</span>
          </div>
          <ShieldCheck className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      {/* Main Content Grid: Recent Applications & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Applications Monitoring Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Application Workflow Monitoring</h2>
              <p className="text-xs text-slate-500">Live feed across all college departments (Read-only observer)</p>
            </div>
            <Link
              to="/admin/applications"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No applications recorded in system yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">App ID</th>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Stage</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 font-mono">#{app.applicationNumber}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block">{app.student?.name}</span>
                        <span className="text-[10px] text-slate-400">{app.student?.registerNumber} • {app.student?.department?.code}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.type === 'OD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {app.type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <StageBadge stage={app.currentStage} />
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Department Distribution & Recently Added Staff/Students */}
        <div className="space-y-6">
          
          {/* Department Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Department Breakdown</h3>
              <Link to="/admin/departments" className="text-xs font-bold text-blue-600 hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {departmentStats.map((dept) => (
                <div key={dept.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{dept.name} ({dept.code})</span>
                    <span className="text-blue-600">{dept.studentCount} Students</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Staff Members: {dept.staffCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Added Staff */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Recent Staff</h3>
              <Link to="/admin/staff" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-2">
              {recentlyAddedStaff.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-bold text-slate-800 block">{s.name}</span>
                    <span className="text-[10px] text-slate-400">{s.employeeId} • {s.department?.code}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                    {s.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
