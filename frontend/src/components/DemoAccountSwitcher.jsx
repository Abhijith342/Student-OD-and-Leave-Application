import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Shield, GraduationCap, UserCheck2, Building2 } from 'lucide-react';

export default function DemoAccountSwitcher() {
  const { login, user } = useAuth();

  const demoUsers = [
    { label: 'Abinaya N (Student)', role: 'STUDENT', username: '710724243001', icon: GraduationCap },
    { label: 'Premkumar (Tutor & Advisor)', role: 'CLASS_ADVISOR', username: 'premkumar', icon: UserCheck2 },
    { label: 'Divya Revathi (Tutor)', role: 'TUTOR', username: 'divya', icon: UserCheck },
    { label: 'Pavithra (HOD)', role: 'HOD', username: 'pavithra', icon: Building2 },
    { label: 'Principal Office', role: 'PRINCIPAL_OFFICE', username: 'principal_office', icon: Shield },
  ];

  const handleSwitch = async (username) => {
    try {
      await login(username, 'Password123!');
    } catch (err) {
      console.error('Failed demo switch:', err);
    }
  };

  return (
    <div className="bg-slate-900 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between border-b border-slate-800">
      <div className="flex items-center space-x-2 font-medium">
        <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Direct Excel Dataset</span>
        <span className="text-slate-300">Logged in: <strong className="text-white">{user?.username} ({user?.role})</strong></span>
      </div>

      <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
        <span className="text-slate-400 mr-1 hidden md:inline">Quick Login:</span>
        {demoUsers.map((u) => {
          const Icon = u.icon;
          const isActive = user?.username === u.username;
          return (
            <button
              key={u.username}
              onClick={() => handleSwitch(u.username)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{u.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
