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

  // Close dropdown when clicking outside
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
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-xl shadow-2xl px-4 py-2.5 transition-all">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <Building className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">AppTrait</span>
                <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/20">HRMS</span>
              </div>
            </div>
          </NavLink>

          {/* Floating Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/60">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Image Icon & Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl p-1 border border-slate-800 bg-slate-950/80 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group"
                title="User Profile Menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xs ring-2 ring-indigo-500/30 group-hover:ring-indigo-400">
                  {user.fullName.charAt(0)}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors mr-1" />
              </button>

              {/* Profile Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-2xl animate-fade-in z-50 space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm">
                      {user.fullName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1">
                        <Badge variant={user.role} size="xs">{user.role}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all text-left"
                    >
                      <UserCheck className="h-4 w-4 text-indigo-400" />
                      <span>My Profile & Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all text-left"
                    >
                      <LogOut className="h-4 w-4 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 mt-3 pt-3 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              <UserCheck className="h-4 w-4 text-indigo-400" />
              <span>My Profile</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
