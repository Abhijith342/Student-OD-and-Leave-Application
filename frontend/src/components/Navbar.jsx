import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, LogOut, Menu, X, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ toggleSidebar, sidebarOpen }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, clearAllNotifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleDisplayNames = {
    STUDENT: 'Student',
    TUTOR: 'Tutor',
    CLASS_ADVISOR: 'Class Advisor',
    HOD: 'Head of Department (HOD)',
    PRINCIPAL_OFFICE: 'Principal Office Staff',
    ADMIN: 'System Admin'
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Dr. N.G.P. IT Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Dr. N.G.P. Institute of Technology</h1>
              <p className="text-xs text-blue-600 font-semibold hidden sm:block">
                OD & Leave Portal • {user?.studentProfile?.department?.name || user?.staffProfile?.department?.name || 'AI & DS Dept'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {/* Role Badge */}
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            {roleDisplayNames[user?.role] || user?.role}
          </span>

          {/* Settings Icon */}
          <Link
            to="/settings"
            title="Settings"
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">{unreadCount} unread</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => clearAllNotifications()}
                        className="text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          setShowNotifications(false);
                          navigate('/notifications');
                        }}
                        className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                          !n.isRead ? 'bg-blue-50/50 font-medium' : ''
                        }`}
                      >
                        <p className="text-slate-800">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 text-center bg-slate-50">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <Link
            to="/profile"
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
              {user?.studentProfile?.name?.[0] || user?.staffProfile?.name?.[0] || user?.username?.[0] || 'U'}
            </div>
            <span className="text-sm font-semibold text-slate-800 hidden lg:inline">
              {user?.studentProfile?.name || user?.staffProfile?.name || user?.username}
            </span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
