import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import BatchODTracker from '../components/BatchODTracker';
import { 
  UserCheck, 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send,
  Trophy,
  Layers,
  Search,
  Filter,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  History,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { calculateDurationDays, formatDateRange } from '../utils/dateUtils';

export default function TutorDashboard() {
  // activeTab: 'batchOD' (Primary) | 'queues' (Request Queues) | 'all' (Available OD/Leave Directory)
  const [activeTab, setActiveTab] = useState('batchOD');
  
  // queueSubTab: 'tutor' | 'advisor' | 'history'
  const [queueSubTab, setQueueSubTab] = useState('tutor');

  const [tutorApps, setTutorApps] = useState([]);
  const [advisorApps, setAdvisorApps] = useState([]);
  const [availableApps, setAvailableApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // OD Scope for Tracker: 'all' (Department) or 'mine' (My Tutored Students)
  const [odScope, setOdScope] = useState('all');

  // Search & Filter for All Available Applications Directory
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'OD' | 'LEAVE'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  // Review modal state
  const [reviewModalApp, setReviewModalApp] = useState(null);
  const [reviewRole, setReviewRole] = useState('tutor'); // 'tutor' | 'advisor'
  const [remarks, setRemarks] = useState('');
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [processing, setProcessing] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const [tutorRes, advisorRes, availableRes] = await Promise.allSettled([
        apiRequest('/applications/tutor'),
        apiRequest('/applications/advisor'),
        apiRequest('/applications/available')
      ]);

      if (tutorRes.status === 'fulfilled') setTutorApps(tutorRes.value.data.applications || []);
      if (advisorRes.status === 'fulfilled') setAdvisorApps(advisorRes.value.data.applications || []);
      if (availableRes.status === 'fulfilled') setAvailableApps(availableRes.value.data.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const pendingTutorApps = tutorApps.filter(a => a.currentStage === 'TUTOR_PENDING');
  const processedTutorApps = tutorApps.filter(a => a.currentStage !== 'TUTOR_PENDING');

  const pendingAdvisorApps = advisorApps.filter(a => a.currentStage === 'ADVISOR_PENDING');
  const processedAdvisorApps = advisorApps.filter(a => a.currentStage !== 'ADVISOR_PENDING');

  const totalPending = pendingTutorApps.length + pendingAdvisorApps.length;

  // OD Metrics
  const tutorODApps = useMemo(() => tutorApps.filter(a => a.type === 'OD'), [tutorApps]);
  const allDeptODApps = useMemo(() => availableApps.filter(a => a.type === 'OD'), [availableApps]);

  const uniqueAllDeptODStudents = useMemo(() => {
    return new Set(
      allDeptODApps
        .filter(a => a.status === 'APPROVED' || a.currentStage === 'COMPLETED' || a.currentStage === 'PRINCIPAL_PENDING')
        .map(a => a.studentId || a.student?.id || a.student?.registerNumber)
    ).size;
  }, [allDeptODApps]);

  // Filtered list of all available applications
  const filteredAvailableApps = useMemo(() => {
    return availableApps.filter(app => {
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

      // Search term
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
  }, [availableApps, typeFilter, statusFilter, searchTerm]);

  const handleReview = async () => {
    if (!reviewModalApp) return;
    setProcessing(true);
    try {
      const endpoint = reviewRole === 'advisor'
        ? `/applications/${reviewModalApp.id}/advisor/review`
        : `/applications/${reviewModalApp.id}/tutor/review`;

      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ action: reviewAction, remarks }),
      });
      setReviewModalApp(null);
      setRemarks('');
      fetchApplications();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const scrollToQueues = () => {
    const el = document.getElementById('request-queues-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveTab('queues');
    }
  };

  // Reusable Request Queues Component
  const renderRequestQueuesSection = () => {
    const hasAdvisorRole = advisorApps.length > 0;
    const currentQueueItems = queueSubTab === 'advisor' ? pendingAdvisorApps : pendingTutorApps;
    const currentRole = queueSubTab === 'advisor' ? 'advisor' : 'tutor';
    const processedHistory = queueSubTab === 'advisor' ? processedAdvisorApps : processedTutorApps;

    return (
      <div id="request-queues-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <span>Review & Approval Section</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Staff Request Queues
            </h3>
            <p className="text-xs text-slate-500">
              Dedicated queue for reviewing, endorsing, and approving student OD and Leave requests
            </p>
          </div>

          {/* Queue Sub-Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <button
              onClick={() => setQueueSubTab('tutor')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
                queueSubTab === 'tutor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Tutor Queue</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                queueSubTab === 'tutor' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {pendingTutorApps.length}
              </span>
            </button>

            {hasAdvisorRole && (
              <button
                onClick={() => setQueueSubTab('advisor')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
                  queueSubTab === 'advisor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Advisor Queue</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  queueSubTab === 'advisor' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {pendingAdvisorApps.length}
                </span>
              </button>
            )}

            <button
              onClick={() => setQueueSubTab('history')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
                queueSubTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                queueSubTab === 'history' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {processedTutorApps.length + (hasAdvisorRole ? processedAdvisorApps.length : 0)}
              </span>
            </button>
          </div>
        </div>

        {/* Content of Request Queues */}
        {queueSubTab === 'history' ? (
          /* Processed History Table */
          <div className="overflow-x-auto">
            <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Recently Processed Tutored & Advised Applications
              </span>
              <span className="text-xs text-slate-500">
                Showing {processedTutorApps.length + processedAdvisorApps.length} records
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">App ID</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Reason / Event</th>
                  <th className="p-3.5">Current Stage</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...processedTutorApps, ...processedAdvisorApps].length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      No processed applications yet.
                    </td>
                  </tr>
                ) : (
                  [...processedTutorApps, ...processedAdvisorApps].map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-900">#{app.applicationNumber}</td>
                      <td className="p-3.5 font-medium">
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
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Active Pending Queue List */
          <div>
            {loading ? (
              <div className="p-10 text-center text-xs text-slate-500">Loading queue applications...</div>
            ) : currentQueueItems.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-800">
                  {queueSubTab === 'advisor'
                    ? 'All Class Advisor reviews complete!'
                    : 'All Tutor reviews complete!'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  There are currently no pending OD or Leave applications in this queue.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentQueueItems.map((app) => (
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
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
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

                      {/* Verification Status Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {queueSubTab === 'advisor' && (
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                            <span>✓</span>
                            <span>Tutor Approved by {app.approvalHistories?.find(h => h.role === 'TUTOR')?.staff?.name || 'Assigned Tutor'}</span>
                          </span>
                        )}
                        {app.documentPath && (
                          <span className="text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                            <span>📎</span>
                            <span>Proof Attached</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
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
                          setReviewRole(currentRole);
                          setRemarks('');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1 transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          setReviewModalApp(app);
                          setReviewAction('REJECT');
                          setReviewRole(currentRole);
                          setRemarks('');
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
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
      {/* Top Primary Navigation Bar */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
        {/* PRIMARY TAB: Batch OD & Hackathons */}
        <button
          onClick={() => setActiveTab('batchOD')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'batchOD'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Batch OD & Hackathons (Primary)</span>
        </button>

        {/* DEDICATED QUEUE TAB: Request Queues */}
        <button
          onClick={() => setActiveTab('queues')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'queues'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Request Queues</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            totalPending > 0
              ? activeTab === 'queues' ? 'bg-amber-400 text-amber-950' : 'bg-amber-500 text-white'
              : activeTab === 'queues' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {totalPending}
          </span>
        </button>

        {/* DIRECTORY TAB: Available OD / Leave */}
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All OD / Leave ({availableApps.length})</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Staff Portal • Batch OD Command Center</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {activeTab === 'batchOD'
              ? 'Batch On-Duty (OD) & Hackathons Hub'
              : activeTab === 'queues'
              ? 'Staff Review & Approval Queues'
              : 'Available Student OD & Leave Applications'}
          </h2>
          <p className="text-xs text-slate-500">
            {activeTab === 'batchOD'
              ? 'Real-time monitoring of students attending hackathons, duration, and host venues across the department'
              : activeTab === 'queues'
              ? 'Review pending student OD and Leave applications for your tutored students and advised class'
              : 'Complete directory of student OD & Leave applications across the department'}
          </p>
        </div>

        {/* Quick Stat Action Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Confirmed on OD */}
          <button
            onClick={() => setActiveTab('batchOD')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-center border transition-all cursor-pointer ${
              activeTab === 'batchOD'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
            }`}
            title="Click to view Batch OD Tracker"
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
              {uniqueAllDeptODStudents}
            </span>
          </button>

          {/* Pending in Queues */}
          <button
            onClick={() => {
              if (activeTab === 'batchOD') scrollToQueues();
              else setActiveTab('queues');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-center border transition-all cursor-pointer ${
              totalPending > 0
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title="Click to view Request Queues"
          >
            <span className="text-[10px] uppercase font-bold text-amber-600 flex items-center justify-center space-x-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Awaiting Review</span>
            </span>
            <span className="text-base sm:text-lg font-black text-amber-700 flex items-center justify-center space-x-1">
              {totalPending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              <span>{totalPending}</span>
            </span>
          </button>

          {/* Total Available */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-center border transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Click to view All Applications"
          >
            <span className={`text-[10px] uppercase font-bold block ${
              activeTab === 'all' ? 'text-blue-100' : 'text-slate-500'
            }`}>
              Total Records
            </span>
            <span className={`text-base sm:text-lg font-black ${
              activeTab === 'all' ? 'text-white' : 'text-slate-700'
            }`}>
              {availableApps.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: BATCH OD & HACKATHONS (PRIMARY) */}
      {activeTab === 'batchOD' && (
        <div className="space-y-6">
          {/* Pending Action Notification Banner (if any pending) */}
          {totalPending > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    You have {totalPending} application{totalPending > 1 ? 's' : ''} awaiting review in your Request Queues
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {pendingTutorApps.length > 0 && `${pendingTutorApps.length} pending Tutor review`}
                    {pendingTutorApps.length > 0 && pendingAdvisorApps.length > 0 && ' • '}
                    {pendingAdvisorApps.length > 0 && `${pendingAdvisorApps.length} pending Advisor review`}
                  </p>
                </div>
              </div>
              <button
                onClick={scrollToQueues}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1 shrink-0"
              >
                <span>Jump to Request Queues</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* OD Scope Selector */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>OD Scope View:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setOdScope('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  odScope === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Department ODs ({allDeptODApps.length})
              </button>
              <button
                onClick={() => setOdScope('mine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  odScope === 'mine'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                My Tutored Students ({tutorODApps.length})
              </button>
            </div>
          </div>

          {/* Primary Batch OD & Hackathons Tracker */}
          <BatchODTracker
            applications={odScope === 'all' ? allDeptODApps : tutorODApps}
            batchTitle={odScope === 'all' ? "Department-Wide On-Duty (OD) & Hackathons" : "Tutor Batch On-Duty (OD) & Hackathons"}
            batchSubtitle={odScope === 'all' 
              ? "Live status of hackathons, dates, duration in days, and venues for all students across the department" 
              : "Live status of hackathons, dates, duration in days, and venues for students in your assigned tutored batch"}
            onViewDetails={setSelectedApp}
            roleName="TUTOR"
          />

          {/* THEN: Dedicated Request Queues Section */}
          <div className="pt-2">
            {renderRequestQueuesSection()}
          </div>
        </div>
      )}

      {/* VIEW 2: DEDICATED REQUEST QUEUES SECTION FOCUS */}
      {activeTab === 'queues' && (
        <div className="space-y-4">
          {renderRequestQueuesSection()}
        </div>
      )}

      {/* VIEW 3: ALL AVAILABLE APPLICATIONS DIRECTORY */}
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
                All ({availableApps.length})
              </button>
              <button
                onClick={() => setTypeFilter('OD')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === 'OD' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OD ({availableApps.filter(a => a.type === 'OD').length})
              </button>
              <button
                onClick={() => setTypeFilter('LEAVE')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === 'LEAVE' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Leave ({availableApps.filter(a => a.type === 'LEAVE').length})
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
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Available Applications Across Department
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Showing {filteredAvailableApps.length} of {availableApps.length}
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading applications...</div>
            ) : filteredAvailableApps.length === 0 ? (
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
                      <th className="p-3.5">Workflow Stage</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAvailableApps.map((app) => (
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

      {/* Review Modal */}
      {reviewModalApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {reviewAction === 'APPROVE' ? 'Approve Application' : 'Reject Application'} (#{reviewModalApp.applicationNumber})
            </h3>

            <p className="text-xs text-slate-600">
              Student: <strong>{reviewModalApp.student?.name}</strong> ({reviewModalApp.student?.registerNumber})
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {reviewRole === 'advisor' ? 'Class Advisor Remarks' : 'Tutor Remarks'}
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks..."
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
