import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  UserCheck,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['HR', 'Manager', 'Employee'],
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: Users,
      roles: ['HR', 'Manager'],
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: Clock,
      roles: ['HR', 'Manager', 'Employee'],
    },
    {
      name: 'Leave Requests',
      path: '/leaves',
      icon: CalendarDays,
      roles: ['HR', 'Manager', 'Employee'],
    },
    {
      name: 'My Profile',
      path: '/profile',
      icon: UserCheck,
      roles: ['HR', 'Manager', 'Employee'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/50 p-4 backdrop-blur-xl">
      <div className="mb-4 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation Menu</span>
      </div>
      <nav className="space-y-1.5">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
