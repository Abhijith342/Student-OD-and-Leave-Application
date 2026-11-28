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
  Layers,
  History,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { calculateDurationDays, formatDateRange } from '../utils/dateUtils';

export default function HodDashboard() {
  // activeTab: 'batchOD' (Primary) | 'queues' (HOD Request Queues) | 'all' (All Department Applications)
  const [activeTab, setActiveTab] = useState('batchOD');
  
  // queueSubTab: 'pending' | 'history'
  const [queueSubTab, setQueueSubTab] = useState('pending');

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
  const processedApps = applications.filter(a => a.currentStage !== 'HOD_PENDING');

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

  const scrollToQueues = () => {
    const el = document.getElementById('hod-request-queues');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveTab('queues');
    }
  };

  // Reusable HOD Request Queues Section
  const renderHodRequestQueues = () => {
    return (
      <div id="hod-request-queues" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Department Authorization Queue</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              HOD Decision & Review Queue
            </h3>
            <p className="text-xs text-slate-500">
              Department-level authorization for tutor-approved and class advisor-forwarded student applications
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setQueueSubTab('pending')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
                queueSubTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Queue</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                queueSubTab === 'pending' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {pendingApps.length}
              </span>
            </button>

            <button
              onClick={() => setQueueSubTab('history')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
                queueSubTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Decisions History</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                queueSubTab === 'history' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {processedApps.length}
              </span>
            </button>
          </div>
        </div>

        {/* Sub-tab Content */}
        {queueSubTab === 'history' ? (
          /* Processed History */
          <div className="overflow-x-auto">
            <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Department Decisions History
              </span>
              <span className="text-xs text-slate-500">
                Showing {processedApps.length} applications
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">App ID</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Event / Reason</th>
                  <th className="p-3.5">Workflow Stage</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedApps.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      No processed department applications yet.
                    </td>
                  </tr>
                ) : (
                  processedApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-900">#{app.applicationNumber}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{app.student?.name}</div>
                        <div className="text-[11px] text-slate-500">{app.student?.registerNumber}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.type === 'OD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {app.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 max-w-xs truncate" title={app.eventName || app.reason}>
                        {app.eventName || app.reason}
                      </td>
                      <td className="p-3.5 whitespace-nowrap"><StageBadge stage={app.currentStage} /></td>
                      <td className="p-3.5 whitespace-nowrap"><StatusBadge status={app.status} /></td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Pending HOD Queue */
          <div>
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading queue...</div>
            ) : pendingApps.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-800">No applications pending HOD approval!</p>
                <p className="text-xs text-slate-400 mt-1">All department submissions have been reviewed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingApps.map((app) => (
                  <div key={app.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">#{app.applicationNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.type === 'OD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {app.type}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{app.student?.name}</span>
                        <span className="text-xs text-slate-500">({app.student?.registerNumber})</span>
                        {app.student?.section && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            • Sec {app.student?.section?.name}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Reason / Event: </span>
                        {app.eventName ? (
                          <span>
                            <strong className="text-blue-700">{app.eventName}</strong> — {app.reason}
                          </span>
                        ) : (
                          app.reason
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>Dates: {formatDateRange(app.fromDate, app.toDate)}</span>
                          <span className="font-bold text-indigo-600">({calculateDurationDays(app.fromDate, app.toDate)})</span>
                        </div>

                        {app.venue && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Venue: {app.venue}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Tutor Approved
                        </span>
                        <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          ✓ Advisor Forwarded
                        </span>
                        {app.documentPath && (
                          <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            📎 Document Attached
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => {
                          setReviewModalApp(app);
                          setReviewAction('APPROVE');
                          setRemarks('');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1 transition-all"
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
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1 transition-all"
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
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
        {/* PRIMARY TAB: Department OD & Hackathons */}
        <button
          onClick={() => setActiveTab('batchOD')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'batchOD'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Department OD & Hackathons (Primary)</span>
        </button>

        {/* DEDICATED QUEUE TAB: HOD Request Queue */}
        <button
          onClick={() => setActiveTab('queues')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'queues'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>HOD Request Queue</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            pendingApps.length > 0
              ? activeTab === 'queues' ? 'bg-amber-400 text-amber-950' : 'bg-amber-500 text-white'
              : activeTab === 'queues' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {pendingApps.length}
          </span>
        </button>

        {/* DIRECTORY TAB: All Department Applications */}
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Department Applications ({applications.length})</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Head of Department Portal • Batch OD Command Center</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {activeTab === 'batchOD'
              ? 'Department On-Duty (OD) & Hackathons Hub'
              : activeTab === 'queues'
              ? 'Head of Department Approval Portal'
              : 'Department Applications Central & Audit Log'}
          </h2>
          <p className="text-xs text-slate-500">
            {activeTab === 'batchOD'
              ? 'Real-time overview of students going to hackathons, dates, duration in days, and venues across the department'
              : activeTab === 'queues'
              ? 'Review department-wide OD & Leave applications with verified tutor endorsements'
              : 'Visit and audit complete historical and live records of all department applications'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Confirmed on OD */}
          <button
            onClick={() => setActiveTab('batchOD')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-center border transition-all cursor-pointer ${
              activeTab === 'batchOD'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
            }`}
            title="Click to view Department On-Duty Tracker"
          >
            <span className={`text-[10px] uppercase font-bold flex items-center justify-center space-x-1 ${
              activeTab === 'batchOD' ? 'text-indigo-200' : 'text-indigo-600'
            }`}>
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Students on OD</span>
            </span>
            <span className={`text-base sm:text-lg font-black ${
              activeTab === 'batchOD' ? 'text-white' : 'text-indigo-700'
            }`}>
              {uniqueHodODStudents}
            </span>
          </button>

          {/* Pending in Queue */}
          <button
            onClick={() => {
              if (activeTab === 'batchOD') scrollToQueues();
              else setActiveTab('queues');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-center border transition-all cursor-pointer ${
              pendingApps.length > 0
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title="Click to view HOD Queue"
          >
            <span className="text-[10px] uppercase font-bold text-amber-600 flex items-center justify-center space-x-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Pending HOD</span>
            </span>
            <span className="text-base sm:text-lg font-black text-amber-700 flex items-center justify-center space-x-1">
              {pendingApps.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              <span>{pendingApps.length}</span>
            </span>
          </button>

          {/* Approved Total */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-center border transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
            }`}
            title="Click to view All Department Records"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">
              Department Total
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-700">
              {applications.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: BATCH OD & HACKATHONS (PRIMARY) */}
      {activeTab === 'batchOD' && (
        <div className="space-y-6">
          {/* Action Notification Banner */}
          {pendingApps.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    You have {pendingApps.length} application{pendingApps.length > 1 ? 's' : ''} awaiting your HOD decision
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Forwarded with tutor approvals and advisor endorsements ready for department sign-off
                  </p>
                </div>
              </div>
              <button
                onClick={scrollToQueues}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1 shrink-0"
              >
                <span>Jump to HOD Queue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Primary Batch OD & Hackathons Tracker */}
          <BatchODTracker
            applications={applications}
            batchTitle="Department-Wide On-Duty (OD) & Hackathons"
            batchSubtitle="Comprehensive real-time tracking of students going to hackathons, expos, and competitions across all department batches"
            onViewDetails={setSelectedApp}
            roleName="HOD"
          />

          {/* THEN: Dedicated HOD Request Queues Section */}
          <div className="pt-2">
            {renderHodRequestQueues()}
          </div>
        </div>
      )}

      {/* VIEW 2: DEDICATED QUEUES SECTION FOCUS */}
      {activeTab === 'queues' && (
        <div className="space-y-4">
          {renderHodRequestQueues()}
        </div>
      )}

      {/* VIEW 3: ALL DEPARTMENT APPLICATIONS AUDIT */}
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

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Complete Department Records Directory
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Showing {filteredApps.length} of {applications.length}
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading applications...</div>
            ) : filteredApps.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-700">No applications match your criteria</p>
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
                      <th className="p-3.5">Workflow Stage</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold font-mono text-slate-900">#{app.applicationNumber}</td>
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

      {/* Review Modal */}
      {reviewModalApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {reviewAction === 'APPROVE' ? 'Approve Application (HOD)' : 'Reject Application (HOD)'} (#{reviewModalApp.applicationNumber})
            </h3>

            <p className="text-xs text-slate-600">
              Student: <strong>{reviewModalApp.student?.name}</strong> ({reviewModalApp.student?.registerNumber})
            </p>

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
