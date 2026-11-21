import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { 
  Building2, 
  GraduationCap, 
  Layers, 
  Users, 
  UserCheck, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  Upload, 
  RefreshCw, 
  Phone, 
  Mail, 
  Award, 
  Home, 
  Bus, 
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';

export default function AdminDepartments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL Query Parameters for State Persistence
  const deptIdParam = searchParams.get('deptId') || null;
  const yearIdParam = searchParams.get('yearId') || null;
  const sectionIdParam = searchParams.get('sectionId') || null;

  // Master Data
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sub-level State
  const [departmentYears, setDepartmentYears] = useState([]);
  const [yearSections, setYearSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);

  // Student Search & Filter within section
  const [studentSearch, setStudentSearch] = useState('');
  const [residenceFilter, setResidenceFilter] = useState('ALL');

  // --- Initial Data Fetching ---
  useEffect(() => {
    fetchMasterData();
  }, []);

  async function fetchMasterData() {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, staffRes] = await Promise.all([
        apiRequest('/admin/departments'),
        apiRequest('/admin/staff')
      ]);
      const depts = deptRes.data.departments || [];
      setDepartments(depts);
      setStaffList(staffRes.data.staff || []);

      if (deptIdParam) {
        const activeDept = depts.find(d => d.id === deptIdParam);
        if (activeDept) {
          fetchDepartmentYears(deptIdParam);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load department records.');
    } finally {
      setLoading(false);
    }
  }

  // --- Level 2: Fetch Years when Department is Selected ---
  useEffect(() => {
    if (!deptIdParam) {
      setDepartmentYears([]);
      return;
    }
    fetchDepartmentYears(deptIdParam);
  }, [deptIdParam]);

  async function fetchDepartmentYears(deptId) {
    try {
      const res = await apiRequest(`/admin/departments/${deptId}/years`);
      setDepartmentYears(res.data.years || []);
    } catch (err) {
      console.error('Failed to load study years:', err);
      const found = departments.find(d => d.id === deptId);
      if (found?.studyYears) {
        setDepartmentYears(found.studyYears);
      }
    }
  }

  // --- Level 3: Fetch Sections when Year is Selected ---
  useEffect(() => {
    if (!yearIdParam) {
      setYearSections([]);
      return;
    }
    fetchYearSections(yearIdParam);
  }, [yearIdParam]);

  async function fetchYearSections(yearId) {
    try {
      const res = await apiRequest(`/admin/years/${yearId}/sections`);
      setYearSections(res.data.sections || []);
    } catch (err) {
      console.error('Failed to load sections:', err);
      const yr = departmentYears.find(y => y.id === yearId);
      if (yr?.sections) {
        setYearSections(yr.sections);
      }
    }
  }

  // --- Level 4: Fetch Students when Section is Selected ---
  useEffect(() => {
    if (deptIdParam && yearIdParam && sectionIdParam) {
      fetchSectionStudents();
    } else {
      setStudents([]);
    }
  }, [deptIdParam, yearIdParam, sectionIdParam]);

  // Derived current selected objects
  const currentDept = useMemo(() => {
    return departments.find(d => d.id === deptIdParam) || null;
  }, [departments, deptIdParam]);

  const currentYear = useMemo(() => {
    return departmentYears.find(y => y.id === yearIdParam) || null;
  }, [departmentYears, yearIdParam]);

  const currentSection = useMemo(() => {
    return yearSections.find(s => s.id === sectionIdParam) || null;
  }, [yearSections, sectionIdParam]);

  async function fetchSectionStudents() {
    if (!currentDept || !currentYear || !currentSection) return;
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const queryParams = new URLSearchParams({
        departmentId: currentDept.id,
        year: String(currentYear.year),
        section: currentSection.name
      });
      const res = await apiRequest(`/admin/students?${queryParams.toString()}`);
      setStudents(res.data.students || []);
    } catch (err) {
      setStudentsError(err.message || 'Failed to load students for this section.');
    } finally {
      setStudentsLoading(false);
    }
  }

  // Navigation handlers
  const navigateToLevel1 = () => setSearchParams({});
  const navigateToDepartment = (deptId) => setSearchParams({ deptId });
  const navigateToYear = (yearId) => {
    if (!deptIdParam) return;
    setSearchParams({ deptId: deptIdParam, yearId });
  };
  const navigateToSection = (sectionId) => {
    if (!deptIdParam || !yearIdParam) return;
    setSearchParams({ deptId: deptIdParam, yearId: yearIdParam, sectionId });
  };

  const handleBackNavigation = () => {
    if (sectionIdParam) {
      setSearchParams({ deptId: deptIdParam, yearId: yearIdParam });
    } else if (yearIdParam) {
      setSearchParams({ deptId: deptIdParam });
    } else if (deptIdParam) {
      setSearchParams({});
    }
  };

  const currentLevel = sectionIdParam ? 4 : yearIdParam ? 3 : deptIdParam ? 2 : 1;

  // Filtered Students in selected section
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const matchesSearch = !studentSearch.trim() || 
        st.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        st.registerNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        st.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        st.studentPhone?.includes(studentSearch.trim());

      const matchesResidence = residenceFilter === 'ALL' || st.residenceType === residenceFilter;

      return matchesSearch && matchesResidence;
    });
  }, [students, studentSearch, residenceFilter]);

  // Overall Statistics
  const totalStudentsCount = departments.reduce((acc, d) => acc + (d.studentCount || 0), 0);
  const totalYearsCount = departments.reduce((acc, d) => acc + (d.studyYears?.length || d.addedYears?.length || 0), 0);
  const totalSectionsCount = departments.reduce((acc, d) => {
    const years = d.studyYears || d.addedYears || [];
    return acc + years.reduce((yAcc, y) => yAcc + (y.sections?.length || 0), 0);
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Institutional Departments & Structure</h1>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Self-Assigned from Imported Student Details</span>
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-3xl">
            Departments, academic years, sections, and faculty assignments (Tutor, Class Advisor, HOD) are automatically organized and self-assigned directly from your imported student Excel dataset.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={fetchMasterData}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/import-students"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import Students Excel</span>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departments</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{departments.length}</p>
            <span className="text-[10px] text-slate-400">Auto-detected</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Study Years</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalYearsCount}</p>
            <span className="text-[10px] text-slate-400">1st to 4th Year</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Sections</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalSectionsCount}</p>
            <span className="text-[10px] text-slate-400">With assigned faculty</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{totalStudentsCount}</p>
            <span className="text-[10px] text-emerald-600 font-medium">Auto-enrolled</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation Trail */}
      {currentLevel > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center space-x-2 text-xs overflow-x-auto">
          <button
            onClick={handleBackNavigation}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors mr-1"
            title="Go back one level"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={navigateToLevel1}
            className="font-bold text-blue-600 hover:underline flex items-center space-x-1"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Departments</span>
          </button>

          {currentDept && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={() => navigateToDepartment(currentDept.id)}
                className={`font-bold transition-colors ${currentLevel === 2 ? 'text-slate-900' : 'text-blue-600 hover:underline'}`}
              >
                {currentDept.name} ({currentDept.code === 'AI_DS' ? 'AI & DS' : currentDept.code})
              </button>
            </>
          )}

          {currentYear && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={() => navigateToYear(currentYear.id)}
                className={`font-bold transition-colors ${currentLevel === 3 ? 'text-slate-900' : 'text-blue-600 hover:underline'}`}
              >
                Year {currentYear.year}
              </button>
            </>
          )}

          {currentSection && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold text-slate-900">
                Section {currentSection.name}
              </span>
            </>
          )}
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 space-y-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-semibold text-slate-700">Loading Department Structure...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-xs text-rose-700 space-y-2">
          <p className="font-bold">{error}</p>
          <button
            onClick={fetchMasterData}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-lg font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* LEVEL 1: ALL DEPARTMENTS DIRECTORY */}
      {!loading && !error && currentLevel === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Configured Departments</span>
            </h2>
            <span className="text-xs text-slate-500">
              Select any department to inspect its automatically assigned study years & faculty
            </span>
          </div>

          {departments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">No Departments Assigned Yet</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Departments, study years, class sections, and staff (Tutor, Class Advisor, HOD) will automatically create and assign themselves as soon as you import your student Excel dataset.
                </p>
              </div>
              <Link
                to="/admin/import-students"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Student Excel File</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => {
                const displayCode = dept.displayCode || (dept.code === 'AI_DS' ? 'AI & DS' : dept.code);
                const yearsList = dept.studyYears || dept.addedYears || [];

                return (
                  <div
                    key={dept.id}
                    onClick={() => navigateToDepartment(dept.id)}
                    className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-black rounded-lg text-xs font-mono">
                            {displayCode}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        </div>
                        <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">
                        {dept.name}
                      </h3>

                      {/* HOD Details */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Head of Department (HOD)
                        </span>
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{dept.hod?.name || 'Dr. N. Pavithra'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {dept.hod?.employeeId ? `Emp ID: ${dept.hod.employeeId}` : 'Sanctioning Authority'}
                        </p>
                      </div>
                    </div>

                    {/* Department Quick Stats Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {dept.studentCount || 0}
                        </span>
                        <span className="text-[10px] text-slate-400">Enrolled Students</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-700 text-sm block">
                          {yearsList.length || 4} Years
                        </span>
                        <span className="text-[10px] text-slate-400">Academic Hierarchy</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LEVEL 2: SELECTED DEPARTMENT STUDY YEARS */}
      {!loading && !error && currentLevel === 2 && currentDept && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs font-mono">
                    {currentDept.code === 'AI_DS' ? 'AI & DS' : currentDept.code}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{currentDept.name}</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enrolled Students: <strong className="text-slate-800">{currentDept.studentCount || 0}</strong> • Head of Department: <strong className="text-purple-700">{currentDept.hod?.name || 'Dr. N. Pavithra'}</strong>
                </p>
              </div>

              <button
                onClick={navigateToLevel1}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Departments</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Academic Study Years (Auto-Mapped)
            </h3>

            {departmentYears.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 space-y-2">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No active study years with students in this department.</p>
                <p className="text-slate-400">Import student Excel sheet to establish years and class sections automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {departmentYears.map((ay) => {
                  const studentCount = ay.studentCount || 0;
                  const secList = ay.sections || [];

                  return (
                    <div
                      key={ay.id || ay.year}
                      onClick={() => navigateToYear(ay.id)}
                      className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center">
                            Y{ay.year}
                          </span>
                          <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">
                          {ay.name || `${ay.year}th Year`}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {secList.length} {secList.length === 1 ? 'Section' : 'Sections'} Assigned
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Enrolled:</span>
                        <span className="font-bold text-slate-900">{studentCount} Students</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEVEL 3: SELECTED YEAR CLASS SECTIONS */}
      {!loading && !error && currentLevel === 3 && currentDept && currentYear && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs font-mono">
                    {currentDept.code === 'AI_DS' ? 'AI & DS' : currentDept.code}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    {currentDept.name} • {currentYear.name || `Year ${currentYear.year}`}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enrolled Students: <strong className="text-slate-800">{currentYear.studentCount || 0}</strong> • Class Sections with Self-Assigned Faculty Hierarchy
                </p>
              </div>

              <button
                onClick={() => navigateToDepartment(currentDept.id)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Years</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Class Sections & Automatically Assigned Faculty
            </h3>

            {yearSections.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 space-y-2">
                <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No sections found for this study year.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {yearSections.map((sec) => {
                  const studentCount = sec.studentCount !== undefined ? sec.studentCount : (sec._count?.students || 0);

                  return (
                    <div
                      key={sec.id}
                      onClick={() => navigateToSection(sec.id)}
                      className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 font-bold text-sm flex items-center justify-center">
                              {sec.name}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              Section {sec.name}
                            </span>
                          </div>
                          <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>

                        {/* Self-Assigned Faculty Details */}
                        <div className="mt-3 space-y-2 text-xs">
                          {/* Tutors */}
                          <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                                Tutor{(sec.tutors && sec.tutors.length > 1) || (sec.tutor && sec.tutor2) ? `s (${(sec.tutors && sec.tutors.length) || 2})` : ''}
                              </span>
                              <span className="text-[10px] text-blue-600 font-semibold font-mono">
                                Stage 1
                              </span>
                            </div>

                            <div className="space-y-1.5 divide-y divide-blue-100/60">
                              {(sec.tutors && sec.tutors.length > 0 
                                ? sec.tutors 
                                : [sec.tutor, sec.tutor2].filter(Boolean)
                              ).map((tut, idx) => (
                                <div key={tut.id || idx} className={`${idx > 0 ? 'pt-1.5' : ''} flex items-center justify-between`}>
                                  <div>
                                    <span className="font-bold text-slate-900 block leading-tight">
                                      {tut.name}
                                    </span>
                                    {tut.studentCount > 0 && (
                                      <span className="text-[10px] text-blue-700 font-medium block">
                                        {tut.studentCount} students
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-blue-600 font-mono bg-blue-100/80 px-1.5 py-0.5 rounded">
                                    {tut.employeeId || `Tutor ${idx + 1}`}
                                  </span>
                                </div>
                              ))}

                              {(!sec.tutors || sec.tutors.length === 0) && !sec.tutor && !sec.tutor2 && (
                                <span className="font-bold text-slate-900 block">
                                  Tutor via Excel
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Class Advisor */}
                          <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                                Class Advisor
                              </span>
                              <span className="font-bold text-slate-900 block">
                                {sec.classAdvisor?.name || 'Assigned via Excel'}
                              </span>
                            </div>
                            <span className="text-[10px] text-indigo-600 font-mono">
                              {sec.classAdvisor?.employeeId || 'Stage 2'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Class Strength:</span>
                        <span className="font-bold text-slate-900">{studentCount} Students</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEVEL 4: ENROLLED STUDENTS ROSTER IN SECTION */}
      {!loading && !error && currentLevel === 4 && currentDept && currentYear && currentSection && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs font-mono">
                    {currentDept.code === 'AI_DS' ? 'AI & DS' : currentDept.code}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    {currentDept.name} • Year {currentYear.year} - Section {currentSection.name}
                  </h2>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1 flex-wrap gap-y-1">
                  <span>
                    Tutor{(currentSection.tutors && currentSection.tutors.length > 1) || (currentSection.tutor && currentSection.tutor2) ? 's' : ''}:{' '}
                    <strong className="text-blue-700">
                      {currentSection.tutors && currentSection.tutors.length > 0
                        ? currentSection.tutors.map(t => `${t.name}${t.studentCount ? ` (${t.studentCount} students)` : ''}`).join(' • ')
                        : [currentSection.tutor?.name, currentSection.tutor2?.name].filter(Boolean).join(' • ') || 'Tutor'}
                    </strong>
                  </span>
                  <span>Class Advisor: <strong className="text-indigo-700">{currentSection.classAdvisor?.name || 'Assigned'}</strong></span>
                  <span>HOD: <strong className="text-purple-700">{currentDept.hod?.name || 'Dr. N. Pavithra'}</strong></span>
                </div>
              </div>

              <button
                onClick={() => navigateToYear(currentYear.id)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Sections</span>
              </button>
            </div>
          </div>

          {/* Section Students Table with Search & Filter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Enrolled Students ({filteredStudents.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  (Auto-enrolled in Section {currentSection.name})
                </span>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                {/* Residence Filter */}
                <select
                  value={residenceFilter}
                  onChange={(e) => setResidenceFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Residents</option>
                  <option value="DAYSCHOLAR">Day Scholars</option>
                  <option value="HOSTEL">Hostelers</option>
                </select>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, reg no..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {studentsLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading students in Section {currentSection.name}...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No students found matching current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Register Number</th>
                      <th className="py-2.5 px-3">Tutor</th>
                      <th className="py-2.5 px-3">Roll Number</th>
                      <th className="py-2.5 px-3">Contact Details</th>
                      <th className="py-2.5 px-3">Residence Status</th>
                      <th className="py-2.5 px-3">Admission Cutoff</th>
                      <th className="py-2.5 px-3 text-right">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{st.name}</span>
                          <span className="text-[10px] text-slate-400">{st.email}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {st.registerNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-blue-900 block leading-tight">
                            {st.tutor?.name || currentSection.tutor?.name || 'Tutor'}
                          </span>
                          <span className="text-[10px] text-blue-600 font-mono">
                            {st.tutor?.employeeId || ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-slate-700 font-medium">
                            {st.rollNumber || 'Not assigned'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 space-y-0.5">
                          {st.studentPhone && (
                            <div className="flex items-center space-x-1 text-slate-600 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="font-mono">{st.studentPhone}</span>
                            </div>
                          )}
                          {st.parentPhone && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Parent: {st.parentPhone}
                            </span>
                          )}
                          {!st.studentPhone && !st.parentPhone && (
                            <span className="text-slate-400 italic text-[10px]">Not provided</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {st.residenceType === 'HOSTEL' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Home className="w-3 h-3 text-amber-600" />
                              <span>Hosteler</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Bus className="w-3 h-3 text-emerald-600" />
                              <span>Day Scholar</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800">
                            {st.cutoff !== null && st.cutoff !== undefined ? `${st.cutoff} / 200` : <span className="text-slate-400 italic font-normal text-[10px]">N/A</span>}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.user?.active !== false
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.user?.active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{st.user?.active !== false ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
