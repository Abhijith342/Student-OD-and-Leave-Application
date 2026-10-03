import React from 'react';
import { CheckCircle2, Clock, XCircle, Circle } from 'lucide-react';

export default function ApprovalTimeline({ application }) {
  const isOD = application.type === 'OD';
  const isRejected = application.status === 'REJECTED' || application.currentStage === 'REJECTED';

  // Stages definitions
  const odSteps = [
    { key: 'SUBMITTED', title: 'Application Submitted', role: 'STUDENT' },
    { key: 'TUTOR_PENDING', title: 'Tutor Approval', role: 'TUTOR' },
    { key: 'ADVISOR_PENDING', title: 'Parent Confirmation', role: 'CLASS_ADVISOR' },
    { key: 'HOD_PENDING', title: 'HOD Approval', role: 'HOD' },
    { key: 'PRINCIPAL_PENDING', title: 'Principal Office Seal', role: 'PRINCIPAL_OFFICE' },
    { key: 'COMPLETED', title: 'OD Completed', role: 'SYSTEM' },
  ];

  const leaveSteps = [
    { key: 'SUBMITTED', title: 'Application Submitted', role: 'STUDENT' },
    { key: 'TUTOR_PENDING', title: 'Tutor Approval', role: 'TUTOR' },
    { key: 'ADVISOR_PENDING', title: 'Parent Confirmation', role: 'CLASS_ADVISOR' },
    { key: 'HOD_PENDING', title: 'HOD Approval & Final', role: 'HOD' },
    { key: 'COMPLETED', title: 'Leave Approved', role: 'SYSTEM' },
  ];

  const steps = isOD ? odSteps : leaveSteps;

  // Map application audit history to find details for each step
  const histories = application.approvalHistories || [];
  const parentConf = application.parentConfirmation;

  // Determine state of each step index
  const stageOrder = steps.map(s => s.key);
  const currentStageIndex = stageOrder.indexOf(application.currentStage);

  return (
    <div className="py-4">
      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
        Approval Workflow & Audit Pipeline ({isOD ? 'OD 5-Step Workflow' : 'Leave 4-Step Workflow'})
      </h4>

      <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
        {steps.map((step, idx) => {
          let stepStatus = 'NOT_STARTED'; // GREEN, YELLOW, RED, GRAY
          let historyMatch = null;
          let extraDetail = null;

          if (step.key === 'SUBMITTED') {
            stepStatus = 'COMPLETED';
            extraDetail = `Submitted on ${new Date(application.createdAt).toLocaleString()}`;
          } else if (step.key === 'TUTOR_PENDING') {
            historyMatch = histories.find(h => h.role === 'TUTOR');
            if (historyMatch) {
              stepStatus = historyMatch.action === 'APPROVED' ? 'COMPLETED' : 'REJECTED';
            } else if (application.currentStage === 'TUTOR_PENDING') {
              stepStatus = 'CURRENT';
            }
          } else if (step.key === 'ADVISOR_PENDING') {
            historyMatch = histories.find(h => h.role === 'CLASS_ADVISOR');
            if (historyMatch) {
              stepStatus = 'COMPLETED';
            } else if (application.currentStage === 'ADVISOR_PENDING') {
              stepStatus = 'CURRENT';
            }
            if (parentConf) {
              extraDetail = `Parent ${parentConf.isConfirmed ? 'Confirmed' : 'Not Confirmed'} by Advisor ${parentConf.advisor?.name || ''} on ${new Date(parentConf.confirmedAt).toLocaleDateString()}`;
            }
          } else if (step.key === 'HOD_PENDING') {
            historyMatch = histories.find(h => h.role === 'HOD');
            if (historyMatch) {
              stepStatus = historyMatch.action === 'APPROVED' ? 'COMPLETED' : 'REJECTED';
            } else if (application.currentStage === 'HOD_PENDING') {
              stepStatus = 'CURRENT';
            }
          } else if (step.key === 'PRINCIPAL_PENDING') {
            historyMatch = histories.find(h => h.role === 'PRINCIPAL_OFFICE');
            if (historyMatch) {
              stepStatus = 'COMPLETED';
            } else if (application.currentStage === 'PRINCIPAL_PENDING') {
              stepStatus = 'CURRENT';
            }
          } else if (step.key === 'COMPLETED') {
            if (application.status === 'APPROVED' || application.currentStage === 'COMPLETED') {
              stepStatus = 'COMPLETED';
            } else if (isRejected) {
              stepStatus = 'NOT_STARTED';
            }
          }

          // If current step is rejected
          if (isRejected && application.currentStage === 'REJECTED' && currentStageIndex === idx) {
            stepStatus = 'REJECTED';
          }

          // Node Icon & Color
          let icon = <Circle className="w-5 h-5 text-slate-300 fill-slate-100" />;
          let nodeBg = 'bg-slate-100 border-slate-300';
          let textColor = 'text-slate-500';

          if (stepStatus === 'COMPLETED') {
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />;
            nodeBg = 'border-emerald-500';
            textColor = 'text-slate-900 font-semibold';
          } else if (stepStatus === 'CURRENT') {
            icon = <Clock className="w-5 h-5 text-amber-500 fill-amber-50 animate-pulse" />;
            nodeBg = 'border-amber-400';
            textColor = 'text-amber-900 font-bold';
          } else if (stepStatus === 'REJECTED') {
            icon = <XCircle className="w-5 h-5 text-rose-600 fill-rose-50" />;
            nodeBg = 'border-rose-500';
            textColor = 'text-rose-900 font-semibold';
          }

          return (
            <div key={step.key} className="relative group">
              {/* Dot Icon positioned over line */}
              <div className="absolute -left-[35px] top-0 bg-white rounded-full">
                {icon}
              </div>

              {/* Content Box */}
              <div className={`p-3 rounded-lg border bg-white shadow-xs ${
                stepStatus === 'CURRENT' ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h5 className={`text-sm ${textColor}`}>{step.title}</h5>
                  {stepStatus === 'COMPLETED' && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Done
                    </span>
                  )}
                  {stepStatus === 'CURRENT' && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Processing / Pending
                    </span>
                  )}
                </div>

                {/* Audit log text */}
                {historyMatch && (
                  <div className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <p className="font-medium">
                      Action by: <span className="text-slate-900">{historyMatch.staff?.name || 'Staff'}</span> ({historyMatch.role})
                    </p>
                    {historyMatch.remarks && (
                      <p className="italic text-slate-500 mt-0.5">"{historyMatch.remarks}"</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(historyMatch.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}

                {extraDetail && !historyMatch && (
                  <p className="mt-1 text-xs text-slate-600 italic">{extraDetail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
