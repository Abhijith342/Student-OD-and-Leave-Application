import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Link } from 'react-router-dom';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import { 
  FileCheck, 
  CalendarOff, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  const student = user?.studentProfile;

  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await apiRequest('/applications/my');
        setApplications(res.data.applications);
      } catch (err) {
        console.error('Failed to load student applications:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, []);

  const total = applications.length;
  const pending = applications.filter(a => a.status === 'PENDING').length;
  const approved = applications.filter(a => a.status === 'APPROVED' || a.currentStage === 'COMPLETED').length;
  const rejected = applications.filter(a => a.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Student Portal</span>
          </div>
          <h2 className="text-2xl font-black">Welcome back, {student?.name || user?.username}!</h2>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300 mt-2">
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              Reg No: <strong className="text-white">{student?.registerNumber}</strong>
            </span>
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              Roll No: <strong className="text-blue-300">{student?.rollNumber || '22AD001'}</strong>
            </span>
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              Dept: <strong className="text-white">{student?.department?.name || 'AI & DS'}</strong>
            </span>
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              Yr {student?.year} - Sec {student?.section}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Link
            to="/apply-od"
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>Apply for OD</span>
          </Link>
          <Link
            to="/apply-leave"
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-lg transition-all"
          >
            <CalendarOff className="w-4 h-4" />
            <span>Apply for Leave</span>
          </Link>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pending}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{approved}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{rejected}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Applications</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Applications Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Applications</h3>
            <p className="text-xs text-slate-500">Track and view live approval workflow progress</p>
          </div>
          <Link
            to="/my-applications"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-sm">No applications submitted yet</h4>
            <p className="text-xs text-slate-500 mt-1">Apply for On-Duty or Leave to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Application ID</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5">Current Stage</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.slice(0, 5).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">#{app.applicationNumber}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        app.type === 'OD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {app.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {new Date(app.fromDate).toLocaleDateString()} - {new Date(app.toDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <StageBadge stage={app.currentStage} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white font-bold text-slate-700 rounded-lg transition-colors"
                      >
                        Track & Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
