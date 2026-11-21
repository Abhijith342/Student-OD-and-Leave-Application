import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import BatchODTracker from '../components/BatchODTracker';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  ShieldCheck,
  Trophy,
  FileText,
  Search,
  Filter,
  Layers
} from 'lucide-react';
import { calculateDurationDays, formatDateRange } from '../utils/dateUtils';

export default function HodDashboard() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'od-tracker' | 'all'
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewModalApp, setReviewModalApp] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [processing, setProcessing] = useState(false);

  // Search & Filter for All Department Applications
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'OD' | 'LEAVE'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/applications/hod');
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error('Failed to load HOD applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const pendingApps = applications.filter(a => a.currentStage === 'HOD_PENDING');
  const approvedApps = applications.filter(
    a => a.status === 'APPROVED' || a.currentStage === 'PRINCIPAL_PENDING' || a.currentStage === 'COMPLETED'
  );
  const rejectedApps = applications.filter(a => a.status === 'REJECTED');

  // OD Metrics
  const hodODApps = useMemo(() => applications.filter(a => a.type === 'OD'), [applications]);
  const uniqueHodODStudents = useMemo(() => {
    return new Set(
      hodODApps
        .filter(a => a.status === 'APPROVED' || a.currentStage === 'COMPLETED' || a.currentStage === 'PRINCIPAL_PENDING')
        .map(a => a.studentId || a.student?.id || a.student?.registerNumber)
    ).size;
  }, [hodODApps]);

  // Filtered list of all applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Type filter
      if (typeFilter !== 'ALL' && app.type !== typeFilter) return false;

      // Status filter
      if (statusFilter === 'APPROVED') {
        const isApproved = app.status === 'APPROVED' || app.currentStage === 'COMPLETED' || app.currentStage === 'PRINCIPAL_PENDING';
        if (!isApproved) return false;
      } else if (statusFilter === 'PENDING') {
        const isPending = app.status === 'PENDING' && app.currentStage !== 'COMPLETED' && app.currentStage !== 'PRINCIPAL_PENDING';
        if (!isPending) return false;
      } else if (statusFilter === 'REJECTED') {
        if (app.status !== 'REJECTED') return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const studentName = (app.student?.name || '').toLowerCase();
        const regNo = (app.student?.registerNumber || '').toLowerCase();
        const rollNo = (app.student?.rollNumber || '').toLowerCase();
        const appNum = (app.applicationNumber || '').toLowerCase();
        const reason = (app.reason || '').toLowerCase();
        const eventName = (app.eventName || '').toLowerCase();
        const venue = (app.venue || '').toLowerCase();
        const tutorName = (app.student?.tutor?.name || '').toLowerCase();

        return (
          studentName.includes(term) ||
          regNo.includes(term) ||
          rollNo.includes(term) ||
          appNum.includes(term) ||
          reason.includes(term) ||
          eventName.includes(term) ||
          venue.includes(term) ||
          tutorName.includes(term)
        );
      }

      return true;
    });
  }, [applications, typeFilter, statusFilter, searchTerm]);

  const handleReview = async () => {
    if (!reviewModalApp) return;
    setProcessing(true);
    try {
      await apiRequest(`/applications/${reviewModalApp.id}/hod/review`, {
        method: 'POST',
        body: JSON.stringify({ action: reviewAction, remarks }),
      });
      setReviewModalApp(null);
      setRemarks('');
      fetchApplications();
    } catch (err) {
      alert(err.message || 'HOD review failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-colors flex items-center space-x-2 shrink-0 ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending HOD Decision ({pendingApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('od-tracker')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-colors flex items-center space-x-2 shrink-0 ${
            activeTab === 'od-tracker'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Department OD & Hackathons ({hodODApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-colors flex items-center space-x-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Department Applications ({applications.length})</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>HOD Portal • AI & DS Department</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {activeTab === 'od-tracker'
              ? 'Department On-Duty (OD) & Hackathon Tracking'
              : activeTab === 'all'
              ? 'Department Applications Central & Audit Log'
              : 'Head of Department Approval Portal'}
          </h2>
          <p className="text-xs text-slate-500">
            {activeTab === 'od-tracker'
              ? 'Monitor students going to hackathons, dates, duration, and host venues across the department'
              : activeTab === 'all'
              ? 'Visit and audit complete historical and live records of all department applications'
              : 'Review department-wide OD & Leave applications with full audit verification'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="px-3 sm:px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending HOD</span>
            <span className="text-base sm:text-lg font-black text-amber-700">{pendingApps.length}</span>
          </div>

          <div className="px-3 sm:px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Approved</span>
            <span className="text-base sm:text-lg font-black text-emerald-700">{approvedApps.length}</span>
          </div>

          <button
            onClick={() => setActiveTab('od-tracker')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-center border transition-all cursor-pointer ${
              activeTab === 'od-tracker'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
            }`}
            title="Click to view Department On-Duty & Hackathon Tracker"
          >
            <span className={`text-[10px] uppercase font-bold flex items-center justify-center space-x-1 ${
              activeTab === 'od-tracker' ? 'text-indigo-200' : 'text-indigo-600'
            }`}>
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Students on OD</span>
            </span>
            <span className={`text-base sm:text-lg font-black ${
              activeTab === 'od-tracker' ? 'text-white' : 'text-indigo-700'
            }`}>
              {uniqueHodODStudents}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: PENDING HOD QUEUE */}
      {activeTab === 'pending' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-amber-50/40 flex items-center justify-between">
              <h3 className="font-bold text-amber-900 text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Pending HOD Decision ({pendingApps.length})</span>
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading queue...</div>
            ) : pendingApps.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-800">No applications pending HOD approval!</p>
                <p className="text-xs text-slate-400 mt-0.5">All pending department submissions have been reviewed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingApps.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm font-mono">#{app.applicationNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.type === 'OD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {app.type}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{app.student?.name}</span>
                        <span className="text-xs text-slate-400">({app.student?.registerNumber})</span>
                      </div>

                      <p className="text-xs text-slate-700">
                        <strong>Reason:</strong> {app.eventName ? `${app.eventName} - ${app.reason}` : app.reason}
                      </p>

                      <p className="text-xs text-slate-500">
                        <strong>Dates:</strong> {formatDateRange(app.fromDate, app.toDate)}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Tutor Approved
                        </span>
                        <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          ✓ Advisor Forwarded
                        </span>
                        {app.type === 'LEAVE' && (
                          <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            ✓ Parent Confirmed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => {
                          setReviewModalApp(app);
                          setReviewAction('APPROVE');
                          setRemarks('');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>HOD Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          setReviewModalApp(app);
                          setReviewAction('REJECT');
                          setRemarks('');
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>HOD Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: DEPARTMENT OD TRACKER */}
      {activeTab === 'od-tracker' && (
        <BatchODTracker
          applications={applications}
          batchTitle="Department On-Duty (OD) & Hackathon Tracker"
          batchSubtitle="Comprehensive real-time tracking of students going to hackathons, expos, and competitions across all department batches"
          onViewDetails={setSelectedApp}
          roleName="HOD"
        />
      )}

      {/* TAB 3: ALL DEPARTMENT APPLICATIONS AUDIT */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, reg number, event, venue, or #App ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Type Filters */}
            <div className="flex items-center space-x-1.5 shrink-0 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({applications.length})
              </button>
              <button
                onClick={() => setTypeFilter('OD')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === 'OD' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OD ({applications.filter(a => a.type === 'OD').length})
              </button>
              <button
                onClick={() => setTypeFilter('LEAVE')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === 'LEAVE' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Leave ({applications.filter(a => a.type === 'LEAVE').length})
              </button>
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved / Completed</option>
              <option value="PENDING">Pending Review</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  All Department Applications Audit Log
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Showing {filteredApps.length} of {applications.length} Records
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading applications...</div>
            ) : filteredApps.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-700">No applications found</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing your search or changing filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">App ID</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Event / Reason & Venue</th>
                      <th className="p-3.5">Dates & Duration</th>
                      <th className="p-3.5">Current Stage</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold font-mono">#{app.applicationNumber}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{app.student?.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {app.student?.registerNumber} {app.student?.rollNumber ? `• ${app.student.rollNumber}` : ''}
                          </div>
                          {app.student?.tutor?.name && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Tutor: {app.student.tutor.name}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.type === 'OD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {app.type}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="font-semibold text-slate-800 truncate" title={app.eventName || app.reason}>
                            {app.eventName || app.reason}
                          </div>
                          {app.venue && (
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5 truncate" title={app.venue}>
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{app.venue}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {formatDateRange(app.fromDate, app.toDate)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold">
                            {calculateDurationDays(app.fromDate, app.toDate)}
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <StageBadge stage={app.currentStage} />
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors border border-blue-200"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HOD Review Modal */}
      {reviewModalApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              HOD Decision - #{reviewModalApp.applicationNumber}
            </h3>

            <p className="text-xs text-slate-600">
              Student: <strong>{reviewModalApp.student?.name}</strong> ({reviewModalApp.student?.registerNumber})
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
              <p><strong>Type:</strong> {reviewModalApp.type}</p>
              <p><strong>Workflow Destination:</strong> {reviewAction === 'APPROVE' ? (reviewModalApp.type === 'OD' ? 'Moves to Principal Office for Seal' : 'Final Approved (Completed)') : 'Rejected'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                HOD Remarks
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter HOD remarks..."
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setReviewModalApp(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={processing}
                className={`px-5 py-2 text-white text-xs font-bold rounded-lg ${
                  reviewAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processing ? 'Processing...' : reviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
