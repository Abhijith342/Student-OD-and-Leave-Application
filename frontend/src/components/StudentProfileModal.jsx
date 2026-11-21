import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { formatDate, formatDateRange } from '../utils/dateUtils';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Phone,
  Mail,
  Home,
  Bus,
  Award,
  GraduationCap,
  Building2,
  UserCheck,
  UserCheck2,
  Calendar,
  Trophy,
  CalendarOff,
  Copy,
  Check,
  MapPin,
  AlertCircle
} from 'lucide-react';

export default function StudentProfileModal({ 
  student: initialStudent, 
  studentId, 
  isOpen, 
  onClose 
}) {
  const [fetchedStudent, setFetchedStudent] = useState(initialStudent || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'

  const effectiveId = studentId || initialStudent?.id || initialStudent?.registerNumber;

  useEffect(() => {
    if (!isOpen) {
      setFetchedStudent(null);
      setError(null);
      return;
    }

    if (initialStudent) {
      setFetchedStudent(initialStudent);
    }

    if (!effectiveId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    apiRequest(`/students/profile/${effectiveId}`)
      .then(res => {
        if (isMounted && res.data?.student) {
          setFetchedStudent(res.data.student);
        }
      })
      .catch(err => {
        console.warn('Could not fetch detailed student profile, falling back to basic data:', err);
        if (isMounted && !initialStudent) {
          setError(err.message || 'Unable to load profile.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, effectiveId, initialStudent]);

  if (!isOpen) return null;

  const displayStudent = fetchedStudent || initialStudent;

  if (!displayStudent && loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center space-y-3 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-bold text-slate-800 text-sm">Loading Student Profile...</p>
          <p className="text-xs text-slate-400">Fetching registration details and attendance records</p>
        </div>
      </div>
    );
  }

  if (!displayStudent && !loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <div>
            <h4 className="font-bold text-slate-800 text-base">Unable to View Profile</h4>
            <p className="text-xs text-slate-500 mt-1">{error || 'Student record was not found or could not be loaded.'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const photoSource = displayStudent?.profilePhoto || displayStudent?.user?.profilePhoto;

  const rawApplications = displayStudent?.applications || [];
  const metrics = displayStudent?.metrics || {
    totalODs: rawApplications.filter(a => a.type === 'OD').length,
    approvedODs: rawApplications.filter(a => a.type === 'OD' && (a.status === 'APPROVED' || a.currentStage === 'COMPLETED')).length,
    totalLeaves: rawApplications.filter(a => a.type === 'LEAVE').length,
    approvedLeaves: rawApplications.filter(a => a.type === 'LEAVE' && (a.status === 'APPROVED' || a.currentStage === 'COMPLETED')).length
  };

  const isHostel = displayStudent?.residenceType === 'HOSTEL';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Student Institutional Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Student Hero Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 text-white font-bold text-2xl flex items-center justify-center shadow-md overflow-hidden border-2 border-white ring-2 ring-slate-200 shrink-0">
                {photoSource ? (
                  <img
                    src={photoSource}
                    alt={displayStudent?.name || 'Student'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayStudent?.name?.[0] || 'S'
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h4 className="text-base sm:text-lg font-black text-slate-900">{displayStudent?.name || 'Student Name'}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    STUDENT
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center space-x-1 ${
                    isHostel
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {isHostel ? (
                      <>
                        <Home className="w-3 h-3 mr-1" />
                        <span>Hosteler</span>
                      </>
                    ) : (
                      <>
                        <Bus className="w-3 h-3 mr-1" />
                        <span>Day Scholar</span>
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  Reg: <span className="font-mono font-bold text-slate-900">{displayStudent?.registerNumber || 'N/A'}</span>
                  {displayStudent?.rollNumber && (
                    <span className="ml-2 font-mono text-blue-700">({displayStudent.rollNumber})</span>
                  )}
                </p>

                <p className="text-xs text-slate-500">
                  {displayStudent?.department?.name || 'AI & DS'} • Year {displayStudent?.year || 3} - Section {displayStudent?.section || 'A'}
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div className="self-end sm:self-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 ${
                displayStudent?.active !== false && displayStudent?.user?.active !== false
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  displayStudent?.active !== false && displayStudent?.user?.active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                }`} />
                <span>{displayStudent?.active !== false && displayStudent?.user?.active !== false ? 'Active Student' : 'Inactive'}</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Trophy className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 block tracking-wider">OD Trips</span>
                <span className="text-base font-black text-slate-900">{metrics.approvedODs ?? 0}</span>
                <span className="text-[10px] text-slate-500 block">Approved of {metrics.totalODs ?? 0}</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CalendarOff className="w-4 h-4 text-purple-200" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-700 block tracking-wider">Leaves</span>
                <span className="text-base font-black text-slate-900">{metrics.approvedLeaves ?? 0}</span>
                <span className="text-[10px] text-slate-500 block">Approved of {metrics.totalLeaves ?? 0}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider">Cutoff Score</span>
                <span className="text-base font-black text-slate-900">
                  {displayStudent?.cutoff !== null && displayStudent?.cutoff !== undefined ? displayStudent.cutoff : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-500 block">Out of 200</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 px-4 font-bold border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Profile & Mentors
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 px-4 font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>OD & Leave History</span>
              <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] text-slate-600">
                {rawApplications.length}
              </span>
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Contact & Personal Information */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Contact & Residence Information
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  {/* Student Phone */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center space-x-1 text-[11px] font-medium">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        <span>Student Phone Number</span>
                      </span>
                      {displayStudent?.studentPhone && (
                        <button
                          onClick={() => copyToClipboard(displayStudent.studentPhone, 'studentPhone')}
                          className="text-slate-400 hover:text-blue-600"
                          title="Copy student phone"
                        >
                          {copiedField === 'studentPhone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    {displayStudent?.studentPhone ? (
                      <a
                        href={`tel:${displayStudent.studentPhone}`}
                        className="font-bold text-slate-900 font-mono hover:text-blue-600 hover:underline block"
                      >
                        {displayStudent.studentPhone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>

                  {/* Parent Phone */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center space-x-1 text-[11px] font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Parents Phone Number</span>
                      </span>
                      {displayStudent?.parentPhone && (
                        <button
                          onClick={() => copyToClipboard(displayStudent.parentPhone, 'parentPhone')}
                          className="text-slate-400 hover:text-emerald-600"
                          title="Copy parent phone"
                        >
                          {copiedField === 'parentPhone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    {displayStudent?.parentPhone ? (
                      <a
                        href={`tel:${displayStudent.parentPhone}`}
                        className="font-bold text-emerald-700 font-mono hover:underline block"
                      >
                        {displayStudent.parentPhone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="flex items-center space-x-1 text-[11px] font-medium text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Email Address</span>
                    </span>
                    {displayStudent?.email || displayStudent?.user?.email ? (
                      <a
                        href={`mailto:${displayStudent.email || displayStudent.user?.email}`}
                        className="font-semibold text-slate-800 hover:text-blue-600 hover:underline block truncate"
                      >
                        {displayStudent.email || displayStudent.user?.email}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Not available</span>
                    )}
                  </div>

                  {/* Residence Status */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="flex items-center space-x-1 text-[11px] font-medium text-slate-400">
                      {isHostel ? (
                        <Home className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Bus className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span>Residence Type</span>
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {isHostel ? 'Hostel Resident (Campus)' : 'Day Scholar (Daily Commuter)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Institutional Staff Hierarchy */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Assigned Mentors & Approval Hierarchy
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Tutor */}
                  <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                    <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                      <UserCheck className="w-4 h-4" />
                      <span>Assigned Tutor</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{displayStudent?.tutor?.name || 'Not assigned'}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Emp ID: {displayStudent?.tutor?.employeeId || 'N/A'}</p>
                  </div>

                  {/* Class Advisor */}
                  <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1">
                    <div className="flex items-center space-x-1.5 text-purple-700 font-bold">
                      <UserCheck2 className="w-4 h-4" />
                      <span>Class Advisor</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{displayStudent?.classAdvisor?.name || 'Not assigned'}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Emp ID: {displayStudent?.classAdvisor?.employeeId || 'N/A'}</p>
                  </div>

                  {/* HOD */}
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      <Building2 className="w-4 h-4" />
                      <span>Head of Department</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{displayStudent?.hod?.name || 'Department HOD'}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Emp ID: {displayStudent?.hod?.employeeId || 'HOD'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Application History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {rawApplications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <Calendar className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-medium text-slate-600">No OD or Leave applications submitted yet</p>
                  <p className="text-[11px]">Applications submitted by this student will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rawApplications.map(app => (
                    <div
                      key={app.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.type === 'OD' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                          }`}>
                            {app.type}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            #{app.applicationNumber}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-medium">
                            {formatDateRange(app.fromDate, app.toDate)}
                          </span>
                        </div>

                        <p className="font-medium text-slate-900 text-xs">
                          {app.type === 'OD' ? app.eventName : (app.reason || app.leaveType || 'Leave Application')}
                        </p>

                        {app.venue && (
                          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{app.venue}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-1 shrink-0">
                        <StatusBadge status={app.status} />
                        <span className="text-[10px] text-slate-400">
                          {formatDate(app.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Institutional Student Data • {displayStudent?.department?.name || 'AI & DS Dept'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors shadow-xs"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
