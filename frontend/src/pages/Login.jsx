import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, CheckCircle, Eye, EyeOff, KeyRound, AlertCircle, Phone, Mail, X } from 'lucide-react';
import { apiRequest } from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotRegNo, setForgotRegNo] = useState('');
  const [forgotReason, setForgotReason] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);

    try {
      const res = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          registerNumber: forgotRegNo.trim(),
          reason: forgotReason.trim(),
          studentPhone: forgotPhone.trim(),
          email: forgotEmail.trim()
        })
      });

      setForgotSuccess(res.message || 'Password reset request submitted successfully!');
    } catch (err) {
      setForgotError(err.message || 'Failed to submit password reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotRegNo('');
    setForgotReason('');
    setForgotPhone('');
    setForgotEmail('');
    setForgotError(null);
    setForgotSuccess(null);
  };

  const fillDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  const demoAccounts = [
    { label: 'Admin (Institutional)', username: 'admin', pass: 'Password123!', role: 'ADMIN', desc: 'Full Management & Reset' },
    { label: 'Tutor (Divya)', username: 'divya', pass: 'Password123!', role: 'TUTOR', desc: 'Assigned Tutor (AI & DS)' },
    { label: 'Class Advisor (Premkumar)', username: 'premkumar', pass: 'Password123!', role: 'CLASS_ADVISOR', desc: 'Stage 2 Review & Forward' },
    { label: 'HOD (Dr. Pavithra)', username: 'pavithra', pass: 'Password123!', role: 'HOD', desc: 'Department Head' },
    { label: 'Principal Office', username: 'principal_office', pass: 'Password123!', role: 'PRINCIPAL_OFFICE', desc: 'Final Institutional OD Seal' }
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
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Student & Staff Portal</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Student Initial Login: <strong>Register Number</strong> & <strong>Password123!</strong></span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Centralized Admin Management for Student Profiles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Forgot Password Requests directly processed by Admin</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated Multi-Tier OD & Leave Approval Hierarchy</span>
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
                Register Number / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 710724243001 or admin"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
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

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-slate-500">
                Initial: <strong className="font-mono text-slate-700">Password123!</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setForgotRegNo(username.trim());
                  setShowForgotModal(true);
                }}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Staff Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Institutional Staff Logins:
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
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Students: Sign in with your Register Number & <span className="font-mono font-bold text-slate-600">Password123!</span>
            </p>
          </div>
        </div>

      </div>

      {/* Forgot Password Request Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Forgot Password</h3>
                  <p className="text-slate-500 text-[11px]">Request Administrator Password Reset</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs">Request Received by Admin</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    {forgotSuccess}
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900 font-semibold">
                    Once processed, your password will be reset to: <span className="font-mono font-bold underline">Password123!</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <p className="text-slate-500 text-[11px]">
                  Enter your student <strong>Register Number</strong>. Your institutional administrator will verify your request and reset your password to the default initial password (<strong className="font-mono">Password123!</strong>).
                </p>

                {forgotError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student Register Number *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 710724243001"
                      value={forgotRegNo}
                      onChange={(e) => setForgotRegNo(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contact Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Reason / Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Changed password and cannot recall it"
                    value={forgotReason}
                    onChange={(e) => setForgotReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {forgotLoading ? 'Submitting...' : 'Submit Request to Admin'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
