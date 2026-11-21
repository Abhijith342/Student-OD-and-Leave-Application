import StudentProfileModal from '../components/StudentProfileModal';
import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../services/api';
import { 
  Calendar, 
  Trophy, 
  CalendarOff, 
  Users, 
  MapPin, 
  Clock, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Sparkles,
  School
} from 'lucide-react';
import { calculateDurationDays, formatDateRange } from '../utils/dateUtils';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import DatePicker from '../components/DatePicker';

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const dd = parts[2].padStart(2, '0');
  const mm = parts[1].padStart(2, '0');
  const yyyy = parts[0];
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'long' });
  return `${weekday}, ${dd}/${mm}/${yyyy}`;
}

function adjustDate(dateStr, days) {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function DailyStatusPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'OD' | 'LEAVE'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const fetchDailyStatus = async (date) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest(`/applications/daily-status?date=${date}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch daily status:', err);
      setError(err.message || 'Failed to load daily attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyStatus(selectedDate);
  }, [selectedDate]);

  const summary = data?.summary || {
    totalBatchStudents: 0,
    totalAbsent: 0,
    odCount: 0,
    leaveCount: 0,
    expectedInClass: 0,
    attendanceRate: '100%'
  };

  const applications = data?.allApplications || [];

  // Filtered list
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Type filter
      if (typeFilter === 'OD' && app.type !== 'OD') return false;
      if (typeFilter === 'LEAVE' && app.type !== 'LEAVE') return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const sName = (app.student?.name || '').toLowerCase();
        const regNo = (app.student?.registerNumber || '').toLowerCase();
        const rollNo = (app.student?.rollNumber || '').toLowerCase();
        const eventName = (app.eventName || '').toLowerCase();
        const venue = (app.venue || '').toLowerCase();
        const reason = (app.reason || '').toLowerCase();
        const leaveType = (app.leaveType || '').toLowerCase();

        return (
          sName.includes(term) ||
          regNo.includes(term) ||
          rollNo.includes(term) ||
          eventName.includes(term) ||
          venue.includes(term) ||
          reason.includes(term) ||
          leaveType.includes(term)
        );
      }

      return true;
    });
  }, [applications, typeFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Attendance & Daily Student Movement</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Daily On-Duty (OD) & Leave Status Tracker
          </h2>
          <p className="text-xs text-slate-500">
            Select any date to see which students are away on hackathons or approved leave
          </p>
        </div>

        {/* Single Date Picker Widget */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto shrink-0 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSelectedDate(adjustDate(selectedDate, -1))}
              className="p-2 hover:bg-white rounded-xl text-slate-600 transition-colors shadow-2xs border border-transparent hover:border-slate-200"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(getTodayString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedDate === getTodayString()
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Today
            </button>

            <button
              onClick={() => setSelectedDate(adjustDate(selectedDate, 1))}
              className="p-2 hover:bg-white rounded-xl text-slate-600 transition-colors shadow-2xs border border-transparent hover:border-slate-200"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-36 sm:w-44">
            <DatePicker
              value={selectedDate}
              onChange={(e) => {
                const val = typeof e === 'object' && e?.target ? e.target.value : e;
                if (val) setSelectedDate(val);
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Date Banner & Overview Cards */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Status for Selected Date</span>
            </div>
            <h3 className="text-2xl font-black text-white">
              {formatDisplayDate(selectedDate)}
            </h3>
            <p className="text-xs text-blue-200/80">
              {summary.totalAbsent === 0
                ? 'All students in this batch are scheduled to be in class'
                : `${summary.totalAbsent} student(s) scheduled away (${summary.odCount} on OD, ${summary.leaveCount} on Leave)`}
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
            {/* Metric 1: Total Absent */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-rose-300 mb-0.5">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Away</span>
              </div>
              <span className="text-2xl font-black text-white block">
                {summary.totalAbsent}
              </span>
              <span className="text-[10px] text-rose-200 font-medium">Students Out</span>
            </div>

            {/* Metric 2: On-Duty */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-blue-300 mb-0.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">On-Duty (OD)</span>
              </div>
              <span className="text-2xl font-black text-white block">
                {summary.odCount}
              </span>
              <span className="text-[10px] text-blue-300 font-medium">Hackathons & Events</span>
            </div>

            {/* Metric 3: On Leave */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-purple-300 mb-0.5">
                <CalendarOff className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">On Leave</span>
              </div>
              <span className="text-2xl font-black text-white block">
                {summary.leaveCount}
              </span>
              <span className="text-[10px] text-purple-200 font-medium">Medical / Personal</span>
            </div>

            {/* Metric 4: Expected In Class */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-emerald-300 mb-0.5">
                <School className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">In Class</span>
              </div>
              <span className="text-2xl font-black text-white block">
                {summary.expectedInClass}
              </span>
              <span className="text-[10px] text-emerald-300 font-medium">{summary.attendanceRate} Attendance</span>
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
            placeholder="Search student name, reg no, hackathon, venue, or leave reason..."
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
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 ${
              typeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Away</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {applications.length}
            </span>
          </button>

          <button
            onClick={() => setTypeFilter('OD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 ${
              typeFilter === 'OD'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>On-Duty ({summary.allOdCount || summary.odCount})</span>
          </button>

          <button
            onClick={() => setTypeFilter('LEAVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 ${
              typeFilter === 'LEAVE'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <CalendarOff className="w-3 h-3" />
            <span>On Leave ({summary.allLeaveCount || summary.leaveCount})</span>
          </button>
        </div>
      </div>

      {/* Main Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Students Away on {formatDisplayDate(selectedDate)}
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Showing {filteredApps.length} of {applications.length} entries
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading attendance records for {selectedDate}...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">
                100% In-Class Attendance Expected!
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No students from this batch are on Leave or On-Duty on{' '}
                <strong>{formatDisplayDate(selectedDate)}</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">#</th>
                  <th className="p-3.5">Student Details</th>
                  <th className="p-3.5 text-center">Type</th>
                  <th className="p-3.5">Event Name / Leave Type</th>
                  <th className="p-3.5">Duration (From – To)</th>
                  <th className="p-3.5 text-center">Days</th>
                  <th className="p-3.5">Venue / Details</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app, index) => {
                  const durationLabel = calculateDurationDays(app.fromDate, app.toDate);
                  const isApproved = app.status === 'APPROVED' || app.currentStage === 'COMPLETED' || app.currentStage === 'PRINCIPAL_PENDING';

                  return (
                    <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Index */}
                      <td className="p-3.5 pl-5 text-slate-400 font-bold text-[11px]">
                        {index + 1}
                      </td>

                      {/* Student Details */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full font-black flex items-center justify-center shrink-0 text-xs ${
                            app.type === 'OD'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {app.student?.name ? app.student.name.charAt(0) : 'S'}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentId(app.student?.id || app.studentId)}
                              className="font-bold text-slate-900 block text-xs hover:text-blue-600 hover:underline text-left transition-colors"
                              title="Click to view student profile"
                            >
                              {app.student?.name || 'Unknown'}
                            </button>
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

                      {/* Type Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          app.type === 'OD'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          {app.type === 'OD' ? (
                            <>
                              <Trophy className="w-3 h-3 text-amber-500" />
                              <span>On-Duty</span>
                            </>
                          ) : (
                            <>
                              <CalendarOff className="w-3 h-3 text-purple-600" />
                              <span>Leave</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Event / Leave Type */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 text-xs block">
                            {app.type === 'OD'
                              ? (app.eventName || app.reason)
                              : (app.leaveType || 'Leave Request')}
                          </span>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">
                            {app.reason}
                          </p>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-bold text-xs">
                            {formatDateRange(app.fromDate, app.toDate)}
                          </span>
                        </div>
                      </td>

                      {/* Days */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>{durationLabel}</span>
                        </span>
                      </td>

                      {/* Venue / Location */}
                      <td className="p-3.5">
                        {app.type === 'OD' ? (
                          <div className="flex items-center space-x-1.5 text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-bold text-xs truncate max-w-[160px]" title={app.venue || 'External Venue'}>
                              {app.venue || 'External Venue'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Personal / Medical
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved & Out</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span>{app.currentStage.replace(/_/g, ' ')}</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => setSelectedApp(app)}
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

      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}

      <StudentProfileModal
        studentId={selectedStudentId}
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
