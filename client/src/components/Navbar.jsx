import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Building } from 'lucide-react';
import Badge from './Badge';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-xl">
      {/* Brand & Organization */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md">
          <Building className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-white tracking-tight">AppTrait HRMS</h1>
          <p className="text-xs text-slate-400">Enterprise Operations Platform</p>
        </div>
      </div>

      {/* User Info & Actions */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 border-r border-slate-800 pr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 ring-2 ring-indigo-500/30">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{user.fullName}</span>
                <Badge variant={user.role}>{user.role}</Badge>
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
