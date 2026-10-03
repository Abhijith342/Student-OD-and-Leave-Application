import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import { 
  PhoneCall, 
  UserCheck2, 
  UserCheck,
  CheckCircle, 
  XCircle,
  Clock, 
  Send 
} from 'lucide-react';

export default function ClassAdvisorDashboard() {
  const [activeTab, setActiveTab] = useState('advisor'); // 'advisor' | 'tutor'
  const [advisorApps, setAdvisorApps] = useState([]);
  const [tutorApps, setTutorApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Advisor Parent Conf state
  const [parentModalApp, setParentModalApp] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [remarks, setRemarks] = useState('');

  // Tutor Review state
  const [reviewModalApp, setReviewModalApp] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  
  const [processing, setProcessing] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const [advisorRes, tutorRes] = await Promise.allSettled([
        apiRequest('/applications/advisor'),
        apiRequest('/applications/tutor')
      ]);

      if (advisorRes.status === 'fulfilled') setAdvisorApps(advisorRes.value.data.applications);
      if (tutorRes.status === 'fulfilled') setTutorApps(tutorRes.value.data.applications);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const pendingAdvisorApps = advisorApps.filter(a => a.currentStage === 'ADVISOR_PENDING');
  const forwardedAdvisorApps = advisorApps.filter(a => a.currentStage !== 'ADVISOR_PENDING');

  const pendingTutorApps = tutorApps.filter(a => a.currentStage === 'TUTOR_PENDING');
  const processedTutorApps = tutorApps.filter(a => a.currentStage !== 'TUTOR_PENDING');

  const handleConfirmAndForward = async () => {
    if (!parentModalApp) return;
    setProcessing(true);
    try {
      await apiRequest(`/applications/${parentModalApp.id}/parent-confirmation`, {
        method: 'POST',
        body: JSON.stringify({ isConfirmed, remarks }),
      });
      setParentModalApp(null);
      setRemarks('');
      fetchApplications();
    } catch (err) {
      alert(err.message || 'Failed to record parent confirmation.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTutorReview = async () => {
    if (!reviewModalApp) return;
    setProcessing(true);
    try {
      await apiRequest(`/applications/${reviewModalApp.id}/tutor/review`, {
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

  return (
    <div className="space-y-6">
      {/* Role Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('advisor')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-colors flex items-center space-x-2 ${
            activeTab === 'advisor'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>📞 Class Advisor Parent Confirmation ({pendingAdvisorApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tutor')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-colors flex items-center space-x-2 ${
            activeTab === 'tutor'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>📋 Tutor Review Queue ({pendingTutorApps.length})</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck2 className="w-4 h-4" />
            <span>{activeTab === 'advisor' ? 'Class Advisor Portal' : 'Tutor Portal'}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {activeTab === 'advisor' ? 'Parent Confirmation & Forward Queue' : 'Tutor Approval Queue'}
          </h2>
          <p className="text-xs text-slate-500">
            {activeTab === 'advisor'
              ? 'Record parent telephonic confirmation & forward applications to HOD'
              : 'Review applications for your assigned tutored students'}
          </p>
        </div>

        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-blue-600 block">Pending Action</span>
          <span className="text-lg font-black text-blue-800">
            {activeTab === 'advisor' ? pendingAdvisorApps.length : pendingTutorApps.length}
          </span>
        </div>
      </div>

      {/* ADVISOR TAB VIEW */}
      {activeTab === 'advisor' && (
        <>
          {/* Pending Parent Confirmations Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-blue-50/40 flex items-center justify-between">
              <h3 className="font-bold text-blue-900 text-sm flex items-center space-x-2">
                <PhoneCall className="w-4 h-4 text-blue-600" />
                <span>Pending Parent Confirmations ({pendingAdvisorApps.length})</span>
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading queue...</div>
            ) : pendingAdvisorApps.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-800">All parent confirmations complete!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingAdvisorApps.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">#{app.applicationNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {app.type}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{app.student?.name}</span>
                        <span className="text-xs text-slate-400">({app.student?.registerNumber})</span>
                      </div>

                      <p className="text-xs text-slate-700">
                        <strong>Reason:</strong> {app.reason}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-200">
                          ✓ Tutor Approved by {app.approvalHistories?.find(h => h.role === 'TUTOR')?.staff?.name || 'Tutor'}
                        </div>

                        <div className="text-[11px] text-blue-900 font-bold bg-blue-50 px-2.5 py-1 rounded-md inline-flex items-center space-x-1 border border-blue-200">
                          <PhoneCall className="w-3 h-3 text-blue-600" />
                          <span>Parent Phone: <strong>{app.student?.parentPhone || 'Not Available'}</strong></span>
                        </div>

                        {app.student?.parentPhone && (
                          <a
                            href={`tel:${app.student.parentPhone}`}
                            className="text-[11px] text-white font-bold bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded-md inline-flex items-center space-x-1 shadow-xs"
                          >
                            <span>Call Now</span>
                          </a>
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
                          setParentModalApp(app);
                          setIsConfirmed(true);
                          setRemarks('');
                        }}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Confirm Parent & Forward to HOD</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Forwarded Applications List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Applications Forwarded to HOD</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">App ID</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Parent Status</th>
                    <th className="p-3.5">Current Stage</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forwardedAdvisorApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold">#{app.applicationNumber}</td>
                      <td className="p-3.5 font-medium">{app.student?.name}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.parentConfirmation?.isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {app.parentConfirmation?.isConfirmed ? 'Confirmed' : 'Not Confirmed'}
                        </span>
                      </td>
                      <td className="p-3.5"><StageBadge stage={app.currentStage} /></td>
                      <td className="p-3.5 text-right">
                        <button onClick={() => setSelectedApp(app)} className="px-3 py-1 bg-slate-100 font-bold rounded">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TUTOR TAB VIEW */}
      {activeTab === 'tutor' && (
        <>
          {/* Pending Tutor Applications */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-amber-50/40 flex items-center justify-between">
              <h3 className="font-bold text-amber-900 text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Applications Awaiting Your Tutor Review ({pendingTutorApps.length})</span>
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading queue...</div>
            ) : pendingTutorApps.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-800">All tutor reviews complete!</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending OD or Leave applications in your queue.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingTutorApps.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">#{app.applicationNumber}</span>
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
                        <strong>Dates:</strong> {new Date(app.fromDate).toLocaleDateString()} to {new Date(app.toDate).toLocaleDateString()}
                      </p>
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
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          setReviewModalApp(app);
                          setReviewAction('REJECT');
                          setRemarks('');
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
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

          {/* Processed Tutor History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Recently Processed Applications</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">App ID</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Current Stage</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedTutorApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold">#{app.applicationNumber}</td>
                      <td className="p-3.5 font-medium">{app.student?.name} ({app.student?.registerNumber})</td>
                      <td className="p-3.5"><span className="font-bold text-blue-600">{app.type}</span></td>
                      <td className="p-3.5"><StageBadge stage={app.currentStage} /></td>
                      <td className="p-3.5"><StatusBadge status={app.status} /></td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold rounded"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Parent Confirmation Modal */}
      {parentModalApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <PhoneCall className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Parent Confirmation - #{parentModalApp.applicationNumber}
              </h3>
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1.5">
              <p><strong>Student:</strong> {parentModalApp.student?.name} ({parentModalApp.student?.registerNumber})</p>
              <p><strong>Reason:</strong> {parentModalApp.reason}</p>
              <div className="pt-2 flex items-center justify-between border-t border-blue-200/60">
                <span className="font-bold text-blue-950 text-sm flex items-center space-x-1.5">
                  <PhoneCall className="w-4 h-4 text-blue-600" />
                  <span>Parent Contact Phone: <strong className="text-blue-700 underline text-base font-mono">{parentModalApp.student?.parentPhone || 'Not Available'}</strong></span>
                </span>
                {parentModalApp.student?.parentPhone && (
                  <a
                    href={`tel:${parentModalApp.student.parentPhone}`}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center space-x-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Parent</span>
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Parent Contact Confirmation Status *
              </label>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="parentConf"
                    checked={isConfirmed === true}
                    onChange={() => setIsConfirmed(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-xs font-bold text-emerald-700">Confirmed (Spoke with parent/guardian)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="parentConf"
                    checked={isConfirmed === false}
                    onChange={() => setIsConfirmed(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-xs font-bold text-rose-700">Not Confirmed</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Advisor Remarks / Telephonic Confirmation Notes
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Telephonic call made to student parent at 10:30 AM. Parent confirmed OD participation."
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setParentModalApp(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAndForward}
                disabled={processing}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{processing ? 'Processing...' : 'Confirm & Forward to HOD'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutor Review Modal */}
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
                Tutor Remarks
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter approval or rejection remarks..."
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
                onClick={handleTutorReview}
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

      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
