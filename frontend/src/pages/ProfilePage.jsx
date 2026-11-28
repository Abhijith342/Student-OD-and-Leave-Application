import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  GraduationCap, 
  Phone, 
  Home, 
  Bus, 
  Award, 
  ShieldCheck,
  Mail,
  UserCheck
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const student = user?.studentProfile;
  const staff = user?.staffProfile;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-slate-500 space-y-2">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-semibold text-slate-700">Loading Profile...</p>
      </div>
    );
  }

  const photoSource = student?.profilePhoto || user?.profilePhoto;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Profile & Institutional Details</h2>
          <p className="text-xs text-slate-500">Student registration credentials, contact details, residence status, and staff hierarchy</p>
        </div>

        {student && (
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Institutional Record Managed by Admin</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white font-bold text-2xl flex items-center justify-center shadow-md overflow-hidden border-2 border-white ring-2 ring-slate-100">
              {photoSource ? (
                <img
                  src={photoSource}
                  alt={student?.name || user?.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                student?.name?.[0] || staff?.name?.[0] || user?.username?.[0] || 'U'
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {student?.name || staff?.name || user?.username}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {user?.role}
                </span>
                {student && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                    student.residenceType === 'HOSTEL'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {student.residenceType === 'HOSTEL' ? (
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
                )}
              </div>
              <p className="text-xs text-slate-500">
                {student ? `Registered Student ID: ${student.registerNumber}` : `Staff ID: ${staff?.employeeId || user?.username}`}
              </p>
            </div>
          </div>
        </div>

        {/* Student Specific Profile Cards */}
        {student && (
          <div className="space-y-6">
            {/* Academic Credentials */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Student Academic Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block">Register Number</span>
                  <span className="font-bold text-slate-900 text-sm">{student.registerNumber}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block">Roll Number</span>
                  <span className="font-bold text-blue-700 text-sm">{student.rollNumber || 'Not assigned'}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block">Department</span>
                  <span className="font-bold text-slate-900 text-sm">{student.department?.name || 'AI & DS'}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block">Year & Section</span>
                  <span className="font-bold text-slate-900 text-sm">Year {student.year} - Section {student.section}</span>
                </div>
              </div>
            </div>

            {/* Contact & Personal Information */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Contact & Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Student Phone */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span>Student Phone</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {student.studentPhone || <span className="text-slate-400 font-normal italic">Not provided</span>}
                  </span>
                </div>

                {/* Parents Phone */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Parent Phone</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {student.parentPhone || <span className="text-slate-400 font-normal italic">Not provided</span>}
                  </span>
                </div>

                {/* Residence Type */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
                    {student.residenceType === 'HOSTEL' ? (
                      <Home className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Bus className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>Residence Type</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {student.residenceType === 'HOSTEL' ? 'Hostel Resident' : 'Day Scholar'}
                  </span>
                </div>

                {/* Cutoff Score */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
                    <Award className="w-3.5 h-3.5 text-rose-500" />
                    <span>Admission Cutoff</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {student.cutoff !== null && student.cutoff !== undefined ? `${student.cutoff} / 200` : <span className="text-slate-400 font-normal italic">Not provided</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Email */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-600">Institutional Email:</span>
                <span className="font-bold text-slate-900">{student.email || user.email || 'Not assigned'}</span>
              </div>
              <span className="text-[11px] text-slate-400 italic">Managed by Institutional Administrator</span>
            </div>

            {/* Institutional Faculty Hierarchy */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Assigned Faculty Hierarchy
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Tutor */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                      Tutor
                    </span>
                    <UserCheck className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">
                      {student.tutor?.name || 'Unassigned'}
                    </h5>
                    <p className="text-slate-500 text-[11px]">
                      {student.tutor?.employeeId ? `Emp ID: ${student.tutor.employeeId}` : 'Stage 1 Verification'}
                    </p>
                  </div>
                </div>

                {/* Class Advisor */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                      Class Advisor
                    </span>
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">
                      {student.classAdvisor?.name || 'Unassigned'}
                    </h5>
                    <p className="text-slate-500 text-[11px]">
                      {student.classAdvisor?.employeeId ? `Emp ID: ${student.classAdvisor.employeeId}` : 'Class Advisor Review & Stage 2'}
                    </p>
                  </div>
                </div>

                {/* Department HOD */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                      Head of Department
                    </span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">
                      {student.hod?.name || 'Dr. N. Pavithra'}
                    </h5>
                    <p className="text-slate-500 text-[11px]">
                      {student.hod?.employeeId ? `Emp ID: ${student.hod.employeeId}` : 'Department Sanctioning Authority'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Specific Information */}
        {staff && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Employee ID</span>
              <span className="font-bold text-slate-900 text-sm">{staff.employeeId}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Designated Role</span>
              <span className="font-bold text-blue-700 text-sm">{staff.role}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Department</span>
              <span className="font-bold text-slate-900 text-sm">{staff.department?.name || 'AI & DS'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
