import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  RefreshCw,
  Layers,
  FileCheck
} from 'lucide-react';

export default function ImportStudents() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [importing, setImporting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
        setErrorMsg('Please select a valid Excel file (.xlsx or .xls)');
        setFile(null);
        return;
      }
      setFile(selected);
      setErrorMsg('');
      setPreview(null);
      setSuccessResult(null);
    }
  };

  const handleValidateFile = async () => {
    setErrorMsg('');
    setLoading(true);
    setPreview(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }

      const res = await apiRequest('/students/import-preview', {
        method: 'POST',
        body: formData,
      });

      setPreview(res.data);
    } catch (err) {
      setErrorMsg(err.message || 'Validation failed. Please check your file.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || preview.validCount === 0) return;
    setImporting(true);
    setErrorMsg('');

    try {
      const res = await apiRequest('/students/import-confirm', {
        method: 'POST',
        body: JSON.stringify({ validRows: preview.validRows }),
      });

      setSuccessResult(res.data);
      setPreview(null);
      setFile(null);
    } catch (err) {
      setErrorMsg(err.message || 'Import failed during database execution.');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/Student_Import_Template.xlsx', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Admin Student Management</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Bulk Student Data Import</h2>
          <p className="text-xs text-slate-500">Import student records from Excel into the relational database</p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Excel Template</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success View */}
      {successResult && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Student Import Completed!</h3>
          <p className="text-sm text-slate-600">
            Successfully created <strong>{successResult.importedCount}</strong> student and user accounts in the database.
          </p>
          <button
            onClick={() => setSuccessResult(null)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
          >
            Import Another File
          </button>
        </div>
      )}

      {/* Upload Form Card */}
      {!preview && !successResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            1. Upload Student Excel File (.xlsx)
          </h3>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">Drag & Drop student Excel file (.xlsx) here</h4>
            <p className="text-xs text-slate-500 mt-1">Or browse to choose file from computer</p>

            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="mt-4 text-xs mx-auto block"
            />

            {file && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl font-bold text-xs inline-block">
                Selected File: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleDownloadTemplate}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Column Template</span>
            </button>

            <button
              onClick={handleValidateFile}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? 'Validating Excel...' : 'Validate File & Preview'}
            </button>
          </div>
        </div>
      )}

      {/* Import Preview Component */}
      {preview && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">2. Import Validation Preview</h3>
            <button
              onClick={() => setPreview(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel Preview
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase block">Total Rows</span>
              <span className="text-2xl font-black text-slate-900 mt-1">{preview.totalRows}</span>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs font-bold text-emerald-700 uppercase block">Valid Records</span>
              <span className="text-2xl font-black text-emerald-700 mt-1">{preview.validCount}</span>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-xs font-bold text-rose-700 uppercase block">Error Rows</span>
              <span className="text-2xl font-black text-rose-700 mt-1">{preview.errorCount}</span>
            </div>
          </div>

          {/* Error Details Section */}
          {preview.errorCount > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Validation Errors Detected ({preview.errorCount})</span>
                </h4>
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-xs font-bold text-rose-700 hover:underline"
                >
                  {showErrors ? 'Hide Error Details' : 'View Error Details'}
                </button>
              </div>

              {showErrors && (
                <div className="max-h-60 overflow-y-auto space-y-2 pt-2 border-t border-rose-200">
                  {preview.errors.map((err, i) => (
                    <div key={i} className="p-2.5 bg-white border border-rose-200 rounded-lg text-xs space-y-0.5">
                      <p className="font-bold text-rose-900">
                        Row {err.row}: {err.studentName || 'Student'} ({err.registerNumber || 'No Reg No'})
                      </p>
                      <p className="text-rose-700 italic">{err.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Valid Records Summary Table */}
          {preview.validCount > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Valid Student Records Ready for Import ({preview.validCount})
              </h4>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Reg No</th>
                      <th className="p-2.5">Roll No</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Tutor</th>
                      <th className="p-2.5">Advisor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.validRows.slice(0, 10).map((r) => (
                      <tr key={r.row} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-400">{r.row}</td>
                        <td className="p-2.5 font-bold text-slate-900">{r.studentName}</td>
                        <td className="p-2.5 font-mono">{r.registerNumber}</td>
                        <td className="p-2.5 text-blue-700 font-mono">{r.rollNumber}</td>
                        <td className="p-2.5 text-slate-600">{r.email}</td>
                        <td className="p-2.5 text-slate-600">{r.tutorName}</td>
                        <td className="p-2.5 text-slate-600">{r.advisorName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confirmation Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={importing || preview.validCount === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center space-x-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{importing ? 'Importing Students...' : `Confirm & Import ${preview.validCount} Valid Students`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
