import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { FileCheck, Upload, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ApplyOD() {
  const { user } = useAuth();
  const student = user?.studentProfile;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
    eventName: '',
    venue: '',
    description: '',
  });

  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit. Please upload a smaller file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const validateForm = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fromDate || !formData.toDate || !formData.reason || !formData.eventName || !formData.venue) {
      setError('Please fill in all required fields (From Date, To Date, Event Name, Venue, Reason).');
      return;
    }

    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      setError('To Date cannot be earlier than From Date.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError('');

    try {
      const data = new FormData();
      data.append('fromDate', formData.fromDate);
      data.append('toDate', formData.toDate);
      data.append('reason', formData.reason);
      data.append('eventName', formData.eventName);
      data.append('venue', formData.venue);
      data.append('description', formData.description);

      if (file) {
        data.append('document', file);
      }

      const res = await apiRequest('/applications/od', {
        method: 'POST',
        body: data,
      });

      setSuccessResult(res.data.application);
    } catch (err) {
      setError(err.message || 'Failed to submit OD application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">OD Application Submitted Successfully!</h2>
        <p className="text-sm text-slate-600">
          Your application has been logged with Application ID:
        </p>
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl font-mono text-xl font-bold inline-block">
          #{successResult.applicationNumber}
        </div>
        <p className="text-xs text-slate-500">
          Your Tutor ({student?.tutor?.name || 'Assigned Tutor'}) has been notified to start the 5-step approval workflow.
        </p>
        <div className="pt-4 flex justify-center space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">On-Duty (OD) Application Form</h2>
          <p className="text-xs text-slate-500">Fill out details for college On-Duty leave authorization</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={validateForm} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Section 1: Auto-populated Student Details */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
            Student & Staff Hierarchy (Auto-populated)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 font-medium block">Student Name</span>
              <span className="font-bold text-slate-900 text-sm">{student?.name}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 font-medium block">Register Number</span>
              <span className="font-bold text-slate-900 text-sm">{student?.registerNumber}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 font-medium block">Roll Number</span>
              <span className="font-bold text-blue-700 text-sm">{student?.rollNumber || '22AD001'}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 font-medium block">Department & Year</span>
              <span className="font-bold text-slate-900 text-sm">{student?.department?.name} (Yr {student?.year} - Sec {student?.section})</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 font-medium block">Assigned Tutor</span>
              <span className="font-bold text-slate-900 text-sm">{student?.tutor?.name || 'Dr. Robert Vance'}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 font-medium block">Class Advisor</span>
              <span className="font-bold text-slate-900 text-sm">{student?.classAdvisor?.name || 'Prof. Clara Oswald'}</span>
            </div>
          </div>
        </div>

        {/* Section 2: OD Event & Schedule Information */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            OD Event & Date Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                From Date *
              </label>
              <input
                type="date"
                name="fromDate"
                required
                value={formData.fromDate}
                onChange={handleChange}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                To Date *
              </label>
              <input
                type="date"
                name="toDate"
                required
                value={formData.toDate}
                onChange={handleChange}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event / Activity Name *
              </label>
              <input
                type="text"
                name="eventName"
                required
                placeholder="e.g. National Hackathon / Sports Meet / Paper Presentation"
                value={formData.eventName}
                onChange={handleChange}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Venue *
              </label>
              <input
                type="text"
                name="venue"
                required
                placeholder="e.g. IIT Madras, Chennai"
                value={formData.venue}
                onChange={handleChange}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason for OD *
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="e.g. Representing college in National Level Artificial Intelligence Hackathon"
              value={formData.reason}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Description / Project Details
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Add extra details regarding your participation..."
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            />
          </div>
        </div>

        {/* Section 3: Document Upload */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
            Supporting Document (Brochure / Call Letter / Event Proof)
          </h3>
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Click to upload document or drag & drop</p>
            <p className="text-[11px] text-slate-500 mt-1">PDF, PNG, JPG or JPEG up to 5MB</p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="mt-3 text-xs mx-auto block"
            />
            {file && (
              <p className="mt-2 text-xs font-semibold text-emerald-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20"
          >
            Submit OD Application
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirm OD Submission</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to submit this OD application for <strong>{formData.eventName}</strong> from <strong>{formData.fromDate}</strong> to <strong>{formData.toDate}</strong>?
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border text-xs space-y-1">
              <p><strong>Student:</strong> {student?.name} (Reg: {student?.registerNumber}, Roll: {student?.rollNumber || '22AD001'})</p>
              <p><strong>Reason:</strong> {formData.reason}</p>
              <p><strong>Venue:</strong> {formData.venue}</p>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
