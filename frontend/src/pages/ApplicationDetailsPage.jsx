import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, StageBadge } from '../components/StatusBadge';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  PhoneCall, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Building,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function ApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchApp() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest(`/applications/${id}`);
        setApplication(res.data.application);
      } catch (err) {
        setError(err.message || 'Failed to load application details.');
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [id]);

  const handleViewPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/applications/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert(err.message || 'Could not view PDF');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-semibold text-slate-600">Loading application details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-rose-200 shadow-xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Application Error</h2>
        <p className="text-xs text-slate-600">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  const { student, approvalHistories = [], parentConfirmation, documents = [] } = application;
  const isApproved = application.status === 'APPROVED' || application.currentStage === 'COMPLETED';
  const isStudentOwner = user?.role === 'STUDENT' && user?.studentProfile?.id === application.studentId;
  const showPdfButton = isApproved && isStudentOwner;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {showPdfButton && (
          <button
            onClick={handleViewPDF}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View Official Certificate (PDF)</span>
          </button>
        )}
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                application.type === 'OD' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
              }`}>
                {application.type} Application
              </span>
              <span className="text-slate-400 text-xs">#{application.applicationNumber}</span>
            </div>
            <h1 className="text-xl font-black">{application.reason}</h1>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <StatusBadge status={application.status} />
            <StageBadge stage={application.currentStage} />
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 space-y-6">
          {/* Student Information */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Student Profile Details</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Student Name</span>
                <strong className="text-slate-900">{student?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Register Number</span>
                <strong className="text-slate-900">{student?.registerNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Roll Number</span>
                <strong className="text-blue-700">{student?.rollNumber || '22AD001'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Department</span>
                <strong className="text-slate-900">{student?.department?.name || 'AI & DS'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Year & Section</span>
                <strong className="text-slate-900">Year {student?.year} - Sec {student?.section}</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Parent Phone</span>
                <strong className="text-emerald-700 font-mono text-sm">{student?.parentPhone || 'Not Available'}</strong>
              </div>
            </div>
          </div>

          {/* Application Specifics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <span className="font-bold text-slate-900 block flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Date Range & Duration</span>
              </span>
              <p className="text-slate-700">
                <strong>From:</strong> {new Date(application.fromDate).toLocaleDateString()}
              </p>
              <p className="text-slate-700">
                <strong>To:</strong> {new Date(application.toDate).toLocaleDateString()}
              </p>
            </div>

            {application.type === 'OD' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <span className="font-bold text-slate-900 block flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Event & Venue Details</span>
                </span>
                <p className="text-slate-700"><strong>Event:</strong> {application.eventName || 'N/A'}</p>
                <p className="text-slate-700"><strong>Venue:</strong> {application.venue || 'N/A'}</p>
              </div>
            )}
          </div>

          {/* Parent Confirmation Record */}
          {parentConfirmation && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-emerald-900 flex items-center space-x-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Class Advisor Parent Telephonic Confirmation</span>
              </span>
              <p className="text-emerald-800">
                <strong>Status:</strong> {parentConfirmation.isConfirmed ? '✓ CONFIRMED WITH PARENT/GUARDIAN' : '❌ NOT CONFIRMED'}
              </p>
              {parentConfirmation.remarks && (
                <p className="text-emerald-700">
                  <strong>Notes:</strong> {parentConfirmation.remarks}
                </p>
              )}
            </div>
          )}

          {/* Audit Approval Trait Timeline */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Approval Workflow History Log</span>
            </h3>
            {approvalHistories.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
                Pending initial review by Tutor.
              </p>
            ) : (
              <div className="space-y-3">
                {approvalHistories.map((history, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-slate-900">{history.role}</strong>
                        <span className="text-slate-500">({history.staff?.name})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          history.action === 'APPROVED' || history.action === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {history.action}
                        </span>
                      </div>
                      {history.remarks && (
                        <p className="text-slate-600 mt-1 italic">"{history.remarks}"</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(history.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
