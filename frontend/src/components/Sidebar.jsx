import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileCheck, 
  CalendarOff, 
  FileText, 
  Bell, 
  User, 
  LogOut,
  ClipboardList,
  Settings,
  Users,
  UserCheck,
  Building2,
  GitFork,
  Upload,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';

  const studentNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Apply OD', path: '/apply-od', icon: FileCheck },
    { name: 'Apply Leave', path: '/apply-leave', icon: CalendarOff },
    { name: 'My Applications', path: '/my-applications', icon: FileText },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const staffNav = [
    { name: 'Dashboard Queue', path: '/dashboard', icon: ClipboardList },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Staff Members', path: '/admin/staff', icon: UserCheck },
    { name: 'Departments', path: '/admin/departments', icon: Building2 },
    { name: 'Import Students', path: '/admin/import-students', icon: Upload },
    { name: 'Applications', path: '/admin/applications', icon: FileText },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  const navItems = isAdmin ? adminNav : (isStudent ? studentNav : staffNav);

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 h-screen flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
              <img src="/logo.png" alt="Dr. N.G.P. IT" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-white text-xs tracking-wide">Dr. N.G.P. IT</h2>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase block">OD & Leave System</span>
            </div>
          </div>

          {/* User Brief Info Card */}
          <div className="m-4 p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-xs">
            <p className="text-slate-400 font-medium">Logged in as:</p>
            <p className="font-bold text-white truncate text-sm mt-0.5">
              {user?.studentProfile?.name || user?.staffProfile?.name || user?.username}
            </p>
            <p className="text-[11px] text-blue-400 mt-0.5 font-medium">
              {user?.studentProfile?.registerNumber || user?.staffProfile?.employeeId || user?.role}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-rose-900/40 hover:text-rose-300 font-medium text-sm transition-colors border border-slate-700/50"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
