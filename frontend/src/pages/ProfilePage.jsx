import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, UserCheck2, Building2, GraduationCap, FileText, Hash } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const student = user?.studentProfile;
  const staff = user?.staffProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">User Profile & Institutional Details</h2>
        <p className="text-xs text-slate-500">Student registration credentials, staff hierarchy, and department assignments</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-bold text-2xl flex items-center justify-center shadow-lg">
            {student?.name?.[0] || staff?.name?.[0] || user?.username?.[0]}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {student?.name || staff?.name || user?.username}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Student Specific Profile Cards */}
        {student && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Student Academic Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block">Register Number</span>
                  <span className="font-bold text-slate-900 text-sm">{student.registerNumber}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block">Roll Number</span>
                  <span className="font-bold text-blue-700 text-sm">{student.rollNumber || '22AD001'}</span>
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

            {/* Assigned Staff Approval Hierarchy */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Assigned Staff & Approval Hierarchy
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Tutor */}
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                    <UserCheck className="w-4 h-4" />
                    <span>Assigned Tutor</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{student.tutor?.name || 'Dr. Robert Vance'}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Emp ID: {student.tutor?.employeeId || 'EMP_TUTOR_01'}</p>
                </div>

                {/* Class Advisor */}
                <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-purple-700 font-bold">
                    <UserCheck2 className="w-4 h-4" />
                    <span>Class Advisor</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{student.classAdvisor?.name || 'Prof. Clara Oswald'}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Emp ID: {student.classAdvisor?.employeeId || 'EMP_ADVISOR_01'}</p>
                </div>

                {/* HOD */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                    <Building2 className="w-4 h-4" />
                    <span>Head of Department (HOD)</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{student.hod?.name || 'Dr. Alan Turing'}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Emp ID: {student.hod?.employeeId || 'EMP_HOD_01'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {staff && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Employee ID</span>
              <span className="font-bold text-slate-900 text-sm">{staff.employeeId}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Department</span>
              <span className="font-bold text-slate-900 text-sm">{staff.department?.name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
