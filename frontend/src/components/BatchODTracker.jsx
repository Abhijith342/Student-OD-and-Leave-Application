import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Hourglass, 
  ExternalLink,
  Sparkles,
  Building2,
  CalendarDays
} from 'lucide-react';
import { calculateDurationDays, calculateDurationDaysNum, formatDateRange } from '../utils/dateUtils';
import { StatusBadge, StageBadge } from './StatusBadge';

export default function BatchODTracker({ 
  applications = [], 
  batchTitle = 'Batch On-Duty (OD) & Hackathon Tracker',
  batchSubtitle = 'Students scheduled for hackathons, project expos, and external competitions from your batch',
  onViewDetails,
  roleName = 'STAFF'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'approved' | 'pending'
  const [selectedVenue, setSelectedVenue] = useState('all');

  // Filter only On-Duty applications
  const odApplications = useMemo(() => {
    return applications.filter(a => a.type === 'OD');
  }, [applications]);

  // Compute metrics
  const stats = useMemo(() => {
    const approvedODs = odApplications.filter(
      a => a.status === 'APPROVED' || a.currentStage === 'COMPLETED' || a.currentStage === 'PRINCIPAL_PENDING'
    );
    const pendingODs = odApplications.filter(
      a => a.status === 'PENDING' && a.currentStage !== 'COMPLETED' && a.currentStage !== 'PRINCIPAL_PENDING'
    );
    
    // Distinct students going on OD (approved or active)
    const uniqueApprovedStudents = new Set(
      approvedODs.map(a => a.studentId || a.student?.id || a.student?.registerNumber)
    ).size;

    // Total distinct students with any OD request
    const totalUniqueStudents = new Set(
      odApplications.map(a => a.studentId || a.student?.id || a.student?.registerNumber)
    ).size;

    // Total days accumulated across all ODs
    const totalDays = odApplications.reduce(
      (acc, curr) => acc + calculateDurationDaysNum(curr.fromDate, curr.toDate),
      0
    );

    // Unique venues list
    const venues = Array.from(new Set(odApplications.map(a => a.venue?.trim()).filter(Boolean)));

    return {
      totalODs: odApplications.length,
      approvedCount: approvedODs.length,
      pendingCount: pendingODs.length,
      uniqueApprovedStudents,
      totalUniqueStudents,
      totalDays,
      venues
    };
  }, [odApplications]);

  // Filtered applications based on search and filters
  const filteredODs = useMemo(() => {
    return odApplications.filter(app => {
      // Status filter
      const isApproved = app.status === 'APPROVED' || app.currentStage === 'COMPLETED' || app.currentStage === 'PRINCIPAL_PENDING';
      if (statusFilter === 'approved' && !isApproved) return false;
      if (statusFilter === 'pending' && isApproved) return false;

      // Venue filter
      if (selectedVenue !== 'all' && (app.venue || '').toLowerCase() !== selectedVenue.toLowerCase()) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const studentName = (app.student?.name || '').toLowerCase();
        const regNo = (app.student?.registerNumber || '').toLowerCase();
        const rollNo = (app.student?.rollNumber || '').toLowerCase();
        const eventName = (app.eventName || '').toLowerCase();
        const venue = (app.venue || '').toLowerCase();
        const reason = (app.reason || '').toLowerCase();
        const appNum = (app.applicationNumber || '').toLowerCase();

        return (
          studentName.includes(term) ||
          regNo.includes(term) ||
          rollNo.includes(term) ||
          eventName.includes(term) ||
          venue.includes(term) ||
          reason.includes(term) ||
          appNum.includes(term)
        );
      }

      return true;
    });
  }, [odApplications, statusFilter, selectedVenue, searchTerm]);

  return (
    <div className="space-y-5">
      {/* Overview Metric Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-blue-800/40">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-52 h-52 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-6 w-40 h-40 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold tracking-wide uppercase">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>On-Duty & Hackathon Dashboard</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {batchTitle}
            </h3>
            <p className="text-xs text-blue-200/80 leading-relaxed">
              {batchSubtitle}
            </p>
          </div>

          {/* Key Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
            {/* Stat 1: Students Going on OD */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-emerald-400 mb-0.5">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Students on OD</span>
              </div>
              <span className="text-2xl font-black text-white block">
                {stats.uniqueApprovedStudents}
              </span>
              <span className="text-[10px] text-emerald-300 font-medium">Confirmed Going</span>
            </div>

            {/* Stat 2: Total OD Trips */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-blue-300 mb-0.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Hackathons</span>
              </div>
              <span className="text-2xl font-black text-white block">
                {stats.totalODs}
              </span>
              <span className="text-[10px] text-blue-300 font-medium">Total OD Trips</span>
            </div>

            {/* Stat 3: Days on OD */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-purple-300 mb-0.5">
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Duration</span>
              </div>
              <span className="text-2xl font-black text-white block">
                {stats.totalDays}
              </span>
              <span className="text-[10px] text-purple-200 font-medium">Days Accumulated</span>
            </div>

            {/* Stat 4: Venues */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-amber-300 mb-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Venues</span>
              </div>
              <span className="text-2xl font-black text-white block">
                {stats.venues.length}
              </span>
              <span className="text-[10px] text-amber-200 font-medium">Host Institutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student name, reg no, hackathon, venue..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 shrink-0 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All ODs</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {stats.totalODs}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Confirmed Going</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/20">
              {stats.approvedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Hourglass className="w-3 h-3" />
            <span>Pending Review</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-700/20">
              {stats.pendingCount}
            </span>
          </button>

          {stats.venues.length > 1 && (
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="text-xs bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Venues ({stats.venues.length})</option>
              {stats.venues.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Students Going On-Duty ({filteredODs.length} Applications)
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Showing {filteredODs.length} of {stats.totalODs} records
          </span>
        </div>

        {filteredODs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">No On-Duty applications match your criteria</p>
            <p className="text-xs text-slate-400">
              {searchTerm ? 'Try adjusting your search terms or filters.' : 'No students from this batch have applied for hackathons or on-duty yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">#</th>
                  <th className="p-3.5">Student Details</th>
                  <th className="p-3.5">Hackathon / Event Name</th>
                  <th className="p-3.5">Date of Event</th>
                  <th className="p-3.5 text-center">Duration</th>
                  <th className="p-3.5">Venue</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredODs.map((app, index) => {
                  const durationLabel = calculateDurationDays(app.fromDate, app.toDate);
                  const isApproved = app.status === 'APPROVED' || app.currentStage === 'COMPLETED' || app.currentStage === 'PRINCIPAL_PENDING';

                  return (
                    <tr 
                      key={app.id} 
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Index */}
                      <td className="p-3.5 pl-5 text-slate-400 font-bold text-[11px]">
                        {index + 1}
                      </td>

                      {/* Student Details */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-xs">
                            {app.student?.name ? app.student.name.charAt(0) : 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs group-hover:text-blue-600 transition-colors">
                              {app.student?.name || 'Unknown Student'}
                            </span>
                            <div className="flex items-center space-x-1.5 mt-0.5 text-[11px] text-slate-500 font-medium">
                              <span>Reg: {app.student?.registerNumber}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                                Yr {app.student?.year || 3} - {app.student?.section || 'A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hackathon / Event Name */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-extrabold text-slate-900 text-xs">
                              {app.eventName || app.reason}
                            </span>
                          </div>
                          {app.eventName && app.reason && app.reason !== app.eventName && (
                            <p className="text-[11px] text-slate-500 truncate max-w-xs pl-5">
                              {app.reason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-bold text-xs">
                            {formatDateRange(app.fromDate, app.toDate)}
                          </span>
                        </div>
                      </td>

                      {/* How Many Days */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>{durationLabel}</span>
                        </span>
                      </td>

                      {/* Venue */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5 text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="font-bold text-xs truncate max-w-[180px]" title={app.venue || 'Campus'}>
                            {app.venue || 'Campus / External Venue'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved & Going</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Hourglass className="w-3 h-3 text-amber-500" />
                            <span>{app.currentStage.replace(/_/g, ' ')}</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => onViewDetails && onViewDetails(app)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-all shadow-2xs inline-flex items-center space-x-1"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
