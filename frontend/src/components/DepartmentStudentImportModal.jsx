import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Download, 
  ArrowRight,
  Layers,
  Building2,
  Calendar
} from 'lucide-react';

export default function DepartmentStudentImportModal({
  isOpen,
  onClose,
  department,
  initialYear = '1',
  initialSection = 'A',
  onSuccess
}) {
  const [targetYear, setTargetYear] = useState(String(initialYear || '1'));
  const [targetSection, setTargetSection] = useState(initialSection || 'A');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !department) return null;

  const displayCode = department.displayCode || (department.code === 'AI_DS' ? 'AIDS' : department.code);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreview(null);
      setImportResult(null);
      setError(null);
    }
  };

  const handleUploadPreview = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an Excel file (.xlsx) to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('departmentId', department.id);
    formData.append('year', targetYear);
    formData.append('section', targetSection);

    try {
      const res = await apiRequest('/admin/import-students/upload', {
        method: 'POST',
        body: formData
      });

      setPreview(res.data.preview);
    } catch (err) {
      setError(err.message || 'Failed to parse Excel file.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || !preview.validRows || preview.validRows.length === 0) {
      return;
    }

    setConfirming(true);
    setError(null);

    try {
      const res = await apiRequest('/admin/import-students/confirm', {
        method: 'POST',
        body: JSON.stringify({ validRows: preview.validRows })
      });

      setImportResult(res.data);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to complete student import.');
    } finally {
      setConfirming(false);
    }
  };

  const handleResetAndClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setImportResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden text-xs">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Import Students via Excel</h3>
              <p className="text-[11px] text-blue-300">
                Department: <strong>{displayCode}</strong> ({department.name})
              </p>
            </div>
          </div>
          <button 
            onClick={handleResetAndClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Global Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {importResult && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Student Import Successful!</h4>
                <p className="text-emerald-800 text-xs mt-1">
                  Enrolled <strong>{importResult.importedCount} students</strong> into {displayCode} Year {targetYear} - Section {targetSection}.
                </p>
              </div>
              <button
                onClick={handleResetAndClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                Close & View Department
              </button>
            </div>
          )}

          {!importResult && !preview && (
            <form onSubmit={handleUploadPreview} className="space-y-4">
              {/* Target Scope Selection: Department, Year, Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Target Department, Year & Section</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Department</label>
                    <div className="p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-black">
                        {displayCode}
                      </span>
                      <span className="truncate">{department.name}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Academic Year *</label>
                    <select
                      value={targetYear}
                      onChange={(e) => setTargetYear(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="1">Year 1 (1st Year)</option>
                      <option value="2">Year 2 (2nd Year)</option>
                      <option value="3">Year 3 (3rd Year)</option>
                      <option value="4">Year 4 (4th Year)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Section *</label>
                    <select
                      value={targetSection}
                      onChange={(e) => setTargetSection(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Download Sample Excel Template */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
                <div>
                  <span className="font-bold text-blue-900 block">Excel Import Template</span>
                  <span className="text-[11px] text-blue-700">Pre-structured for bulk student uploads</span>
                </div>
                <a
                  href="/Student_Import_Template.xlsx"
                  download="Student_Import_Template.xlsx"
                  className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </a>
              </div>

              {/* File Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Excel File (.xlsx) *</label>
                <input
                  type="file"
                  required
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="w-full p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Accepts standard Excel file containing Student Name, Register Number, and details.
                </span>
              </div>

              {/* Upload Button */}
              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-colors flex items-center space-x-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Processing File...' : 'Upload & Preview'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Preview & Confirmation Step */}
          {preview && !importResult && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Target Cohort</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {displayCode} • Year {targetYear} - Section {targetSection}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                    {preview.validCount} Valid Students
                  </span>
                  {preview.errorCount > 0 && (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg font-bold">
                      {preview.errorCount} Errors
                    </span>
                  )}
                </div>
              </div>

              {/* Errors Breakdown (if any) */}
              {(preview.errors || preview.errorRows) && (preview.errors || preview.errorRows).length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 max-h-36 overflow-y-auto">
                  <span className="font-bold text-rose-800 block text-[11px]">Rows with validation errors (skipped):</span>
                  {(preview.errors || preview.errorRows).map((err, idx) => (
                    <p key={idx} className="text-[10px] text-rose-700">
                      Row {err.row || err.rowNumber}: <strong>{err.registerNumber || err.studentName || err.name}</strong> — {err.error || (err.errors && err.errors.join('; '))}
                    </p>
                  ))}
                </div>
              )}

              {/* Valid Students Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2">Reg #</th>
                      <th className="p-2">Student Name</th>
                      <th className="p-2">Year & Sec</th>
                      <th className="p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.validRows.map((st, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-2 font-mono font-bold text-slate-800">{st.registerNumber}</td>
                        <td className="p-2 font-bold text-slate-900">{st.studentName || st.name}</td>
                        <td className="p-2 font-bold text-blue-700">Yr {targetYear} - Sec {targetSection}</td>
                        <td className="p-2 text-slate-500 font-mono text-[11px]">{st.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confirmation Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Choose Different File
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={confirming || preview.validCount === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {confirming ? 'Importing Students...' : `Confirm & Import ${preview.validCount} Students`}
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
