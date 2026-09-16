import React, { useState, useEffect } from 'react';
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
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const role = user.role;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['HR', 'Manager', 'Employee'] },
    { name: 'Employees Directory', path: '/employees', icon: Users, roles: ['HR', 'Manager'] },
    { name: 'Attendance Hub', path: '/attendance', icon: Clock, roles: ['HR', 'Manager', 'Employee'] },
    { name: 'Leave Requests', path: '/leaves', icon: CalendarDays, roles: ['HR', 'Manager', 'Employee'] },
    { name: 'My Profile', path: '/profile', icon: UserCheck, roles: ['HR', 'Manager', 'Employee'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo & Live Clock */}
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight text-white">AppTrait</span>
                  <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">HRMS</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Enterprise Management</p>
              </div>
            </NavLink>

            {/* Live Clock Badge */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 font-mono text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/80">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-1.5 pr-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs ring-2 ring-indigo-500/30">
                {user.fullName.charAt(0)}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white max-w-[120px] truncate">{user.fullName}</span>
                  <Badge variant={user.role} size="xs">{user.role}</Badge>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{user.employeeId}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Logout</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-2 animate-fade-in">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{user.fullName}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
            <div className="ml-auto">
              <Badge variant={user.role} size="xs">{user.role}</Badge>
            </div>
          </div>

          <div className="space-y-1 pt-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
