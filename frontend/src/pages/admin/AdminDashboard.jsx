import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge, StageBadge } from '../../components/StatusBadge';
import DepartmentStudentImportModal from '../../components/DepartmentStudentImportModal';
import { 
  Users, 
  UserCheck, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  PlusCircle, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  GraduationCap, 
  Layers, 
  Search, 
  ArrowRight, 
  AlertCircle, 
  ExternalLink, 
  Info, 
  Plus, 
  FileSpreadsheet,
  X,
  KeyRound
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active View Tab: 'overview' | 'departments'
  const [activeTab, setActiveTab] = useState('overview');

  // Department Selection & Student Search
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedYearNum, setSelectedYearNum] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');



  // Excel Student Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTargetYear, setImportTargetYear] = useState('1');
  const [importTargetSection, setImportTargetSection] = useState('A');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/admin/dashboard');
      setData(res.data);

      if (res.data?.departmentStats?.length > 0) {
        const firstDept = res.data.departmentStats[0];
        setSelectedDeptId(prev => prev && res.data.departmentStats.some(d => d.id === prev) ? prev : firstDept.id);
        const cur = res.data.departmentStats.find(d => d.id === (selectedDeptId || firstDept.id)) || firstDept;
        if (cur.addedYears?.length > 0) {
          setSelectedYearNum(cur.addedYears[0].year);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSelectDepartment = (dept) => {
    setSelectedDeptId(dept.id);
    if (dept.addedYears?.length > 0) {
      setSelectedYearNum(dept.addedYears[0].year);
    } else {
      setSelectedYearNum(null);
    }
  };



  const openImportModalForCohort = (year = '1', section = 'A') => {
    setImportTargetYear(String(year));
    setImportTargetSection(section);
    setShowImportModal(true);
  };

  if (loading && !data) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs font-semibold text-slate-600">Loading system administration metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium text-center">
        {error}
      </div>
    );
  }

  const { overview, recentApplications, recentlyAddedStudents, recentlyAddedStaff, departmentStats } = data;

  const currentDept = departmentStats.find(d => d.id === selectedDeptId) || departmentStats[0];
  const currentYearData = currentDept?.addedYears?.find(y => y.year === selectedYearNum) || currentDept?.addedYears?.[0] || null;

  const filteredStudents = currentYearData?.studentsSample?.filter(s => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.registerNumber?.toLowerCase().includes(term) ||
      s.rollNumber?.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Institutional Control Panel</span>
          </div>
          <h1 className="text-2xl font-black">System Administration</h1>
          <p className="text-xs text-slate-300 mt-1">
            Manage academic departments, four-year undergraduate student cohorts, faculty allocations, and live OD & Leave applications.
          </p>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Link
            to="/admin/import-students"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </Link>
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
          <Link
            to="/admin/students"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Manage Students</span>
          </Link>
        </div>
      </div>

      {/* Main View Switcher Pills */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Workflow & Metrics Overview</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('departments');
            if (departmentStats?.length > 0) {
              handleSelectDepartment(departmentStats[0]);
            }
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'departments'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-500" />
          <span>Departments & Student Import</span>
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full font-extrabold">
            {currentDept ? currentDept.displayCode || 'AIDS' : 'AIDS'}
          </span>
        </button>
      </div>

      {/* Pending Password Reset Banner */}
      {overview.pendingPasswordResets > 0 && (
        <div 
          onClick={() => navigate('/admin/password-resets')}
          className="p-4 bg-amber-50 border border-amber-300 rounded-2xl shadow-xs flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-xs">
                {overview.pendingPasswordResets} Student Password Reset {overview.pendingPasswordResets === 1 ? 'Request' : 'Requests'} Pending Action
              </h4>
              <p className="text-[11px] text-amber-800">
                Click here to review requests and reset passwords to the initial default password (Password123!).
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs">
            Review Resets →
          </span>
        </div>
      )}

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{overview.totalStudents}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{overview.totalStaff}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Interactive Departments Card */}
        <div 
          onClick={() => {
            setActiveTab('departments');
            if (departmentStats?.length > 0) handleSelectDepartment(departmentStats[0]);
          }}
          className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group"
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departments</p>
              <span className="text-[10px] font-bold text-purple-600 group-hover:underline">Manage →</span>
            </div>
            <p className="text-3xl font-black text-purple-700 mt-1">{overview.totalDepartments}</p>
            <span className="text-[10px] text-purple-600 font-medium block">
              {departmentStats[0]?.displayCode || 'AIDS'} (Year 3 Active)
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Requests</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{overview.pendingOD + overview.pendingLeave}</p>
            <span className="text-[10px] text-slate-400">OD: {overview.pendingOD} | Leave: {overview.pendingLeave}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* VIEW 1: DEPARTMENTS & EXCEL IMPORT BY YEAR AND SECTION */}
      {activeTab === 'departments' && currentDept && (
        <div className="space-y-6">
          
          {/* Various Departments Available Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Various Departments Available</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select a department to view enrolled academic years, or add new students using Excel import by year and section.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                  Self-Assigned from Import
                </span>
                <Link
                  to="/admin/departments"
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1 ml-2"
                >
                  <span>View Structure</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Department Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {departmentStats.map((dept) => {
                const isSelected = dept.id === currentDept.id;
                const displayCode = dept.displayCode || (dept.code === 'AI_DS' ? 'AIDS' : dept.code);

                return (
                  <button
                    key={dept.id}
                    onClick={() => handleSelectDepartment(dept)}
                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-black tracking-wider uppercase ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {displayCode}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">({dept.code})</span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs mt-1.5 leading-snug">{dept.name}</p>
                      </div>

                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 w-full">
                      <span><strong>{dept.studentCount}</strong> Students</span>
                      <span>HOD: <strong className="text-slate-700">{dept.hod?.name || 'Unassigned'}</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Department Overview Banner with Direct Excel Import Action */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-blue-500/40 border border-blue-400/40 text-blue-200 text-[11px] font-black rounded uppercase">
                    {currentDept.displayCode || 'AIDS'}
                  </span>
                  <span className="text-xs text-blue-300 font-semibold">• 4-Year B.Tech / B.E. Degree Program</span>
                </div>
                <h3 className="text-xl font-black">{currentDept.name}</h3>
                <p className="text-xs text-slate-300">
                  Head of Department (HOD): <strong className="text-white">{currentDept.hod?.name || 'Unassigned'}</strong> {currentDept.hod?.employeeId ? `(${currentDept.hod.employeeId})` : ''}
                </p>
              </div>

              {/* Direct Excel Import & Hierarchy Link Button */}
              <div className="flex items-center gap-3">
                <Link
                  to={`/admin/departments?deptId=${currentDept.id}`}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center space-x-1.5"
                >
                  <span>Explore Hierarchy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => openImportModalForCohort(currentYearData?.year || '1', 'A')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Import Students via Excel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-white/10">
              <div>
                <span className="text-blue-300 text-[10px] uppercase block font-bold">Total Enrolled</span>
                <strong className="text-lg text-white">{currentDept.studentCount} Students</strong>
              </div>
              <div>
                <span className="text-blue-300 text-[10px] uppercase block font-bold">Faculty Staff</span>
                <strong className="text-lg text-white">{currentDept.staffCount} Members</strong>
              </div>
              <div>
                <span className="text-blue-300 text-[10px] uppercase block font-bold">Active Years</span>
                <strong className="text-lg text-emerald-300">
                  {currentDept.addedYears?.length || 0} of 4 Years
                </strong>
              </div>
              <div>
                <span className="text-blue-300 text-[10px] uppercase block font-bold">Pending Years</span>
                <strong className="text-lg text-amber-300">
                  {currentDept.unaddedYears?.length || 0} Years
                </strong>
              </div>
            </div>
          </div>

          {/* ACADEMIC YEARS EXPLORER (Only displays added years, e.g. 3rd Year) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span>Academic Years in {currentDept.displayCode || 'AIDS'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Degree program contains 4 years. Unadded years are omitted; select an active year or import students into a new year.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{currentDept.addedYears?.length || 0} Year(s) Active</span>
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold">
                  {currentDept.unaddedYears?.length || 3} Year(s) Not Added
                </span>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-3">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  Program Structure: 4 Years total (1st Year, 2nd Year, 3rd Year, 4th Year).
                </p>
                <p className="text-[11px] text-blue-800">
                  Currently, students for <strong>Years 1, 2, and 4 are not added yet</strong>, so only the <strong>3rd Year</strong> is displayed. Whenever new year cohorts are imported using the button below, they will automatically appear here!
                </p>
              </div>
            </div>

            {/* DYNAMIC YEARS SELECTOR TABS (Only displays added years) */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {currentDept.addedYears && currentDept.addedYears.length > 0 ? (
                  currentDept.addedYears.map((yr) => {
                    const isSelected = yr.year === currentYearData?.year;
                    return (
                      <button
                        key={yr.year}
                        onClick={() => setSelectedYearNum(yr.year)}
                        className={`px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center space-x-3 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-500/20'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Layers className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                        <span>{yr.yearName} (Year {yr.year})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {yr.studentCount} Students
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">No academic years with student records found.</p>
                )}

                {/* Indication of Unadded Years with Quick Excel Import */}
                <div className="flex flex-wrap items-center gap-2 pl-2 text-[11px] text-slate-500">
                  <span>Not added yet:</span>
                  {currentDept.unaddedYears?.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => openImportModalForCohort(yr, 'A')}
                      title={`Click to import students for Year ${yr}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-slate-600 rounded-md font-bold transition-colors flex items-center space-x-1"
                    >
                      <span>Year {yr}</span>
                      <span className="text-emerald-600 font-extrabold">+ Import Excel</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTIVE YEAR DETAILS & SECTIONS VIEW */}
              {currentYearData && (
                <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6">
                  {/* Year Summary Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 bg-blue-600 text-white font-mono text-[11px] font-bold rounded">
                          {currentYearData.yearName}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {currentDept.displayCode || 'AIDS'} • Academic Year {currentYearData.year}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <strong>{currentYearData.studentCount}</strong> enrolled students across {currentYearData.sections.length} active section(s).
                      </p>
                    </div>

                    {/* Quick Action Navigation Links */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        onClick={() => openImportModalForCohort(currentYearData.year, 'A')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Import into Year {currentYearData.year}</span>
                      </button>

                      <Link
                        to={`/admin/students?departmentId=${currentDept.id}&year=${currentYearData.year}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>View Students ({currentYearData.studentCount})</span>
                      </Link>

                      <Link
                        to={`/admin/applications?departmentId=${currentDept.id}&year=${currentYearData.year}`}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Applications</span>
                      </Link>
                    </div>
                  </div>

                  {/* Section Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentYearData.sections.map((sec, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <span>Section {sec.section}</span>
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded">
                            {sec.studentCount} Students
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-start justify-between">
                            <span className="text-slate-500 font-semibold">Tutors:</span>
                            <span className="font-bold text-slate-800 text-right">
                              {sec.tutors.length > 0 ? sec.tutors.map(t => t.name).join(', ') : 'N PREMKUMAR, C DIVYA REVATHI'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-slate-500 font-semibold">Class Advisor:</span>
                            <span className="font-bold text-purple-700 text-right">
                              {sec.classAdvisors.length > 0 ? sec.classAdvisors.map(a => a.name).join(', ') : 'N PREMKUMAR'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => openImportModalForCohort(currentYearData.year, sec.section)}
                            className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center space-x-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Import into Sec {sec.section}</span>
                          </button>

                          <Link
                            to={`/admin/students?departmentId=${currentDept.id}&year=${currentYearData.year}&section=${sec.section}`}
                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-1"
                          >
                            <span>Filter Students</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Student Roster Live Preview for Active Year */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                          Enrolled Students Roster ({currentYearData.yearName})
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Live database records for {currentDept.displayCode || 'AIDS'} Year {currentYearData.year}
                        </span>
                      </div>

                      {/* Search box for students */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Search student or register #..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                          <tr>
                            <th className="p-2.5">Register #</th>
                            <th className="p-2.5">Student Name</th>
                            <th className="p-2.5">Section</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5 text-right">Directory</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-4 text-center text-slate-400 text-xs">
                                No students match the search term.
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((st) => (
                              <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-slate-800">{st.registerNumber}</td>
                                <td className="p-2.5 font-bold text-slate-900">{st.name}</td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded">
                                    Sec {st.section}
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-500 text-[11px] font-mono">{st.email || '—'}</td>
                                <td className="p-2.5 text-right">
                                  <Link
                                    to={`/admin/students?search=${st.registerNumber}`}
                                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center justify-end space-x-1"
                                  >
                                    <span>Profile</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: STANDARD OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Secondary Workflow Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Approved Applications</span>
                <span className="text-xl font-black text-emerald-600">{overview.approvedApplications}</span>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Rejected Applications</span>
                <span className="text-xl font-black text-rose-600">{overview.rejectedApplications}</span>
              </div>
              <XCircle className="w-6 h-6 text-rose-500" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Completed OD Seals</span>
                <span className="text-xl font-black text-blue-600">{overview.completedApplications}</span>
              </div>
              <ShieldCheck className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          {/* Main Content Grid: Recent Applications & Department Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Applications Monitoring Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Application Workflow Monitoring</h2>
                  <p className="text-xs text-slate-500">Live feed across all college departments (Read-only observer)</p>
                </div>
                <Link
                  to="/admin/applications"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentApplications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No applications recorded in system yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">App ID</th>
                        <th className="p-3.5">Student</th>
                        <th className="p-3.5">Type</th>
                        <th className="p-3.5">Stage</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 font-mono">#{app.applicationNumber}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-800 block">{app.student?.name}</span>
                            <span className="text-[10px] text-slate-400">{app.student?.registerNumber} • {app.student?.department?.code}</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              app.type === 'OD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {app.type}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <StageBadge stage={app.currentStage} />
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={app.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Department Breakdown & Recently Added Staff */}
            <div className="space-y-6">
              
              {/* Department Breakdown with Quick Select into Explorer */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Department Breakdown</h3>
                  <button
                    onClick={() => {
                      setActiveTab('departments');
                      if (departmentStats?.length > 0) handleSelectDepartment(departmentStats[0]);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>View Departments</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {departmentStats.map((dept) => {
                    const displayCode = dept.displayCode || (dept.code === 'AI_DS' ? 'AIDS' : dept.code);
                    return (
                      <div 
                        key={dept.id} 
                        onClick={() => {
                          setActiveTab('departments');
                          handleSelectDepartment(dept);
                        }}
                        className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl space-y-2 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800 flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-[10px]">
                              {displayCode}
                            </span>
                            <span>{dept.name}</span>
                          </span>
                          <span className="text-blue-600">{dept.studentCount} Students</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span>HOD: <strong className="text-slate-700">{dept.hod?.name || 'Unassigned'}</strong></span>
                          <span className="font-bold text-blue-700 hover:underline flex items-center space-x-0.5">
                            <span>Select & Import</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recently Added Staff */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Recent Staff</h3>
                  <Link to="/admin/staff" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
                </div>
                <div className="space-y-2">
                  {recentlyAddedStaff.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-bold text-slate-800 block">{s.name}</span>
                        <span className="text-[10px] text-slate-400">{s.employeeId} • {s.department?.code}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                        {s.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </>
      )}



      {/* Excel Student Import Modal (Embedded per department, year, section) */}
      <DepartmentStudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        department={currentDept}
        initialYear={importTargetYear}
        initialSection={importTargetSection}
        onSuccess={() => {
          fetchStats();
        }}
      />
    </div>
  );
}
