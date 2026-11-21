import StudentProfileModal from '../components/StudentProfileModal';
import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Eye,
  Users, 
  Search, 
  UserCheck, 
  ClipboardCheck, 
  Phone, 
  Mail, 
  Trophy, 
  CalendarOff, 
  CheckCircle2, 
  XCircle,
  Building2,
  GraduationCap
} from 'lucide-react';

export default function MyStudentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ students: [], total: 0, activeCount: 0, tutoredCount: 0, advisedCount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'TUTOR' | 'ADVISOR'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/students/my-students');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load my students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const students = data.students || [];

  // Dual role check
  const hasTutored = data.tutoredCount > 0;
  const hasAdvised = data.advisedCount > 0;
  const isDualRole = hasTutored && hasAdvised;

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Role filter
      if (roleFilter === 'TUTOR' && !s.isTutoredByMe) return false;
      if (roleFilter === 'ADVISOR' && !s.isAdvisedByMe) return false;

      // Status filter
      if (statusFilter === 'ACTIVE' && !s.active) return false;
      if (statusFilter === 'INACTIVE' && s.active) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const name = (s.name || '').toLowerCase();
        const reg = (s.registerNumber || '').toLowerCase();
        const roll = (s.rollNumber || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const phone = (s.studentPhone || '').toLowerCase();

        return (
          name.includes(term) ||
          reg.includes(term) ||
          roll.includes(term) ||
          email.includes(term) ||
          phone.includes(term)
        );
      }

      return true;
    });
  }, [students, roleFilter, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Academic Batch Management</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            My Students Roster
          </h2>
          <p className="text-xs text-slate-500">
            View student profiles, contact info, class assignments, and participation history
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto shrink-0">
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600 block">Total Students</span>
            <span className="text-lg font-black text-blue-800">{data.total}</span>
          </div>

          {hasTutored && (
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Tutored Students</span>
              <span className="text-lg font-black text-emerald-800">{data.tutoredCount}</span>
            </div>
          )}

          {hasAdvised && (
            <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-purple-600 block">Advised Class</span>
              <span className="text-lg font-black text-purple-800">{data.advisedCount}</span>
            </div>
          )}

          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Users</span>
            <span className="text-lg font-black text-slate-700">{data.activeCount}</span>
          </div>
        </div>
      </div>

      {/* Role Tabs (If dual role: Tutor + Advisor) */}
      {isDualRole && (
        <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 ${
              roleFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Assigned Students ({data.total})</span>
          </button>

          <button
            onClick={() => setRoleFilter('TUTOR')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 ${
              roleFilter === 'TUTOR'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Tutored Batch ({data.tutoredCount})</span>
          </button>

          <button
            onClick={() => setRoleFilter('ADVISOR')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 ${
              roleFilter === 'ADVISOR'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>My Advised Class ({data.advisedCount})</span>
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, register number, email, phone..."
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

        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="INACTIVE">Inactive Accounts</option>
          </select>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Enrolled Students List ({filteredStudents.length} Students)
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Showing {filteredStudents.length} of {data.total}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading student roster...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">No students found matching your criteria</p>
            <p className="text-xs text-slate-400">Try clearing your search terms or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">#</th>
                  <th className="p-3.5">Student Details</th>
                  <th className="p-3.5">Class & Section</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Assigned Mentors</th>
                  <th className="p-3.5 text-center">On-Duty Trips</th>
                  <th className="p-3.5 text-center">Leaves</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, index) => (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                    {/* Index */}
                    <td className="p-3.5 pl-5 text-slate-400 font-bold text-[11px]">
                      {index + 1}
                    </td>

                    {/* Student Details */}
                    <td className="p-3.5">
                      <div 
                        onClick={() => setSelectedStudent(s)}
                        className="flex items-center space-x-2.5 cursor-pointer group/student"
                        title="Click to view full student profile"
                      >
                        
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-xs overflow-hidden border border-slate-200">
                          {s.profilePhoto || s.user?.profilePhoto ? (
                            <img src={s.profilePhoto || s.user?.profilePhoto} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            s.name ? s.name.charAt(0) : 'S'
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs group-hover:text-blue-600 transition-colors">
                            {s.name}
                          </span>
                          <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span>Reg: {s.registerNumber}</span>
                            {s.rollNumber && s.rollNumber !== s.registerNumber && (
                              <>
                                <span>•</span>
                                <span>Roll: {s.rollNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      
                      </div>
                    </td>

                    {/* Academic Section */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 inline-block">
                            Year {s.year} - {s.section}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                            s.residenceType === 'HOSTEL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {s.residenceType === 'HOSTEL' ? 'Hostel' : 'Day Scholar'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium">
                          <span className="truncate max-w-[120px]">{s.department?.name || 'AI & DS'}</span>
                          {s.cutoff !== null && s.cutoff !== undefined && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-purple-700">Cutoff: {s.cutoff}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-3.5">
                      <div className="space-y-0.5 text-[11px]">
                        {s.email && (
                          <div className="flex items-center space-x-1 text-slate-600 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{s.email}</span>
                          </div>
                        )}
                        {s.studentPhone && (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{s.studentPhone}</span>
                            {s.parentPhone && s.parentPhone !== s.studentPhone && (
                              <span className="text-[10px] text-slate-400"> (Parent: {s.parentPhone})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Assigned Mentors */}
                    <td className="p-3.5">
                      <div className="space-y-0.5 text-[11px]">
                        <p className="text-slate-700">
                          <span className="text-slate-400 font-medium">Tutor:</span>{' '}
                          <strong className={s.isTutoredByMe ? 'text-emerald-700' : 'text-slate-800'}>
                            {s.tutor?.name || 'Not assigned'}
                          </strong>
                        </p>
                        <p className="text-slate-700">
                          <span className="text-slate-400 font-medium">Advisor:</span>{' '}
                          <strong className={s.isAdvisedByMe ? 'text-purple-700' : 'text-slate-800'}>
                            {s.classAdvisor?.name || 'Not assigned'}
                          </strong>
                        </p>
                      </div>
                    </td>

                    {/* OD Count */}
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        <span>{s.metrics?.approvedODs || 0}</span>
                      </span>
                    </td>

                    {/* Leave Count */}
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <CalendarOff className="w-3 h-3 text-purple-500" />
                        <span>{s.metrics?.approvedLeaves || 0}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{s.active ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold rounded-xl text-xs transition-colors border border-blue-200 shadow-2xs"
                        title="View Full Student Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StudentProfileModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
