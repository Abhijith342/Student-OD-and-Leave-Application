import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { 
  KeyRound, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  AlertCircle, 
  Phone, 
  Mail, 
  User, 
  Calendar,
  ShieldCheck,
  Building2,
  RefreshCw
} from 'lucide-react';

export default function AdminPasswordResets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal / Confirm state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    request: null,
    action: 'RESET', // or 'REJECT'
    remarks: ''
  });

  // Manual reset state
  const [manualRegNo, setManualRegNo] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(null);
  const [manualError, setManualError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const res = await apiRequest(`/admin/password-resets?${params.toString()}`);
      setRequests(res.data?.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load password reset requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleOpenConfirm = (request, action) => {
    setConfirmModal({
      open: true,
      request,
      action,
      remarks: action === 'RESET' ? 'Reset password to initial password Password123!' : ''
    });
  };

  const handleResolveRequest = async () => {
    if (!confirmModal.request) return;
    const { request, action, remarks } = confirmModal;

    try {
      setActionLoading(request.id);
      const res = await apiRequest(`/admin/password-resets/${request.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action, remarks })
      });

      setSuccessMessage(res.message || `Password reset successfully processed.`);
      setConfirmModal({ open: false, request: null, action: 'RESET', remarks: '' });
      fetchRequests();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      alert(err.message || 'Failed to process password reset request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualReset = async (e) => {
    e.preventDefault();
    if (!manualRegNo.trim()) return;

    try {
      setManualLoading(true);
      setManualError(null);
      setManualSuccess(null);

      // Search student by registerNumber
      const studentRes = await apiRequest(`/admin/students?search=${encodeURIComponent(manualRegNo.trim())}`);
      const student = (studentRes.data?.students || []).find(
        s => s.registerNumber.toUpperCase() === manualRegNo.trim().toUpperCase()
      );

      if (!student || !student.user) {
        throw new Error(`Student with register number "${manualRegNo.trim()}" not found.`);
      }

      // Reset user password
      const resetRes = await apiRequest(`/admin/users/${student.user.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: 'Password123!' })
      });

      setManualSuccess(`Password for ${student.name} (${student.registerNumber}) successfully reset to "Password123!".`);
      setManualRegNo('');
      fetchRequests();
    } catch (err) {
      setManualError(err.message || 'Failed to reset password for register number.');
    } finally {
      setManualLoading(false);
    }
  };

  // Helper date formatter (DD/MM/YYYY)
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const resetCount = requests.filter(r => r.status === 'RESET').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Student Password Reset Requests</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review forgotten password requests from students and reset their credentials to the default initial password (<strong className="font-mono text-slate-700">Password123!</strong>).
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Success / Alert banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Action</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-amber-700 font-medium">Awaiting administrator reset</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reset Completed</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{resetCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Provided Password123!</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Declined Requests</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{rejectedCount}</p>
          <span className="text-[11px] text-rose-700 font-medium">Rejected by administrator</span>
        </div>

        <div className="p-4 bg-white border border-blue-200 bg-blue-50/40 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Initial Password</span>
            </div>
            <p className="text-lg font-bold font-mono text-blue-700 mt-1">Password123!</p>
          </div>
          <span className="text-[10px] text-blue-600">Students can change it anytime in profile</span>
        </div>
      </div>

      {/* Manual Quick Reset Accordion / Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          Direct Password Reset for Any Student
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          If a student calls or visits directly without an online request, enter their Register Number to reset their password immediately to <strong className="font-mono">Password123!</strong>.
        </p>

        {manualSuccess && (
          <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{manualSuccess}</span>
          </div>
        )}

        {manualError && (
          <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{manualError}</span>
          </div>
        )}

        <form onSubmit={handleManualReset} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            required
            placeholder="Enter Student Register Number (e.g. 710724243001)"
            value={manualRegNo}
            onChange={(e) => setManualRegNo(e.target.value)}
            className="w-full sm:max-w-md px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
          />
          <button
            type="submit"
            disabled={manualLoading}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{manualLoading ? 'Resetting...' : 'Reset to Password123!'}</span>
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Requests ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('RESET')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'RESET'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reset Completed
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'REJECTED'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejected
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-semibold text-slate-700">Loading password reset requests...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchRequests}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-xs"
            >
              Retry
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-1">
            <CheckCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No password reset requests found.</p>
            <p className="text-[11px]">When students submit a request through the portal, it will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Class & Department</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  const studentProfile = req.user?.studentProfile;
                  const isPending = req.status === 'PENDING';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {req.studentName || studentProfile?.name || 'Student'}
                        </div>
                        {req.reason && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs" title={req.reason}>
                            Note: {req.reason}
                          </div>
                        )}
                      </td>

                      {/* Register Number */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {req.registerNumber}
                        </span>
                      </td>

                      {/* Class & Department */}
                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-medium">
                          {studentProfile?.department?.code === 'AI_DS' ? 'AI & DS' : (studentProfile?.department?.name || 'AI & DS')}
                        </span>
                        {studentProfile?.year && (
                          <span className="block text-[11px] text-slate-400">
                            Year {studentProfile.year} - Sec {studentProfile.section}
                          </span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4 space-y-0.5">
                        {req.studentPhone && (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono text-[11px]">{req.studentPhone}</span>
                          </div>
                        )}
                        {req.email && (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-[11px] truncate max-w-[150px]">{req.email}</span>
                          </div>
                        )}
                        {!req.studentPhone && !req.email && (
                          <span className="text-slate-400 italic text-[11px]">No contact provided</span>
                        )}
                      </td>

                      {/* Requested At */}
                      <td className="py-3 px-4">
                        <span className="text-slate-600 block">{formatDateTime(req.requestedAt)}</span>
                        {req.resolvedAt && (
                          <span className="text-[10px] text-slate-400 block">
                            Resolved: {formatDateTime(req.resolvedAt)} by {req.resolvedBy}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                        {req.status === 'RESET' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Reset (Password123!)</span>
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenConfirm(req, 'RESET')}
                              disabled={actionLoading === req.id}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center space-x-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reset Password</span>
                            </button>
                            <button
                              onClick={() => handleOpenConfirm(req, 'REJECT')}
                              disabled={actionLoading === req.id}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg font-bold text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {req.adminRemarks || 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation & Resolve Modal */}
      {confirmModal.open && confirmModal.request && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className={`p-2.5 rounded-xl ${confirmModal.action === 'RESET' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                {confirmModal.action === 'RESET' ? <RotateCcw className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {confirmModal.action === 'RESET' ? 'Reset Student Password' : 'Decline Password Reset Request'}
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Student: {confirmModal.request.studentName} ({confirmModal.request.registerNumber})
                </p>
              </div>
            </div>

            {confirmModal.action === 'RESET' ? (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-blue-900">
                <p className="font-semibold text-xs">
                  This action will immediately set the student password to the institutional default:
                </p>
                <div className="p-2 bg-white rounded-lg border border-blue-200 font-mono text-center font-bold text-sm text-blue-700 tracking-wider">
                  Password123!
                </div>
                <p className="text-[11px] text-blue-700">
                  The student will be able to log in with this password and can update it anytime from their profile settings.
                </p>
              </div>
            ) : (
              <p className="text-slate-600 text-xs">
                Are you sure you want to decline this password reset request?
              </p>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Admin Remarks / Note (Optional)
              </label>
              <textarea
                rows="2"
                value={confirmModal.remarks}
                onChange={(e) => setConfirmModal({ ...confirmModal, remarks: e.target.value })}
                placeholder="e.g. Password reset confirmed by advisor / student contacted directly"
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, request: null, action: 'RESET', remarks: '' })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveRequest}
                className={`px-4 py-2 text-white font-bold rounded-xl shadow-xs transition-colors ${
                  confirmModal.action === 'RESET' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmModal.action === 'RESET' ? 'Confirm & Reset to Password123!' : 'Decline Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
