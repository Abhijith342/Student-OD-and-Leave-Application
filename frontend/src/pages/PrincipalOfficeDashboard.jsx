import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import { Shield, CheckCircle, Stamp, FileCheck, Sparkles } from 'lucide-react';

export default function PrincipalOfficeDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [completeModalApp, setCompleteModalApp] = useState(null);
  const [remarks, setRemarks] = useState('Final Principal Office Authorization Signature & Seal Applied.');
  const [processing, setProcessing] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/applications/principal-office');
      setApplications(res.data.applications);
    } catch (err) {
      console.error('Failed to load Principal Office applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const pendingApps = applications.filter(a => a.currentStage === 'PRINCIPAL_PENDING');
  const completedApps = applications.filter(a => a.currentStage === 'COMPLETED');

  const handleCompleteFinalStep = async () => {
    if (!completeModalApp) return;
    setProcessing(true);
    try {
      await apiRequest(`/applications/${completeModalApp.id}/principal-office/complete`, {
        method: 'POST',
        body: JSON.stringify({ remarks }),
      });
      setCompleteModalApp(null);
      fetchApplications();
    } catch (err) {
      alert(err.message || 'Principal Office final step failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Principal Office Portal</span>
          </div>
          <h2 className="text-2xl font-black">Principal Authorization & Seal Queue</h2>
          <p className="text-xs text-slate-300">Final processing for HOD-approved On-Duty (OD) applications</p>
        </div>

        <div className="px-4 py-2 bg-blue-600/30 border border-blue-400/40 rounded-xl text-center backdrop-blur-xs">
          <span className="text-[10px] uppercase font-bold text-blue-300 block">Ready for Principal Seal</span>
          <span className="text-xl font-black text-white">{pendingApps.length}</span>
        </div>
      </div>

      {/* Pending Final Authorization Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-blue-50/30 flex items-center justify-between">
          <h3 className="font-bold text-blue-900 text-sm flex items-center space-x-2">
            <Stamp className="w-4 h-4 text-blue-600" />
            <span>OD Applications Awaiting Final Principal Seal & Completion ({pendingApps.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading queue...</div>
        ) : pendingApps.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-sm text-slate-800">All Principal Office OD authorizations complete!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingApps.map((app) => (
              <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">#{app.applicationNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                      OD
                    </span>
                    <span className="text-xs font-bold text-slate-800">{app.student?.name}</span>
                    <span className="text-xs text-slate-400">({app.student?.registerNumber})</span>
                  </div>

                  <p className="text-xs text-slate-700">
                    <strong>Event & Venue:</strong> {app.eventName} @ {app.venue}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Tutor Approved
                    </span>
                    <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                      ✓ Parent Confirmed
                    </span>
                    <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                      ✓ HOD Approved
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    View Application
                  </button>

                  <button
                    onClick={() => setCompleteModalApp(app)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                  >
                    <Stamp className="w-4 h-4" />
                    <span>Apply Principal Seal & Complete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Applications */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Completed OD Applications Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">App ID</th>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Event</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold">#{app.applicationNumber}</td>
                  <td className="p-3.5 font-medium">{app.student?.name} ({app.student?.registerNumber})</td>
                  <td className="p-3.5 text-slate-700">{app.eventName}</td>
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

      {/* Apply Seal Confirmation Modal */}
      {completeModalApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <Stamp className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Principal Office Authorization - #{completeModalApp.applicationNumber}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Apply institutional Principal signature stamp and seal to finalize OD application for <strong>{completeModalApp.student?.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Authorization Remarks / Seal Notes
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setCompleteModalApp(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteFinalStep}
                disabled={processing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center space-x-1"
              >
                <FileCheck className="w-4 h-4" />
                <span>{processing ? 'Processing...' : 'Apply Seal & Complete OD'}</span>
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
