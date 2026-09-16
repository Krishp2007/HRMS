import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';
import ConfirmModal from './ConfirmModal';
import {
  Building,
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  LogOut,
  UserCheck,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ...(user?.role === 'HR' || user?.role === 'Manager'
      ? [{ name: 'Employees', path: '/employees', icon: Users }]
      : []),
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Leave Requests', path: '/leaves', icon: CalendarDays },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Brand - Clickable to redirect to Dashboard */}
            <Link to="/" className="flex items-center gap-3 cursor-pointer group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                  AppTrait <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">HRMS</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-sky-50/80 p-1 rounded-2xl border border-blue-100">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-800 hover:text-blue-700 hover:bg-blue-100/60'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right User Controls */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-sky-50/80 p-1.5 pr-3 hover:bg-blue-100/60 transition-all focus:outline-none"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs shadow-sm">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left leading-tight hidden lg:block">
                    <div className="text-xs font-black text-slate-900">{user?.fullName}</div>
                    <div className="text-[10px] font-bold text-blue-700">{user?.role}</div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-700 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-blue-100 bg-white p-2 shadow-xl shadow-blue-500/10 z-50">
                    <div className="p-3 border-b border-slate-100 bg-sky-50/50 rounded-xl mb-1">
                      <p className="text-xs font-black text-slate-900">{user?.fullName}</p>
                      <p className="text-xs text-slate-600 font-mono font-bold mt-0.5">{user?.email}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant={user?.role} size="xs">{user?.role}</Badge>
                        <span className="text-[10px] font-mono font-black text-blue-700">{user?.employeeId}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-black text-slate-800 hover:bg-sky-50 rounded-xl transition-all"
                    >
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <span>My Account Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <LogOut className="h-4 w-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-800 hover:bg-sky-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-blue-100 bg-white p-4 space-y-4 shadow-lg">
            <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-2xl border border-blue-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">{user?.fullName}</p>
                <p className="text-xs text-slate-600 font-mono font-bold">{user?.employeeId} • {user?.role}</p>
              </div>
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-900 hover:bg-sky-50'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-900 hover:bg-sky-50 rounded-xl"
              >
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span>My Account Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-rose-700 bg-rose-50 rounded-xl"
              >
                <LogOut className="h-4 w-4 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your AppTrait HRMS account?"
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        variant="info"
      />
    </>
  );
};

export default Navbar;
