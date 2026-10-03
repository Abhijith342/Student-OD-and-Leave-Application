import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import ApprovalTimeline from '../components/ApprovalTimeline';
import { X, Eye, Calendar, MapPin, UserCheck, Paperclip, UserCheck2, Building2 } from 'lucide-react';

export default function ApplicationDetailsModal({ application, onClose }) {
  if (!application) return null;

  const { user } = useAuth();
  const isOD = application.type === 'OD';
  const token = localStorage.getItem('token');
  const student = application.student;

  const isApproved = application.status === 'APPROVED' || application.currentStage === 'COMPLETED';
  const isStudentOwner = user?.role === 'STUDENT' && user?.studentProfile?.id === application.studentId;
  const showPdfButton = isApproved && isStudentOwner;

  const handleViewPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/applications/${application.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'PDF generation failed. PDF certificate is only available for approved applications.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert(err.message || 'Could not view PDF');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-1 rounded text-xs font-bold ${
              isOD ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
            }`}>
              {application.type}
            </span>
            <div>
              <h3 className="font-bold text-base font-mono">#{application.applicationNumber}</h3>
              <p className="text-xs text-slate-400">
                Submitted on {new Date(application.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showPdfButton && (
              <button
                onClick={handleViewPDF}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Official Certificate (PDF)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Current Status:</span>
              <div className="mt-1">
                <StatusBadge status={application.status} />
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Current Stage:</span>
              <div className="mt-1">
                <StageBadge stage={application.currentStage} />
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Department:</span>
              <span className="font-bold text-slate-900 mt-1 block">
                {student?.department?.name || 'AI & DS'}
              </span>
            </div>
          </div>

          {/* Student Info & Staff Hierarchy Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Student Profile & Assigned Staff Hierarchy
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Name:</span>
                <span className="font-bold text-slate-800">{student?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Register Number:</span>
                <span className="font-bold text-slate-800">{student?.registerNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Roll Number:</span>
                <span className="font-bold text-blue-700">{student?.rollNumber || '22AD001'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Year & Sec:</span>
                <span className="font-bold text-slate-800">Year {student?.year} - Sec {student?.section}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Parent Phone:</span>
                <span className="font-bold text-emerald-700">{student?.parentPhone || 'Not Available'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Student Phone:</span>
                <span className="font-bold text-slate-800">{student?.studentPhone || 'Not Available'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                <span className="text-[10px] text-blue-700 font-bold block uppercase">Tutor</span>
                <span className="font-semibold text-slate-800">{student?.tutor?.name || 'N PREMKUMAR'}</span>
              </div>
              <div className="p-2 bg-purple-50/50 rounded-lg border border-purple-100">
                <span className="text-[10px] text-purple-700 font-bold block uppercase">Class Advisor</span>
                <span className="font-semibold text-slate-800">{student?.classAdvisor?.name || 'N PREMKUMAR'}</span>
              </div>
              <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">HOD</span>
                <span className="font-semibold text-slate-800">{student?.hod?.name || 'PAVITHRA'}</span>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {isOD ? 'OD Event Details' : 'Leave Details'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>Dates:</strong> {new Date(application.fromDate).toLocaleDateString()} to {new Date(application.toDate).toLocaleDateString()}
                </span>
              </div>

              {isOD ? (
                <>
                  <div>
                    <strong>Event:</strong> {application.eventName || 'N/A'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span><strong>Venue:</strong> {application.venue || 'N/A'}</span>
                  </div>
                </>
              ) : (
                <div>
                  <strong>Leave Type:</strong> {application.leaveType || 'General'}
                </div>
              )}
            </div>

            <div className="text-xs pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700 block">Reason:</span>
              <p className="text-slate-800 mt-0.5">{application.reason}</p>
            </div>

            {application.description && (
              <div className="text-xs pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block">Description:</span>
                <p className="text-slate-600 mt-0.5">{application.description}</p>
              </div>
            )}
          </div>

          {/* Parent Confirmation Record */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Parent Confirmation Record</h4>
            </div>

            {application.parentConfirmation ? (
              <div className="text-xs space-y-1">
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`font-bold ${application.parentConfirmation.isConfirmed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {application.parentConfirmation.isConfirmed ? 'CONFIRMED BY PARENT' : 'NOT CONFIRMED'}
                  </span>
                </p>
                <p><strong>Advisor:</strong> {application.parentConfirmation.advisor?.name || 'Class Advisor'}</p>
                <p><strong>Timestamp:</strong> {new Date(application.parentConfirmation.confirmedAt).toLocaleString()}</p>
                {application.parentConfirmation.remarks && (
                  <p className="italic text-slate-600">"{application.parentConfirmation.remarks}"</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Parent confirmation not yet recorded by Class Advisor.</p>
            )}
          </div>

          {/* Supporting Documents */}
          {application.documents && application.documents.length > 0 && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span>Supporting Documents</span>
              </h4>
              <div className="space-y-1.5">
                {application.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-xs font-medium text-blue-600 transition-colors"
                  >
                    <span className="truncate">{doc.fileName}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold px-2 py-0.5 bg-white rounded border">View File</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Live Workflow Timeline */}
          <ApprovalTimeline application={application} />
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
