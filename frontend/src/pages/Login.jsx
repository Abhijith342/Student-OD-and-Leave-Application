import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  const demoAccounts = [
    { label: 'Abinaya N (Student)', username: '710724243001', pass: 'Password123!', role: 'STUDENT', desc: 'Reg: 710724243001' },
    { label: 'S Abhijith (Student)', username: '710724243085', pass: 'Password123!', role: 'STUDENT', desc: 'Reg: 710724243085' },
    { label: 'Tutor (N Premkumar)', username: 'tutor_aids', pass: 'Password123!', role: 'TUTOR', desc: 'Assigned Tutor' },
    { label: 'Class Advisor', username: 'advisor_aids', pass: 'Password123!', role: 'CLASS_ADVISOR', desc: 'Parent Confirmation' },
    { label: 'HOD (Pavithra)', username: 'hod_aids', pass: 'Password123!', role: 'HOD', desc: 'HOD AI & DS' },
    { label: 'Principal Office', username: 'principal_office', pass: 'Password123!', role: 'PRINCIPAL_OFFICE', desc: 'Final Seal' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        
        {/* Left Info Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg mb-4">
              <img src="/logo.png" alt="Dr. N.G.P. Institute of Technology" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Dr. N.G.P. INSTITUTE OF TECHNOLOGY</h2>
            <p className="text-blue-400 font-semibold text-xs mt-0.5">COIMBATORE - 641048</p>
            <p className="text-slate-400 text-xs mt-1">Autonomous Institution • AI & DS Department</p>

            <div className="mt-8 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">System Features</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>5-Step OD Workflow (Tutor → Advisor → Parent → HOD → Principal)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>4-Step Leave Workflow (Direct HOD Approval)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct Excel Dataset Sync (`student_import_template.xlsx`)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Official PDF Certificates with College Logo & Seals</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500">
            © 2026 Dr. N.G.P. Institute of Technology. All rights reserved.
          </div>
        </div>

        {/* Right Form Area */}
        <div className="p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign In to Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Student OD & Leave Management System</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username / Register Number
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 710724243001 or tutor_aids"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Quick Logins from `student_import_template.xlsx`:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => fillDemoCredentials(acc.username, acc.pass)}
                  className="p-1.5 text-left border border-slate-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors text-[11px]"
                >
                  <p className="font-semibold text-slate-800">{acc.label}</p>
                  <p className="text-slate-400 text-[10px]">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
