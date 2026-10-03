import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  UserCheck, 
  FileText,
  ChevronRight
} from 'lucide-react';

export default function AdminAuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [targetType, setTargetType] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, [search, targetType]);

  async function fetchAuditLogs() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (targetType) params.append('targetType', targetType);

      const res = await apiRequest(`/admin/audit-logs?${params.toString()}`);
      setAuditLogs(res.data.auditLogs);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit log records.');
    } finally {
      setLoading(false);
    }
  }

  const actionColors = {
    CREATE_STUDENT: 'bg-emerald-100 text-emerald-800',
    UPDATE_STUDENT: 'bg-blue-100 text-blue-800',
    DEACTIVATE_STUDENT: 'bg-rose-100 text-rose-800',
    ACTIVATE_STUDENT: 'bg-emerald-100 text-emerald-800',
    CREATE_STAFF: 'bg-indigo-100 text-indigo-800',
    UPDATE_STAFF: 'bg-blue-100 text-blue-800',
    DEACTIVATE_STAFF: 'bg-rose-100 text-rose-800',
    RESET_PASSWORD: 'bg-amber-100 text-amber-800',
    CREATE_DEPARTMENT: 'bg-purple-100 text-purple-800',
    UPDATE_DEPARTMENT: 'bg-blue-100 text-blue-800',
    BULK_ASSIGN_STAFF: 'bg-purple-100 text-purple-800',
    IMPORT_STUDENTS: 'bg-emerald-100 text-emerald-800'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Administrative Audit Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable tracking log recording all administrative modifications, user account state changes, staff assignments, and Excel imports.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, admin username..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
          >
            <option value="">All Target Types</option>
            <option value="STUDENT">STUDENT</option>
            <option value="STAFF">STAFF</option>
            <option value="DEPARTMENT">DEPARTMENT</option>
            <option value="ASSIGNMENT">ASSIGNMENT</option>
            <option value="USER">USER</option>
            <option value="IMPORT">IMPORT</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setTargetType('');
            }}
            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-semibold">Loading audit log entries...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 font-semibold">{error}</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-semibold">
            No audit log entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Admin</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-900">{log.adminUsername}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${actionColors[log.action] || 'bg-slate-100 text-slate-800'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-700">{log.targetType}</span>
                      {log.targetId && <span className="text-[10px] text-slate-400 block font-mono">ID: {log.targetId.slice(0, 8)}...</span>}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      <p className="font-medium">{log.details}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
