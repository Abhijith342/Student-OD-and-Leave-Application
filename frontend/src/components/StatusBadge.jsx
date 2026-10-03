import React from 'react';

export function StatusBadge({ status }) {
  let style = 'bg-gray-100 text-gray-800 border-gray-300';

  if (status === 'APPROVED' || status === 'COMPLETED') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
  } else if (status === 'PENDING') {
    style = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
  } else if (status === 'REJECTED') {
    style = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${style}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
        status === 'APPROVED' || status === 'COMPLETED' ? 'bg-emerald-500' :
        status === 'PENDING' ? 'bg-amber-500' : 'bg-rose-500'
      }`}></span>
      {status}
    </span>
  );
}

export function StageBadge({ stage }) {
  const stageLabels = {
    SUBMITTED: 'Submitted',
    TUTOR_PENDING: 'Tutor Review',
    ADVISOR_PENDING: 'Parent Confirmation',
    HOD_PENDING: 'HOD Approval',
    PRINCIPAL_PENDING: 'Principal Office',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected'
  };

  let color = 'bg-slate-100 text-slate-700 border-slate-300';
  if (stage === 'COMPLETED') color = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  else if (stage === 'REJECTED') color = 'bg-rose-100 text-rose-800 border-rose-300';
  else color = 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}>
      {stageLabels[stage] || stage}
    </span>
  );
}
