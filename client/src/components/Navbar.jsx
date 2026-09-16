import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';
import {
  Building,
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const role = user.role;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['HR', 'Manager', 'Employee'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['HR', 'Manager'] },
    { name: 'Attendance', path: '/attendance', icon: Clock, roles: ['HR', 'Manager', 'Employee'] },
    { name: 'Leave Requests', path: '/leaves', icon: CalendarDays, roles: ['HR', 'Manager', 'Employee'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-3 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="rounded-2xl border border-blue-100 bg-white/95 backdrop-blur-md shadow-md shadow-blue-500/5 px-4 py-2.5 transition-all">
        <div className="flex items-center justify-between gap-4">
          {/* Light Blue Brand Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-all">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-slate-900">AppTrait</span>
                <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 border border-sky-200">HRMS</span>
              </div>
            </div>
          </NavLink>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-sky-50/60 p-1 rounded-xl border border-sky-100">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-blue-700'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Dropdown (Desktop Only) */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl p-1 border border-blue-100 bg-sky-50/50 hover:bg-sky-100/80 transition-all group"
                title="User Profile Menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs shadow-sm">
                  {user.fullName.charAt(0)}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-900 transition-colors mr-1" />
              </button>

              {/* Desktop Profile Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-blue-100 bg-white p-3 shadow-xl backdrop-blur-md animate-fade-in z-50 space-y-2">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50/80 border border-sky-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm shadow-sm">
                      {user.fullName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1">
                        <Badge variant={user.role} size="xs">{user.role}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-blue-700 transition-all text-left"
                    >
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <span>My Profile & Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all text-left"
                    >
                      <LogOut className="h-4 w-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-xl border border-blue-100 bg-sky-50 p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 mt-3 pt-3 space-y-2 animate-fade-in">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50 border border-sky-100 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
              <Badge variant={user.role} size="xs">{user.role}</Badge>
            </div>

            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-sky-50 hover:text-blue-700'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/profile');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-blue-700 text-left"
            >
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span>My Profile & Settings</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all text-left"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
