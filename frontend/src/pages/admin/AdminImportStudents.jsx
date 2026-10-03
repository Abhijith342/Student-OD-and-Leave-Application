import React, { useState } from 'react';
import { apiRequest } from '../../services/api';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Download,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export default function AdminImportStudents() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

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

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/import-students/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Excel file processing failed.');
      }

      setPreview(data.data.preview);
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
      setPreview(null);
      setSelectedFile(null);
    } catch (err) {
      setError(err.message || 'Failed to complete student import.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Data Onboarding</span>
          </div>
          <h1 className="text-2xl font-black">Excel Student Import</h1>
          <p className="text-xs text-slate-300 mt-1">
            Upload institutional student spreadsheets (`student_import_template.xlsx`). Validates duplicates, department resolution, staff mapping, and imports records into database.
          </p>
        </div>

        <a
          href="/Student_Import_Template.xlsx"
          download="Student_Import_Template.xlsx"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-md transition-colors flex items-center space-x-2 shrink-0"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Download Excel Template</span>
        </a>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-800 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Banner */}
      {importResult && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center space-x-3 text-emerald-800 font-bold text-sm">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <span>Excel Student Import Complete!</span>
          </div>
          <p className="text-xs text-emerald-700">
            Successfully imported <strong>{importResult.importedCount}</strong> student records into the database. User login accounts have been provisioned automatically.
          </p>
        </div>
      )}

      {/* File Upload Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Step 1: Select Student Excel File</h2>

        <form onSubmit={handleUploadPreview} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-700">
              {selectedFile ? selectedFile.name : 'Click or Drag & Drop Excel file (.xlsx / .xls)'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Supported columns: Student Name, Register Number, Roll Number, Department, Year, Section, Email, Phone numbers, Tutor, Class Advisor, HOD</p>
            
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="mt-4 block mx-auto text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Validating Excel Rows...' : 'Upload & Validate Data'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Validation Preview & Error Report */}
      {preview && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Step 2: Excel Import Validation Report</h2>
              <p className="text-xs text-slate-500">Review row validation check results before database import execution</p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="px-3 py-1 bg-blue-50 text-blue-800 font-bold rounded-lg border border-blue-200">
                Total Rows: {preview.totalRows}
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
                Valid: {preview.validCount}
              </span>
              <span className="px-3 py-1 bg-rose-50 text-rose-800 font-bold rounded-lg border border-rose-200">
                Errors: {preview.errorCount}
              </span>
            </div>
          </div>

          {/* Row Errors Report List */}
          {preview.errorRows && preview.errorRows.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
              <h3 className="font-bold text-rose-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Validation Errors Detected ({preview.errorRows.length} Rows with Issues)</span>
              </h3>
              <p className="text-rose-700 text-[11px]">
                Invalid rows will be skipped during import. Fix values in Excel if you wish to import them.
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pt-2 border-t border-rose-200">
                {preview.errorRows.map((err, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-lg border border-rose-200 text-rose-800 font-mono text-[11px]">
                    <strong>Row {err.rowNumber}:</strong> Register No: {err.registerNumber || 'N/A'} | Error: <span className="text-rose-600 font-bold">{err.errors ? err.errors.join('; ') : err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid Rows Preview Table */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
              Valid Rows Ready for Database Import ({preview.validRows.length})
            </h3>
            <div className="overflow-x-auto max-h-80 border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-3">Reg Number</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Dept</th>
                    <th className="p-3">Yr & Sec</th>
                    <th className="p-3">Parent Phone</th>
                    <th className="p-3">Resolved Tutor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.validRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold font-mono text-slate-900">{row.registerNumber}</td>
                      <td className="p-3 font-bold text-slate-800">{row.name}</td>
                      <td className="p-3 font-semibold text-slate-700">{row.departmentCode || row.departmentName}</td>
                      <td className="p-3">Yr {row.year} - Sec {row.section}</td>
                      <td className="p-3 font-mono text-emerald-700">{row.parentPhone || 'N/A'}</td>
                      <td className="p-3 font-medium text-slate-700">{row.tutorName || 'N PREMKUMAR'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleConfirmImport}
              disabled={confirming || preview.validRows.length === 0}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{confirming ? 'Importing Student Records...' : `Confirm & Import ${preview.validRows.length} Students`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
