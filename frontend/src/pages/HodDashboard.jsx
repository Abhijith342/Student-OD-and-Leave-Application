import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import { Building2, CheckCircle, XCircle, Clock, Send, ShieldCheck } from 'lucide-react';

export default function HodDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewModalApp, setReviewModalApp] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [processing, setProcessing] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/applications/hod');
      setApplications(res.data.applications);
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
  const approvedApps = applications.filter(a => a.status === 'APPROVED' || a.currentStage === 'PRINCIPAL_PENDING' || a.currentStage === 'COMPLETED');
  const rejectedApps = applications.filter(a => a.status === 'REJECTED');

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
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>HOD Portal • AI & DS Department</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Head of Department Approval Portal</h2>
          <p className="text-xs text-slate-500">Review department-wide OD & Leave applications with full audit verification</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending HOD</span>
            <span className="text-lg font-black text-amber-700">{pendingApps.length}</span>
          </div>
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Approved</span>
            <span className="text-lg font-black text-emerald-700">{approvedApps.length}</span>
          </div>
        </div>
      </div>

      {/* Pending HOD Queue */}
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
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingApps.map((app) => (
              <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
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
                    <strong>Reason:</strong> {app.reason}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Tutor Approved
                    </span>
                    <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                      ✓ Parent Confirmed ({app.parentConfirmation?.isConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Audit Details
                  </button>

                  <button
                    onClick={() => {
                      setReviewModalApp(app);
                      setReviewAction('APPROVE');
                      setRemarks('');
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve ({app.type === 'OD' ? 'Forward to Principal' : 'Final Approve'})</span>
                  </button>

                  <button
                    onClick={() => {
                      setReviewModalApp(app);
                      setReviewAction('REJECT');
                      setRemarks('');
                    }}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
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

      {/* All Department Applications */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">All Department Applications Audit Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">App ID</th>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Current Stage</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold">#{app.applicationNumber}</td>
                  <td className="p-3.5 font-medium">{app.student?.name} ({app.student?.registerNumber})</td>
                  <td className="p-3.5"><span className="font-bold text-blue-600">{app.type}</span></td>
                  <td className="p-3.5"><StageBadge stage={app.currentStage} /></td>
                  <td className="p-3.5"><StatusBadge status={app.status} /></td>
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

      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
